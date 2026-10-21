/**
 * KineFlow AI - Full-Stack Express Server with Gemini AI & Vite Middleware
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  initialAppointments,
  initialAuditLogs,
  initialClinicConfig,
  initialPatients,
  initialProposals,
  initialTransactions,
  initialWhatsAppMessages,
  todayStr,
  tomorrowStr,
} from './src/data/mockDatabase.ts';
import {
  AIProposal,
  Appointment,
  AuditLogItem,
  ClinicConfig,
  EvolutionEntry,
  Patient,
  PaymentTransaction,
  TreatmentArea,
  WhatsAppMessage,
} from './src/types/index.ts';
import {
  checkSlotConflict,
  determineAutonomyAction,
  generateDelayBroadcastMessage,
} from './src/domain/rules.ts';
import {
  analyzePaymentReceipt,
  generateDailyClinicalSummary,
  interpretPatientMessageSofi,
} from './src/services/geminiService.ts';
import twilio from 'twilio';

dotenv.config();

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// In-Memory Reactive Store (State)
let clinicConfig: ClinicConfig = { ...initialClinicConfig };
let patients: Patient[] = [...initialPatients];
let appointments: Appointment[] = [...initialAppointments];
let proposals: AIProposal[] = [...initialProposals];
let transactions: PaymentTransaction[] = [...initialTransactions];
let auditLogs: AuditLogItem[] = [...initialAuditLogs];

let whatsappMessages: WhatsAppMessage[] = [...initialWhatsAppMessages];

// Twilio WhatsApp webhook. Configure TWILIO_WEBHOOK_URL con la URL HTTPS pública exacta.
function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function normalizePhoneForMatch(value: string): string {
  // Twilio envía "whatsapp:+549..." y la ficha puede contener "+54 9 ...".
  return value.replace(/\D/g, '');
}

app.post('/webhook/twilio', async (req: Request, res: Response) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const webhookUrl = process.env.TWILIO_WEBHOOK_URL;
  const signature = req.header('X-Twilio-Signature') || '';

  if (!authToken || !webhookUrl) {
    console.error('[Twilio] Faltan TWILIO_AUTH_TOKEN o TWILIO_WEBHOOK_URL.');
    res.status(503).type('text/plain').send('Webhook no configurado');
    return;
  }
  if (!signature || !twilio.validateRequest(authToken, signature, webhookUrl, req.body)) {
    res.status(403).type('text/plain').send('Firma de Twilio inválida');
    return;
  }

  const from = String(req.body?.From || '');
  const body = String(req.body?.Body || '').trim();
  const messageId = String(req.body?.MessageSid || 'twilio-' + Date.now());
  const senderNumber = from.replace(/^whatsapp:/i, '');
  const normalizedSender = normalizePhoneForMatch(senderNumber);
  // Evita asociar pacientes por últimos dígitos: se exige coincidencia internacional exacta.
  const matchingPatients = patients.filter((p) => {
    const patientPhone = normalizePhoneForMatch(p.phone);
    return patientPhone.length >= 10 && patientPhone === normalizedSender;
  });

  let responseText = '';
  try {
    if (matchingPatients.length !== 1) {
      responseText = matchingPatients.length === 0
        ? 'Hola. No pude asociar este número a una ficha de paciente. Por favor, comunicate con el consultorio para verificar tus datos.'
        : 'Hola. Necesitamos verificar tus datos antes de gestionar turnos. Por favor, comunicate con el consultorio.';
    } else if (!body) {
      responseText = 'Hola. Por ahora puedo procesar mensajes de texto. Escribime qué turno necesitás y te ayudo.';
    } else {
      const patient = matchingPatients[0];
      whatsappMessages.push({
        id: messageId,
        patientId: patient.id,
        sender: 'patient',
        type: 'text',
        content: body,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      });

      const interpretation = await interpretPatientMessageSofi({
        message: body,
        patient,
        clinicConfig,
        existingAppointments: appointments,
        currentDateStr: todayStr,
      });
      responseText = interpretation.patient_message || 'Recibí tu mensaje. El consultorio lo revisará.';

      if (interpretation.intent === 'SOLICITAR_TURNO' && interpretation.proposed_slot) {
        const proposedDate = interpretation.proposed_slot.date;
        const proposedTime = interpretation.proposed_slot.time;
        const endTime = getEndTime(proposedTime);
        const area = 'Box 1 - Fisioterapia' as TreatmentArea;
        const conflict = checkSlotConflict({ date: proposedDate, startTime: proposedTime, endTime, area }, appointments);
        // En producción, los turnos quedan pendientes de aprobación del kinesiólogo.
        const proposal: AIProposal = {
          id: 'prop-wa-' + messageId,
          patientId: patient.id,
          patientName: patient.fullName,
          patientPhone: patient.phone,
          incomingMessage: body,
          isAudio: false,
          proposedDate,
          proposedTime,
          proposedArea: area,
          clinicalReasoning: interpretation.internal_summary,
          conflictStatus: conflict.hasConflict ? 'requires_override' : 'no_conflict',
          status: 'pending',
          confidenceScore: interpretation.confidence_score || 0,
          createdAt: new Date().toISOString(),
        };
        proposals.unshift(proposal);
        responseText = conflict.hasConflict
          ? 'Gracias por escribir. Ese horario parece ocupado; dejamos tu solicitud pendiente de revisión por el kinesiólogo y te confirmaremos una alternativa.'
          : 'Recibimos tu solicitud de turno. Quedó pendiente de confirmación del consultorio; te avisaremos por este medio.';
      }

      whatsappMessages.push({
        id: 'wa-out-' + messageId,
        patientId: patient.id,
        sender: 'clinic_ai',
        type: 'text',
        content: responseText,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      });
    }

    const twiml = responseText
      ? '<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + xmlEscape(responseText) + '</Message></Response>'
      : '<?xml version="1.0" encoding="UTF-8"?><Response/>';
    res.status(200).type('text/xml').send(twiml);
  } catch (error) {
    console.error('[Twilio] Error procesando mensaje entrante:', error);
    // Twilio recibe una respuesta válida; no se expone información interna al usuario.
    res.status(200).type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>Disculpá, hubo un inconveniente. El consultorio revisará tu mensaje y te responderá.</Message></Response>');
  }
});

// GET full state
app.get('/api/state', (_req: Request, res: Response) => {
  res.json({
    clinicConfig,
    patients,
    appointments,
    proposals,
    transactions,
    auditLogs,
    whatsappMessages,
    currentDateStr: todayStr,
  });
});

// POST Update Clinic Config
app.post('/api/config', (req: Request, res: Response) => {
  clinicConfig = { ...clinicConfig, ...req.body };
  res.json({ success: true, clinicConfig });
});

// POST Add Evolution Entry to Patient
app.post('/api/patients/:id/evolution', (req: Request, res: Response) => {
  const patientId = req.params.id;
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) {
    res.status(404).json({ error: 'Paciente no encontrado' });
    return;
  }

  const newEntry: EvolutionEntry = {
    id: 'evo-' + Date.now(),
    date: req.body.date || todayStr,
    sessionNumber: patient.currentTreatment.completedSessions + 1,
    totalSessions: patient.currentTreatment.totalSessions,
    evaPainScale: Number(req.body.evaPainScale) || 0,
    romMobility: req.body.romMobility || '',
    interventions: req.body.interventions || [],
    notes: req.body.notes || '',
    physioName: clinicConfig.kinesiologistName,
  };

  patient.evolutionHistory = [newEntry, ...patient.evolutionHistory];
  if (patient.currentTreatment.completedSessions < patient.currentTreatment.totalSessions) {
    patient.currentTreatment.completedSessions += 1;
  }

  res.json({ success: true, patient, newEntry });
});

// Envío real de mensajes de WhatsApp mediante Twilio.
async function sendTwilioWhatsApp(toPhone: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!accountSid || !authToken || !from) {
    throw new Error('Faltan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_WHATSAPP_FROM');
  }
  const to = 'whatsapp:' + toPhone.replace(/^whatsapp:/i, '').replace(/\s/g, '');
  const client = twilio(accountSid, authToken);
  await client.messages.create({ from, to, body });
}

// POST Handle AI Proposal Action (Approve, Modify, Reject)
app.post('/api/proposals/action', async (req: Request, res: Response) => {
  const { proposalId, action, finalDate, finalTime, finalArea, feedbackReason } = req.body;
  const proposal = proposals.find((p) => p.id === proposalId);

  if (!proposal) {
    res.status(404).json({ error: 'Propuesta no encontrada' });
    return;
  }

  const patient = patients.find((p) => p.id === proposal.patientId);

  if (action === 'approved' || action === 'modified') {
    proposal.status = action;
    const targetDate = finalDate || proposal.proposedDate;
    const targetTime = finalTime || proposal.proposedTime;
    const targetArea = finalArea || proposal.proposedArea;

    // Crear turno oficial en la agenda
    const nextSessionNum = patient ? patient.currentTreatment.completedSessions + 1 : 1;
    const totalSessions = patient ? patient.currentTreatment.totalSessions : 10;
    const newAppointment: Appointment = {
      id: 'app-' + Date.now(),
      patientId: proposal.patientId,
      patientName: proposal.patientName,
      patientPhone: proposal.patientPhone,
      date: targetDate,
      startTime: targetTime,
      endTime: getEndTime(targetTime),
      area: targetArea,
      sessionNumber: nextSessionNum,
      totalSessions,
      status: 'confirmed',
      isPaid: false,
      price: patient?.insurance === 'Particular' ? clinicConfig.sessionPriceStandard : clinicConfig.sessionPriceInsurance,
      notes: `Agendado vía IA supervisada (${action === 'approved' ? 'Aprobado sin cambios' : 'Ajustado por kinesiólogo'}).`,
      aiSuggested: true,
      aiReasoning: proposal.clinicalReasoning,
    };

    appointments.push(newAppointment);

    // Mensaje automático al paciente por WhatsApp (F3: Firestore/State Trigger)
    const waReply: WhatsAppMessage = {
      id: 'wa-' + Date.now(),
      patientId: proposal.patientId,
      sender: 'clinic_ai',
      type: 'text',
      content: `¡Listo ${proposal.patientName.split(' ')[0]}! Turno confirmado con el Lic. ${clinicConfig.kinesiologistName} para el ${formatDate(targetDate)} a las ${targetTime} hs en ${targetArea}. ¡Te esperamos!`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    whatsappMessages.push(waReply);

    // Enviar la confirmación real por WhatsApp. Si falla, conservar la propuesta
    // y dejar el error registrado para que pueda corregirse la configuración.
    try {
      await sendTwilioWhatsApp(
        proposal.patientPhone,
        waReply.content,
      );
    } catch (error) {
      console.error('[Twilio] No se pudo enviar la confirmación de turno:', error);
      waReply.status = 'failed';
    }

    // Registrar en auditoría de aprendizaje de la IA
    const auditItem: AuditLogItem = {
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      proposalId: proposal.id,
      patientName: proposal.patientName,
      action: action === 'approved' ? 'approved' : 'modified',
      originalSlot: `${proposal.proposedDate} ${proposal.proposedTime} - ${proposal.proposedArea}`,
      finalSlot: `${targetDate} ${targetTime} - ${targetArea}`,
      feedbackReason: feedbackReason || (action === 'approved' ? 'Aprobado por el profesional' : 'Ajuste manual de franja horaria'),
      kinesiologistOverride: action === 'modified',
    };
    auditLogs = [auditItem, ...auditLogs];
  } else if (action === 'rejected') {
    proposal.status = 'rejected';
    proposal.rejectionReason = feedbackReason;

    const auditItem: AuditLogItem = {
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      proposalId: proposal.id,
      patientName: proposal.patientName,
      action: 'rejected',
      originalSlot: `${proposal.proposedDate} ${proposal.proposedTime} - ${proposal.proposedArea}`,
      finalSlot: 'Rechazado',
      feedbackReason: feedbackReason || 'Rechazado por criterio clínico del kinesiólogo',
      kinesiologistOverride: true,
    };
    auditLogs = [auditItem, ...auditLogs];
  }

  res.json({ success: true, proposal, appointments, auditLogs, whatsappMessages });
});

// POST WhatsApp Simulator / Twilio Webhook (F1)
app.post('/api/whatsapp/simulate', async (req: Request, res: Response) => {
  const { patientId, type, content, imageBase64, audioTranscript } = req.body;
  const patient = patients.find((p) => p.id === patientId) || patients[0];

  const incomingWa: WhatsAppMessage = {
    id: 'wa-' + Date.now(),
    patientId: patient.id,
    sender: 'patient',
    type: type || 'text',
    content: type === 'audio' ? (audioTranscript || 'Nota de voz de WhatsApp') : content,
    timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    status: 'read',
  };
  whatsappMessages.push(incomingWa);

  // Si es un comprobante de pago multimodal
  if (type === 'image_receipt' && imageBase64) {
    const analysis = await analyzePaymentReceipt({
      imageBase64: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
      mimeType: 'image/jpeg',
      expectedAmount: patient.balance > 0 ? patient.balance : clinicConfig.sessionPriceStandard,
      clinicCbu: clinicConfig.cbu,
      clinicAlias: clinicConfig.alias,
    });

    // Crear transacción
    const newTx: PaymentTransaction = {
      id: 'tx-' + Date.now(),
      patientId: patient.id,
      patientName: patient.fullName,
      date: todayStr,
      amount: analysis.detectedAmount,
      method: 'Transferencia',
      status: analysis.isMatch ? 'verified' : 'pending_verification',
      referenceId: analysis.operationId,
      extractedData: {
        cbuDestination: analysis.destinationCbuOrAlias,
        senderName: analysis.senderName,
        rawDate: analysis.transactionDate,
        detectedAmount: analysis.detectedAmount,
        confidence: analysis.confidence,
      },
    };
    transactions = [newTx, ...transactions];

    if (analysis.isMatch && patient.balance > 0) {
      patient.balance = Math.max(0, patient.balance - analysis.detectedAmount);
    }

    const aiReplyMsg: WhatsAppMessage = {
      id: 'wa-reply-' + Date.now(),
      patientId: patient.id,
      sender: 'clinic_ai',
      type: 'text',
      content: `¡Muchas gracias ${patient.fullName.split(' ')[0]}! Recibí tu comprobante por $${analysis.detectedAmount.toLocaleString('es-AR')}. Ya quedó acreditado en tu ficha clínica. ¡Nos vemos en tu próxima sesión!`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    whatsappMessages.push(aiReplyMsg);

    res.json({
      success: true,
      type: 'receipt',
      analysis,
      transaction: newTx,
      patient,
      whatsappMessages,
    });
    return;
  }

  // Si es mensaje de texto o nota de voz
  const messageText = type === 'audio' ? (audioTranscript || content) : content;
  const interpretation = await interpretPatientMessageSofi({
    message: messageText,
    patient,
    clinicConfig,
    existingAppointments: appointments,
    currentDateStr: todayStr,
  });

  if (interpretation.intent === 'MENSAJE_IGNORADO') {
    const replyMsg: WhatsAppMessage = {
      id: 'wa-ai-' + Date.now(),
      patientId: patient.id,
      sender: 'clinic_ai',
      type: 'text',
      content: interpretation.patient_message,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    whatsappMessages.push(replyMsg);
    res.json({
      success: true,
      interpretation,
      proposal: null,
      whatsappMessages,
    });
    return;
  }

  const bestSlot = {
    date: interpretation.proposed_slot?.date || tomorrowStr,
    startTime: interpretation.proposed_slot?.time || '16:00',
    endTime: getEndTime(interpretation.proposed_slot?.time || '16:00'),
    area: 'Box 1 - Fisioterapia' as TreatmentArea,
    justification: interpretation.internal_summary,
  };

  const conflictCheck = checkSlotConflict(
    { date: bestSlot.date, startTime: bestSlot.startTime, endTime: bestSlot.endTime, area: bestSlot.area },
    appointments
  );

  const autonomyDecision = determineAutonomyAction(
    clinicConfig.autonomyLevel,
    Boolean(patient.currentTreatment.completedSessions > 0),
    conflictCheck.hasConflict,
    true
  );

  let newProposal: AIProposal | null = null;

  if (autonomyDecision.action === 'auto_book') {
    // Nivel 3: Auto-agenda
    const nextSession = patient.currentTreatment.completedSessions + 1;
    const bookedApp: Appointment = {
      id: 'app-auto-' + Date.now(),
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      date: bestSlot.date,
      startTime: bestSlot.startTime,
      endTime: bestSlot.endTime,
      area: bestSlot.area,
      sessionNumber: nextSession,
      totalSessions: patient.currentTreatment.totalSessions,
      status: 'confirmed',
      isPaid: false,
      price: patient.insurance === 'Particular' ? clinicConfig.sessionPriceStandard : clinicConfig.sessionPriceInsurance,
      notes: 'Auto-agendado por IA Nivel 3 (Paciente habitual)',
      aiSuggested: true,
      aiReasoning: bestSlot.justification,
    };
    appointments.push(bookedApp);

    auditLogs.unshift({
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      proposalId: 'auto-' + Date.now(),
      patientName: patient.fullName,
      action: 'auto_booked',
      originalSlot: `${bestSlot.date} ${bestSlot.startTime}`,
      finalSlot: `${bestSlot.date} ${bestSlot.startTime}`,
      feedbackReason: 'Auto-confirmado por motor de autonomía nivel 3.',
      kinesiologistOverride: false,
    });
  } else {
    // Nivel 1 o 2: Genera propuesta para el kinesiólogo
    newProposal = {
      id: 'prop-' + Date.now(),
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      incomingMessage: messageText,
      isAudio: type === 'audio',
      audioDurationSec: type === 'audio' ? 24 : undefined,
      audioTranscript: type === 'audio' ? messageText : undefined,
      proposedDate: bestSlot.date,
      proposedTime: bestSlot.startTime,
      proposedArea: bestSlot.area,
      clinicalReasoning: interpretation.internal_summary,
      conflictStatus: conflictCheck.hasConflict ? 'requires_override' : 'no_conflict',
      status: 'pending',
      confidenceScore: interpretation.confidence_score || 95,
      createdAt: new Date().toISOString(),
    };
    proposals.unshift(newProposal);
  }

  // Respuesta de IA por WhatsApp
  const replyMsg: WhatsAppMessage = {
    id: 'wa-ai-' + Date.now(),
    patientId: patient.id,
    sender: 'clinic_ai',
    type: 'text',
    content: interpretation.patient_message,
    timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    status: 'sent',
    interactiveOptions: ['Confirmar turno', 'Ver otro horario', 'Consultar a Sofi'],
  };
  whatsappMessages.push(replyMsg);

  res.json({
    success: true,
    interpretation,
    proposal: newProposal,
    autonomyDecision,
    appointments,
    proposals,
    auditLogs,
    whatsappMessages,
  });
});

// POST Broadcast Delay (A4: Avisos de Demora/Adelanto con 1 Click)
app.post('/api/broadcast/delay', (req: Request, res: Response) => {
  const { delayMinutes, type } = req.body; // delay (15, 30) o advance
  const isAdvance = type === 'advance';

  // Buscar turnos de hoy que estén pendientes o confirmados a partir de ahora
  const todayApps = appointments.filter(
    (a) => a.date === todayStr && (a.status === 'confirmed' || a.status === 'in_progress')
  );

  const notificationsSent: Array<{ patientName: string; phone: string; message: string }> = [];

  todayApps.forEach((app) => {
    const message = generateDelayBroadcastMessage(
      clinicConfig.kinesiologistName,
      app.patientName,
      delayMinutes || 15,
      app.startTime,
      isAdvance ? 'advance' : 'delay'
    );

    // Ajustar horario si es demora
    if (!isAdvance && delayMinutes) {
      const [h, m] = app.startTime.split(':').map(Number);
      const totalMin = h * 60 + m + delayMinutes;
      const newH = Math.floor(totalMin / 60).toString().padStart(2, '0');
      const newM = (totalMin % 60).toString().padStart(2, '0');
      app.startTime = `${newH}:${newM}`;
      app.endTime = getEndTime(app.startTime);
    }

    whatsappMessages.push({
      id: 'wa-delay-' + Date.now() + Math.random(),
      patientId: app.patientId,
      sender: 'clinic_ai',
      type: 'text',
      content: message,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    });

    notificationsSent.push({
      patientName: app.patientName,
      phone: app.patientPhone,
      message,
    });
  });

  res.json({
    success: true,
    delayMinutes,
    isAdvance,
    notificationsSent,
    appointments,
    whatsappMessages,
  });
});

// POST Scheduled Cron Jobs (F2)
app.post('/api/cron/trigger', async (req: Request, res: Response) => {
  const { jobType } = req.body; // '24h_reminders' | 'daily_briefing' | 'unassigned_alerts'

  if (jobType === 'daily_briefing') {
    const todayApps = appointments.filter((a) => a.date === todayStr);
    const pendingDebt = patients.reduce((sum, p) => sum + p.balance, 0);
    const summary = await generateDailyClinicalSummary({
      kinesiologistName: clinicConfig.kinesiologistName,
      appointmentsToday: todayApps,
      patientsCount: patients.length,
      pendingDebt,
    });
    res.json({ success: true, jobType, summary });
    return;
  }

  if (jobType === '24h_reminders') {
    const tomorrowApps = appointments.filter((a) => a.date === tomorrowStr && a.status === 'confirmed');
    const sentCount = tomorrowApps.length;
    tomorrowApps.forEach((app) => {
      whatsappMessages.push({
        id: 'wa-rem-' + Date.now() + Math.random(),
        patientId: app.patientId,
        sender: 'clinic_ai',
        type: 'text',
        content: `Recordatorio KineFlow: ¡Hola ${app.patientName.split(' ')[0]}! Te recordamos tu turno de kinesiología mañana ${tomorrowStr} a las ${app.startTime} hs (${app.area}). Respondé 'SI' para confirmar o avisame si necesitás reprogramar.`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        interactiveOptions: ['Confirmar Asistencia', 'Reprogramar Turno'],
      });
    });
    res.json({ success: true, jobType, sentCount, whatsappMessages });
    return;
  }

  if (jobType === 'unassigned_alerts') {
    // Pacientes con sesiones pendientes pero sin turnos futuros
    const alerts: Array<{ patientName: string; reason: string; draftMessage: string }> = [];
    patients.forEach((p) => {
      const remaining = p.currentTreatment.totalSessions - p.currentTreatment.completedSessions;
      const hasFutureApp = appointments.some((a) => a.patientId === p.id && a.date >= todayStr);
      if (remaining > 0 && !hasFutureApp) {
        alerts.push({
          patientName: p.fullName,
          reason: `Tratamiento incompleto: le quedan ${remaining} sesiones de ${p.currentTreatment.totalSessions} (${p.currentTreatment.targetArea})`,
          draftMessage: `¡Hola ${p.fullName.split(' ')[0]}! Te escribimos del consultorio del Lic. ${clinicConfig.kinesiologistName}. Notamos que te quedan ${remaining} sesiones de rehabilitación para completar tu plan. ¿Querés que coordinemos el próximo turno esta semana?`,
        });
      }
    });
    res.json({ success: true, jobType, alerts });
    return;
  }

  res.status(400).json({ error: 'Tipo de cron inválido' });
});

// Helpers
function getEndTime(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + 50;
  const newH = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const newM = (totalMin % 60).toString().padStart(2, '0');
  return `${newH}:${newM}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Full-stack Vite mounting
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[KineFlow AI] Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
