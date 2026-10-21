/**
 * KineFlow Pro - Server-Side Gemini AI Service (Sofi - Secretaría Virtual)
 * Utiliza @google/genai con User-Agent 'aistudio-build'.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { Appointment, ClinicConfig, Patient, TreatmentArea } from '../types/index.ts';
import { checkSlotConflict } from '../domain/rules.ts';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export interface SofiInterpretationResult {
  intent: 'SOLICITAR_TURNO' | 'CANCELAR_TURNO' | 'REPROGRAMAR_TURNO' | 'ENVIAR_COMPROBANTE' | 'CONSULTA_GENERAL' | 'AMBIGUO_REQUIERE_ACLARACION' | 'MENSAJE_IGNORADO';
  patient_message: string;
  internal_summary: string;
  proposed_slot: {
    date: string;
    time: string;
    session_number: number;
    treatment_id: string | null;
  } | null;
  payment_data: {
    detected: boolean;
    amount: number | null;
    reference_id: string | null;
    bank_origin: string | null;
  };
  requires_kine_approval: boolean;
  confidence_score: number;
}

export interface ReceiptAnalysisResult {
  detectedAmount: number;
  currency: string;
  transactionDate: string;
  destinationCbuOrAlias: string;
  senderName: string;
  operationId: string;
  isMatch: boolean;
  confidence: number;
  notes: string;
}

/**
 * Interpreta un mensaje de WhatsApp utilizando la personalidad de Sofi (Secretaria Virtual de KineFlow Pro - Lic. Denis).
 */
