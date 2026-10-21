import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime,
  checkSlotConflict,
  calculateTreatmentProgress,
  calculateFinancialSummary,
  generateDelayBroadcastMessage,
  determineAutonomyAction,
  matchReceiptData,
} from './rules.ts';
import { Appointment, Patient, PaymentTransaction } from '../types/index.ts';

test('timeToMinutes and minutesToTime conversions work symmetrically', () => {
  assert.equal(timeToMinutes('08:00'), 480);
  assert.equal(timeToMinutes('14:30'), 870);
  assert.equal(minutesToTime(480), '08:00');
  assert.equal(minutesToTime(870), '14:30');
});

test('checkSlotConflict detects overlapping appointments', () => {
  const existing: Appointment[] = [
    {
      id: 'app-1',
      patientId: 'p-1',
      patientName: 'Martin Palermo',
      patientPhone: '+5491144445555',
      date: '2026-10-21',
      startTime: '10:00',
      endTime: '11:00',
      area: 'Box 1 - Fisioterapia',
      sessionNumber: 3,
      totalSessions: 10,
      status: 'confirmed',
      isPaid: true,
      price: 15000,
    },
  ];

  // Conflicto total: 10:15 a 11:15
  const conflict = checkSlotConflict(
    { date: '2026-10-21', startTime: '10:15', endTime: '11:15', area: 'Box 1 - Fisioterapia' },
    existing
  );
  assert.equal(conflict.hasConflict, true);

  // Sin conflicto: 11:00 a 12:00
  const noConflict = checkSlotConflict(
    { date: '2026-10-21', startTime: '11:00', endTime: '12:00', area: 'Box 1 - Fisioterapia' },
    existing
  );
  assert.equal(noConflict.hasConflict, false);

  // Sin conflicto: fecha distinta
  const diffDate = checkSlotConflict(
    { date: '2026-10-22', startTime: '10:00', endTime: '11:00', area: 'Box 1 - Fisioterapia' },
    existing
  );
  assert.equal(diffDate.hasConflict, false);
});

test('calculateTreatmentProgress correctly handles session completion and renewal alerts', () => {
  const patient: Patient = {
    id: 'p-1',
    fullName: 'Camila Rodriguez',
    phone: '+5491122223333',
    documentId: '38123456',
    birthDate: '1995-04-12',
    insurance: 'OSDE',
    clinicalDiagnosis: 'Tendinopatía rotuliana',
    injuryDate: '2026-09-10',
    balance: 0,
    evolutionHistory: [],
    currentTreatment: {
      totalSessions: 10,
      completedSessions: 9,
      weeklyFrequency: 2,
      recommendedDays: ['Martes', 'Jueves'],
      active: true,
      startDate: '2026-09-15',
      targetArea: 'Rodilla derecha',
    },
  };

  const progress = calculateTreatmentProgress(patient);
  assert.equal(progress.currentSession, 9);
  assert.equal(progress.progressPercent, 90);
  assert.equal(progress.isCompleted, false);
  assert.equal(progress.needsRenewal, true); // 9 de 10 activa alerta de renovación de orden médica

  patient.currentTreatment.completedSessions = 10;
  const completedProgress = calculateTreatmentProgress(patient);
  assert.equal(completedProgress.isCompleted, true);
  assert.equal(completedProgress.progressPercent, 100);
});

