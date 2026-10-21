/**
 * KineFlow AI - Pure Domain Logic & Rules
 * Reglas de negocio puras, desacopladas de UI y probables unitariamente.
 */

import {
  Appointment,
  AutonomyLevel,
  ClinicConfig,
  Patient,
  PaymentTransaction,
  TreatmentArea,
} from '../types/index.ts';

/**
 * Convierte 'HH:mm' a minutos desde la medianoche para comparaciones exactas.
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Convierte minutos desde la medianoche a formato 'HH:mm'.
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Verifica si hay conflicto de horario entre un turno propuesto y la agenda existente.
 * Si sameAreaOnly es true, revisa solo el box/camilla; si es false, revisa al kinesiólogo completo.
 */
export function checkSlotConflict(
  proposed: { date: string; startTime: string; endTime: string; area?: TreatmentArea },
  existingAppointments: Appointment[],
  excludeAppointmentId?: string
): { hasConflict: boolean; conflictingWith?: Appointment; reason?: string } {
  const propStart = timeToMinutes(proposed.startTime);
  const propEnd = timeToMinutes(proposed.endTime);

  for (const app of existingAppointments) {
    if (excludeAppointmentId && app.id === excludeAppointmentId) continue;
    if (app.date !== proposed.date) continue;
    if (app.status === 'cancelled' || app.status === 'rescheduled') continue;

    const appStart = timeToMinutes(app.startTime);
    const appEnd = timeToMinutes(app.endTime);

    // Verificación de solapamiento de horario: [start1 < end2 && end1 > start2]
    const overlaps = propStart < appEnd && propEnd > appStart;

    if (overlaps) {
      if (proposed.area && app.area === proposed.area) {
        return {
          hasConflict: true,
          conflictingWith: app,
          reason: `El espacio ${proposed.area} ya está ocupado por ${app.patientName} (${app.startTime} - ${app.endTime})`,
        };
      }
      // Si la clínica es unipersonal y los turnos no son simultáneos
      return {
        hasConflict: true,
        conflictingWith: app,
        reason: `Superposición horaria con turno de ${app.patientName} (${app.startTime} - ${app.endTime})`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Calcula el progreso del tratamiento y el número de la siguiente sesión (X de N).
 */
export function calculateTreatmentProgress(patient: Patient): {
  currentSession: number;
  totalSessions: number;
  progressPercent: number;
  isCompleted: boolean;
  needsRenewal: boolean;
} {
  const current = patient.currentTreatment.completedSessions;
  const total = patient.currentTreatment.totalSessions;
  const progressPercent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const isCompleted = current >= total;
  const needsRenewal = current >= total - 1; // Avisar cuando queda 1 o 0 sesiones

  return {
    currentSession: current,
    totalSessions: total,
    progressPercent,
    isCompleted,
    needsRenewal,
  };
}

/**
 * Agrega el balance financiero del libro diario: facturado, cobrado y pendiente.
 */
export function calculateFinancialSummary(
  appointments: Appointment[],
  transactions: PaymentTransaction[]
): {
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  sessionCount: number;
  averageSessionPrice: number;
} {
  const completedOrConfirmed = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'confirmed' || a.status === 'in_progress'
  );

  const totalBilled = completedOrConfirmed.reduce((sum, a) => sum + (a.price || 0), 0);

  const verifiedPayments = transactions.filter((t) => t.status === 'verified');
  const totalCollected = verifiedPayments.reduce((sum, t) => sum + t.amount, 0);

  const totalPending = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;
  const sessionCount = completedOrConfirmed.length;
  const averageSessionPrice = sessionCount > 0 ? Math.round(totalBilled / sessionCount) : 0;

  return {
    totalBilled,
    totalCollected,
    totalPending,
    collectionRate,
    sessionCount,
    averageSessionPrice,
  };
}

/**
 * Genera el mensaje de difusión de aviso de demora o adelanto para pacientes de hoy.
 */
export function generateDelayBroadcastMessage(
  practitionerName: string,
  patientName: string,
  delayMinutes: number,
  originalTime: string,
  type: 'delay' | 'advance' = 'delay'
): string {
  const firstName = patientName.split(' ')[0] || patientName;
  const originalMin = timeToMinutes(originalTime);
  const adjustedTime =
    type === 'delay'
      ? minutesToTime(originalMin + delayMinutes)
      : minutesToTime(Math.max(0, originalMin - delayMinutes));

  if (type === 'advance') {
    return (
      `Hola ${firstName}! Te escribe el equipo del Lic. ${practitionerName}. ` +
      `Se nos liberó un espacio y podemos adelantarte el turno de hoy a las ${adjustedTime} hs (en lugar de las ${originalTime} hs). ` +
      `¿Te quedaría cómodo venir antes? Confirmame por acá. ¡Muchas gracias!`
    );
  }

  return (
    `Hola ${firstName}! Te escribe el Lic. ${practitionerName}. ` +
    `Por una urgencia kinesiológica en consultorio estoy con una demora estimada de ${delayMinutes} minutos. ` +
    `Tu turno de las ${originalTime} hs pasaría a las ${adjustedTime} hs aprox. ` +
    `Disculpá las molestias y cualquier duda avisame por este medio. ¡Nos vemos enseguida!`
  );
}

/**
 * Determina el camino de decisión según el Nivel de Autonomía de la IA.
 * Nivel 1: Siempre pendiente de aprobación manual.
 * Nivel 2: Propuesta elaborada de 1-click para confirmación.
 * Nivel 3: Auto-agenda directo si el paciente es recurrente, hay 0 conflictos y está dentro de horario laboral.
 */
export function determineAutonomyAction(
  autonomyLevel: AutonomyLevel,
  isRecurringPatient: boolean,
  hasSlotConflict: boolean,
  isWithinWorkingHours: boolean
): {
  action: 'auto_book' | 'require_one_click_approval' | 'require_manual_review';
  reason: string;
} {
  if (hasSlotConflict) {
    return {
      action: 'require_manual_review',
      reason: 'Conflicto detectado en agenda. Requiere intervención manual del kinesiólogo.',
    };
  }

  if (!isWithinWorkingHours) {
    return {
      action: 'require_manual_review',
      reason: 'Horario solicitado fuera de la franja habitual de atención.',
    };
  }

  if (autonomyLevel === 3 && isRecurringPatient && !hasSlotConflict && isWithinWorkingHours) {
    return {
      action: 'auto_book',
      reason: 'Nivel 3 activo: Paciente habitual sin conflictos en horario laboral. Agendado automáticamente.',
    };
  }

  if (autonomyLevel >= 2) {
    return {
      action: 'require_one_click_approval',
      reason: 'Nivel 2 activo: Propuesta optimizada lista para aprobación en 1 click.',
    };
  }

  return {
    action: 'require_manual_review',
    reason: 'Nivel 1 activo: Modo consultivo. Requiere revisión exhaustiva.',
  };
}

/**
 * Valida si un comprobante de transferencia bancaria coincide con el saldo esperado y CBU de la clínica.
 */
export function matchReceiptData(
  extracted: { detectedAmount?: number; cbuDestination?: string },
  expectedAmount: number,
  clinicCbuOrAlias: { cbu: string; alias: string }
): { isMatch: boolean; discrepancyNotice?: string; confidence: number } {
  if (!extracted.detectedAmount) {
    return {
      isMatch: false,
      discrepancyNotice: 'No se pudo leer el monto transferido en el comprobante.',
      confidence: 30,
    };
  }

  const amountDiff = Math.abs(extracted.detectedAmount - expectedAmount);
  const amountMatches = amountDiff < 1; // Menos de 1 peso de diferencia

  let destinationMatches = true;
  if (extracted.cbuDestination) {
    const cleanExtracted = extracted.cbuDestination.toLowerCase().trim();
    const cleanCbu = clinicCbuOrAlias.cbu.toLowerCase().trim();
    const cleanAlias = clinicCbuOrAlias.alias.toLowerCase().trim();
    destinationMatches =
      cleanExtracted.includes(cleanAlias) ||
      cleanExtracted.includes(cleanCbu) ||
      cleanCbu.includes(cleanExtracted);
  }

  if (amountMatches && destinationMatches) {
    return {
      isMatch: true,
      confidence: 96,
    };
  }

  if (!amountMatches) {
    return {
      isMatch: false,
      discrepancyNotice: `Monto transferido ($${extracted.detectedAmount}) difiere del esperado ($${expectedAmount}).`,
      confidence: 70,
    };
  }

  return {
    isMatch: false,
    discrepancyNotice: 'El CBU o Alias receptor no coincide con la cuenta del kinesiólogo.',
    confidence: 65,
  };
}