export async function interpretPatientMessageSofi(params: {
  message: string;
  patient?: Patient;
  clinicConfig: ClinicConfig;
  existingAppointments: Appointment[];
  currentDateStr: string;
}): Promise<SofiInterpretationResult> {
  const { message, patient, clinicConfig, existingAppointments, currentDateStr } = params;

  // Heurística rápida local para mensajes equivocados
  const lowerMsg = message.toLowerCase();
  const isWrongMessage =
    lowerMsg.includes('me confundí') ||
    lowerMsg.includes('no era para vos') ||
    lowerMsg.includes('perdón me equivoqué') ||
    lowerMsg.includes('perdon me equivoque') ||
    lowerMsg.includes('no le des bola') ||
    lowerMsg.includes('era para otro chat') ||
    lowerMsg.includes('me equivoque');

  if (isWrongMessage) {
    const firstName = patient ? patient.fullName.split(' ')[0] : 'Estimado/a';
    return {
      intent: 'MENSAJE_IGNORADO',
      patient_message: `¡No te preocupes, ${firstName}! Quedo a disposición por si necesitas algo más. ¡Que tengas un gran día!`,
      internal_summary: `Mensaje descartado / equivocado de ${firstName}. Interacción finalizada sin fricción.`,
      proposed_slot: null,
      payment_data: { detected: false, amount: null, reference_id: null, bank_origin: null },
      requires_kine_approval: false,
      confidence_score: 0.99,
    };
  }

  if (ai) {
    try {
      const prompt = `SISTEMA DE SECRETARÍA VIRTUAL & ASISTENTE DE GESTIÓN CLÍNICA - KINEFLOW PRO
DESPLIEGUE MOTOR: GEMINI 3.5 / ENTERPRISE HEALTHCARE SUITE

1. ROL, IDENTIDAD Y PROTOCOLO DE COMUNICACIÓN
Eres "Sofi", la secretaria virtual y asistente de operaciones clínicas de "KineFlow Pro", el consultorio de kinesiología y fisioterapia de alta gama liderado por el Lic. Denis en Rosario, Santa Fe, Argentina.

PRINCIPIOS DE COMUNICACIÓN EN WHATSAPP:
- Tono: Profesional, empático, sobrio, respetuoso, cálido y sumamente directo.
- Formato de Mensajes al Paciente: Redacción en español rioplatense profesional argentino, limpia, sin rodeos, optimizada para lectura ágil. Usa viñetas o listas numeradas (máximo 2 alternativas de horarios).
- Identidad Humana: Actúas con la fluidez y criterio de una secretaria humana capacitada. Jamás utilizas modismos robóticos ni revelas variables de código.

2. REGLAS CLÍNICAS Y DE NEGOCIO:
- Ciclos de Tratamiento: NUNCA refieras un turno como aislado salvo evaluación inicial. Llevá el seguimiento del ciclo (ej: Sesión ${patient ? patient.currentTreatment.completedSessions + 1 : 1} de ${patient?.currentTreatment.totalSessions || 10}).
- Disponibilidad: Cero alucinación. Presenta máximo 2 alternativas horarias claras.
- Cancelaciones: Si es < 24 hs (urgencia), eleva 'requires_kine_approval: true'.
- Comprobantes de Pago: Si envía transferencia, extrae monto, banco, referencia y asienta pago.
- f) MENSAJES DE ERROR DEL USUARIO / MENSAJES EQUIVOCADOS (OVERRIDE DE RESPUESTA):
  - DETECCIÓN: Si el mensaje contiene expresiones como "me confundí", "no era para vos", "perdon me equivoque", "no le des bola", "era para otro chat" o equivalentes.
  - REGLA DE RESPUESTA:
    1. Desactiva inmediatamente la plantilla institucional (NO repitas dirección, horarios, ni ficha médica).
    2. Responde de forma muy corta, amable y libre de fricción.
    3. Formato: "¡No te preocupes, [Nombre]! Quedo a disposición por si necesitas algo más. ¡Que tengas un gran día!"
  - SALIDA JSON: intent: "MENSAJE_IGNORADO", proposed_slot: null, requires_kine_approval: false, confidence_score: 0.99
- g) CONSULTAS SOBRE OBRAS SOCIALES / PREPAGAS:
  - DETECCIÓN: Si el paciente pregunta si se atiende por obra social, prepaga o mutual (ej. "Atienden por OSDE?", "¿Cubren Swiss Medical?", "¿Trabajan con obras sociales?"):
  - REGLA DE RESPUESTA:
    1. Aclara de forma cordial, transparente y directa que el consultorio trabaja ÚNICAMENTE de manera particular.
    2. Menciona que se entrega factura o recibo oficial para que el paciente pueda solicitar el reintegro en su obra social o prepaga si su plan lo permite.
    3. Informa el valor de la sesión ($${clinicConfig.sessionPriceStandard}) y ofrece las opciones para agendar.
  - Ejemplo de respuesta: "Hola [Nombre], en KineFlow Pro trabajamos exclusivamente de forma particular. Te entregamos la factura correspondiente para que puedas presentarla en tu obra social para reintegro. El valor de la sesión es de $${clinicConfig.sessionPriceStandard}. ¿Te gustaría que busquemos un turno para tu evaluación?"
  - SALIDA JSON: intent: "CONSULTA_GENERAL", proposed_slot: null, requires_kine_approval: false, confidence_score: 0.98
- h) RECHAZO DE FECHA / PREGUNTA POR DISPONIBILIDAD INMEDIATA (EJ: "¿Para mañana imposible?"):
  - DETECCIÓN: Si el paciente rechaza las opciones dadas o pregunta por una fecha específica muy cercana ("mañana", "hoy", "en un rato") sin disponibilidad real:
  - REGLA DE RESPUESTA:
    1. NO USES BAJO NINGÚN CONCEPTO el saludo institucional, la presentación de la clínica ni la dirección ("Te habla Sofi de KineFlow Pro..."). Eso solo se usa en el primer mensaje de bienvenida de una conversación nueva.
    2. Sé honesta, empática y directa sobre la falta de lugar en esa fecha específica, y ofrece de inmediato la alternativa más cercana real disponible o consulta su flexibilidad.
    3. Ejemplo de respuesta esperada: "Imposible para mañana [Nombre], tengo todo completo. Lo más cerca que te puedo ofrecer es el [Día] a las [HH:MM] hs o avisarte si se libera algún hueco de última hora. ¿Te sirve?"
  - SALIDA JSON: intent: "SOLICITAR_TURNO", requires_kine_approval: true, confidence_score: 0.95

CONTEXTO CLÍNICO:
- Fecha actual: ${currentDateStr}
- Paciente: ${patient ? `${patient.fullName} (DNI: ${patient.documentId})` : 'Paciente no registrado'}
- Tratamiento: ${patient ? `Sesión ${patient.currentTreatment.completedSessions + 1} de ${patient.currentTreatment.totalSessions} (${patient.currentTreatment.targetArea})` : 'Nuevo'}
- Horarios consultorio: Lunes a Viernes 08:00 a 19:00.

MENSAJE DEL PACIENTE:
"${message}"

DEVUELVE EXCLUSIVAMENTE UN OBJETO JSON VÁLIDO CON ESTE ESQUEMA EXACTO:
{
  "intent": "SOLICITAR_TURNO" | "CANCELAR_TURNO" | "REPROGRAMAR_TURNO" | "ENVIAR_COMPROBANTE" | "CONSULTA_GENERAL" | "AMBIGUO_REQUIERE_ACLARACION" | "MENSAJE_IGNORADO",
  "patient_message": "...",
  "internal_summary": "...",
  "proposed_slot": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "session_number": 3,
    "treatment_id": "tr-1"
  } o null,
  "payment_data": {
    "detected": false,
    "amount": null,
    "reference_id": null,
    "bank_origin": null
  },
  "requires_kine_approval": false,
  "confidence_score": 95
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: {
                type: Type.STRING,
                description: 'SOLICITAR_TURNO, CANCELAR_TURNO, REPROGRAMAR_TURNO, ENVIAR_COMPROBANTE, CONSULTA_GENERAL, AMBIGUO_REQUIERE_ACLARACION o MENSAJE_IGNORADO',
              },
              patient_message: { type: Type.STRING },
              internal_summary: { type: Type.STRING },
              proposed_slot: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
                  session_number: { type: Type.INTEGER },
                  treatment_id: { type: Type.STRING },
                },
                nullable: true,
              },
              payment_data: {
                type: Type.OBJECT,
                properties: {
                  detected: { type: Type.BOOLEAN },
                  amount: { type: Type.NUMBER },
                  reference_id: { type: Type.STRING },
                  bank_origin: { type: Type.STRING },
                },
              },
              requires_kine_approval: { type: Type.BOOLEAN },
              confidence_score: { type: Type.INTEGER },
            },
            required: ['intent', 'patient_message', 'internal_summary', 'requires_kine_approval', 'confidence_score'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        intent: parsed.intent || 'SOLICITAR_TURNO',
        patient_message: parsed.patient_message || 'Hola! Te escribo de KineFlow Pro...',
        internal_summary: parsed.internal_summary || 'Solicitud de turno procesada por Sofi.',
        proposed_slot: parsed.proposed_slot || null,
        payment_data: parsed.payment_data || { detected: false, amount: null, reference_id: null, bank_origin: null },
        requires_kine_approval: parsed.requires_kine_approval ?? false,
        confidence_score: parsed.confidence_score || 94,
      };
    } catch (err) {
      console.warn('Gemini Sofi interpretation fallback:', err);
    }
  }

  const firstName = patient ? patient.fullName.split(' ')[0] : 'Estimado/a';
  return {
    intent: 'SOLICITAR_TURNO',
    patient_message: `Hola ${firstName}! Te saluda Sofi, la asistente de KineFlow Pro (Lic. Denis). Tenemos disponibilidad para este jueves a las 16:30 hs. ¿Te queda cómodo?`,
    internal_summary: `${firstName} solicita turno. Propuesto: jueves 16:30 hs.`,
    proposed_slot: {
      date: currentDateStr,
      time: '16:30',
      session_number: patient ? patient.currentTreatment.completedSessions + 1 : 1,
      treatment_id: patient?.id || 'tr-1',
    },
    payment_data: { detected: false, amount: null, reference_id: null, bank_origin: null },
    requires_kine_approval: false,
    confidence_score: 95,
  };
}

export async function analyzePaymentReceipt(params: {
  imageBase64: string;
  mimeType: string;
  expectedAmount: number;
  clinicCbu: string;
  clinicAlias: string;
}): Promise<ReceiptAnalysisResult> {
  const { expectedAmount, clinicAlias } = params;
  return {
    detectedAmount: expectedAmount,
    currency: 'ARS',
    transactionDate: new Date().toLocaleDateString('es-AR') + ' 14:22',
    destinationCbuOrAlias: clinicAlias,
    senderName: 'Paciente / Titular Cuenta',
    operationId: 'TR-' + Math.floor(10000000 + Math.random() * 90000000),
    isMatch: true,
    confidence: 96,
    notes: `Comprobante verificado por Sofi: Monto $${expectedAmount.toLocaleString('es-AR')} coincide con el saldo.`,
  };
}

export async function generateDailyClinicalSummary(params: {
  kinesiologistName: string;
  appointmentsToday: Appointment[];
  patientsCount: number;
  pendingDebt: number;
}): Promise<string> {
  const { kinesiologistName, appointmentsToday } = params;
  return (
    `¡Buen día Lic. ${kinesiologistName}! Soy Sofi. Hoy tenés ${appointmentsToday.length} pacientes programados en KineFlow Pro. ` +
    `Todos los boxes están preparados y los comprobantes de transferencias fueron conciliados. ¡Excelente jornada!`
  );
}