test('calculateFinancialSummary calculates accurate financial metrics', () => {
  const appointments: Appointment[] = [
    {
      id: 'a1',
      patientId: 'p1',
      patientName: 'Juan Perez',
      patientPhone: '123',
      date: '2026-10-21',
      startTime: '09:00',
      endTime: '10:00',
      area: 'Box 1 - Fisioterapia',
      sessionNumber: 1,
      totalSessions: 10,
      status: 'completed',
      isPaid: true,
      price: 20000,
    },
    {
      id: 'a2',
      patientId: 'p2',
      patientName: 'Ana Clara',
      patientPhone: '456',
      date: '2026-10-21',
      startTime: '10:00',
      endTime: '11:00',
      area: 'Box 2 - Magneto & Ondas',
      sessionNumber: 4,
      totalSessions: 8,
      status: 'confirmed',
      isPaid: false,
      price: 20000,
    },
  ];

  const transactions: PaymentTransaction[] = [
    {
      id: 't1',
      patientId: 'p1',
      patientName: 'Juan Perez',
      date: '2026-10-21',
      amount: 20000,
      method: 'Transferencia',
      status: 'verified',
    },
  ];

  const summary = calculateFinancialSummary(appointments, transactions);
  assert.equal(summary.totalBilled, 40000);
  assert.equal(summary.totalCollected, 20000);
  assert.equal(summary.totalPending, 20000);
  assert.equal(summary.collectionRate, 50);
  assert.equal(summary.sessionCount, 2);
  assert.equal(summary.averageSessionPrice, 20000);
});

test('generateDelayBroadcastMessage formats delay and advance notifications properly', () => {
  const delayMsg = generateDelayBroadcastMessage('Santiago Gómez', 'Agustina Lopez', 20, '15:00', 'delay');
  assert.ok(delayMsg.includes('Agustina'));
  assert.ok(delayMsg.includes('Santiago Gómez'));
  assert.ok(delayMsg.includes('20 minutos'));
  assert.ok(delayMsg.includes('15:20 hs'));

  const advanceMsg = generateDelayBroadcastMessage('Santiago Gómez', 'Carlos Rossi', 30, '17:00', 'advance');
  assert.ok(advanceMsg.includes('adelantar'));
  assert.ok(advanceMsg.includes('16:30 hs'));
});

test('determineAutonomyAction respects autonomy levels and conflicts', () => {
  // Con conflicto siempre requiere intervención
  assert.equal(
    determineAutonomyAction(3, true, true, true).action,
    'require_manual_review'
  );

  // Fuera de horario siempre requiere revisión
  assert.equal(
    determineAutonomyAction(3, true, false, false).action,
    'require_manual_review'
  );

  // Nivel 3 con paciente habitual y todo libre -> auto_book
  assert.equal(
    determineAutonomyAction(3, true, false, true).action,
    'auto_book'
  );

  // Nivel 2 -> 1 click
  assert.equal(
    determineAutonomyAction(2, true, false, true).action,
    'require_one_click_approval'
  );

  // Nivel 1 -> manual review
  assert.equal(
    determineAutonomyAction(1, true, false, true).action,
    'require_manual_review'
  );
});

test('matchReceiptData validates amount and CBU correctly', () => {
  const clinic = { cbu: '0720123488000034921001', alias: 'kine.gomez.salud' };

  // Match exacto
  const match = matchReceiptData(
    { detectedAmount: 22000, cbuDestination: 'kine.gomez.salud' },
    22000,
    clinic
  );
  assert.equal(match.isMatch, true);
  assert.equal(match.confidence, 96);

  // Monto no coincide
  const mismatch = matchReceiptData(
    { detectedAmount: 18000, cbuDestination: 'kine.gomez.salud' },
    22000,
    clinic
  );
  assert.equal(mismatch.isMatch, false);
  assert.ok(mismatch.discrepancyNotice?.includes('difiere'));
});

import { interpretPatientMessageSofi } from '../services/geminiService.ts';
import { initialClinicConfig, initialPatients } from '../data/mockDatabase.ts';

test('interpretPatientMessageSofi handles wrong messages (MENSAJE_IGNORADO) correctly', async () => {
  const result = await interpretPatientMessageSofi({
    message: 'Perdón me equivoqué, no era para vos este mensaje',
    patient: initialPatients[0],
    clinicConfig: initialClinicConfig,
    existingAppointments: [],
    currentDateStr: '2026-10-21',
  });

  assert.equal(result.intent, 'MENSAJE_IGNORADO');
  assert.equal(result.proposed_slot, null);
  assert.equal(result.requires_kine_approval, false);
  assert.equal(result.confidence_score, 0.99);
  assert.ok(result.patient_message.includes('No te preocupes'));
});

