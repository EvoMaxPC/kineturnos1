/**
 * KineFlow AI - Domain Types
 * Definición de tipos para la plataforma kinesiológica inteligente.
 */

export type AppointmentStatus =
  | 'confirmed'
  | 'ai_pending'
  | 'in_progress'
  | 'completed'
  | 'rescheduled'
  | 'cancelled';

export type TreatmentArea =
  | 'Box 1 - Fisioterapia'
  | 'Box 2 - Magneto & Ondas'
  | 'Box 3 - Camilla Manual'
  | 'Gimnasio Rehabilitación';

export type HealthInsuranceType =
  | 'Particular'
  | 'OSDE'
  | 'Swiss Medical'
  | 'Galeno'
  | 'PAMI'
  | 'Medifé';

export type AutonomyLevel = 1 | 2 | 3;
// 1 = Consultivo (Kinesiólogo aprueba todo)
// 2 = Semi-autónomo (IA propone, 1 click de confirmación)
// 3 = Autónomo (IA agenda turnos recurrentes automáticamente si encajan)

export interface EvolutionEntry {
  id: string;
  date: string;
  sessionNumber: number;
  totalSessions: number;
  evaPainScale: number; // 0 (sin dolor) a 10 (dolor insoportable)
  romMobility: string; // Ej: "Flexión rodilla 115° (+10° vs previa)"
  interventions: string[]; // Ej: ["Magnetoterapia 20 min", "Terapia manual miofascial", "Ejercicios propiocepción bosu"]
  notes: string;
  physioName: string;
}

export interface Patient {
  id: string;
  fullName: string;
  phone: string; // Formato WhatsApp +54 9 11 ...
  email?: string;
  documentId: string; // DNI
  birthDate: string;
  insurance: HealthInsuranceType;
  affiliateNumber?: string;
  referringDoctor?: string;
  clinicalDiagnosis: string;
  injuryDate: string;
  currentTreatment: {
    totalSessions: number;
    completedSessions: number;
    weeklyFrequency: number;
    recommendedDays: string[]; // ['Martes', 'Jueves']
    active: boolean;
    startDate: string;
    targetArea: string;
  };
  balance: number; // Saldo adeudado (ARS)
  avatarUrl?: string;
  notes?: string;
  evolutionHistory: EvolutionEntry[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  area: TreatmentArea;
  sessionNumber: number;
  totalSessions: number;
  status: AppointmentStatus;
  isPaid: boolean;
  price: number;
  notes?: string;
  aiSuggested?: boolean;
  aiReasoning?: string;
}

export interface AIProposal {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  incomingMessage: string;
  isAudio: boolean;
  audioDurationSec?: number;
  audioTranscript?: string;
  proposedDate: string;
  proposedTime: string;
  proposedArea: TreatmentArea;
  clinicalReasoning: string;
  conflictStatus: 'no_conflict' | 'requires_override';
  status: 'pending' | 'approved' | 'modified' | 'rejected';
  rejectionReason?: string;
  confidenceScore: number; // 0 a 100
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  amount: number;
  method: 'Transferencia' | 'Efectivo' | 'Mercado Pago' | 'Obra Social';
  status: 'verified' | 'pending_verification' | 'rejected';
  referenceId?: string;
  receiptUrl?: string;
  extractedData?: {
    cbuDestination?: string;
    senderName?: string;
    rawDate?: string;
    detectedAmount?: number;
    confidence: number;
  };
}

export interface ClinicConfig {
  kinesiologistName: string;
  licenseNumber: string; // Matrícula Provincial / Nacional
  specialty: string;
  cbu: string;
  alias: string;
  bankName: string;
  holderName: string;
  sessionPriceStandard: number;
  sessionPriceInsurance: number;
  autonomyLevel: AutonomyLevel;
  workingHours: {
    [day: string]: { active: boolean; startMorning: string; endMorning: string; startAfternoon: string; endAfternoon: string };
  };
  bufferMinutesBetweenSessions: number;
  customRules: string[];
}

export interface WhatsAppMessage {
  id: string;
  patientId: string;
  sender: 'patient' | 'clinic_ai' | 'kinesiologist';
  type: 'text' | 'audio' | 'image_receipt' | 'slot_options';
  content: string;
  audioUrl?: string;
  audioDurationSec?: number;
  imageUrl?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  interactiveOptions?: string[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  proposalId: string;
  patientName: string;
  action: 'approved' | 'modified' | 'rejected' | 'auto_booked';
  originalSlot: string;
  finalSlot: string;
  feedbackReason?: string;
  kinesiologistOverride: boolean;
}
