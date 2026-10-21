import React, { useState, useEffect } from 'react';
import { EnterpriseNavbar } from './components/Navbar.tsx';
import { AgendaView } from './components/AgendaView.tsx';
import { PendingProposalsView } from './components/PendingProposalsView.tsx';
import { PatientsView } from './components/PatientsView.tsx';
import { PatientDetailModal } from './components/PatientDetailModal.tsx';
import { FinancialBookView } from './components/FinancialBookView.tsx';
import { AvailabilityAndConfigView } from './components/AvailabilityAndConfigView.tsx';
import { SupervisionView } from './components/SupervisionView.tsx';
import { WhatsAppSimulatorDrawer } from './components/WhatsAppSimulatorDrawer.tsx';
import { SystemArchitectureModal } from './components/SystemArchitectureModal.tsx';
import { CronModal } from './components/CronModal.tsx';
import {
  AIProposal,
  Appointment,
  AuditLogItem,
  ClinicConfig,
  Patient,
  PaymentTransaction,
  TreatmentArea,
  WhatsAppMessage,
} from './types/index.ts';
import {
  initialAppointments,
  initialAuditLogs,
  initialClinicConfig,
  initialPatients,
  initialProposals,
  initialTransactions,
  initialWhatsAppMessages,
  todayStr,
} from './data/mockDatabase.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('agenda');

  // Core Clinical State
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig>(initialClinicConfig);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [proposals, setProposals] = useState<AIProposal[]>(initialProposals);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(initialTransactions);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>(initialWhatsAppMessages);
  const [currentDateStr, setCurrentDateStr] = useState<string>(todayStr);

  // Modals & Drawers
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [isCronModalOpen, setIsCronModalOpen] = useState<boolean>(false);

  // Initial Fetch from backend
  useEffect(() => {
    fetch('/api/state')
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data) => {
        if (data.clinicConfig) setClinicConfig(data.clinicConfig);
        if (data.patients) setPatients(data.patients);
        if (data.appointments) setAppointments(data.appointments);
        if (data.proposals) setProposals(data.proposals);
        if (data.transactions) setTransactions(data.transactions);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.whatsappMessages) setWhatsappMessages(data.whatsappMessages);
        if (data.currentDateStr) setCurrentDateStr(data.currentDateStr);
      })
      .catch((err) => {
        console.warn('Backend state fetch notice:', err);
      });
  }, []);

  const pendingProposalsCount = proposals.filter((p) => p.status === 'pending').length;
  const activeSelectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Actions
  const handleUpdateStatus = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === appointmentId ? { ...app, status: newStatus } : app))
    );
  };

  const handleProposalAction = async (
    proposalId: string,
    action: 'approved' | 'modified' | 'rejected',
    details?: { finalDate?: string; finalTime?: string; finalArea?: TreatmentArea; feedbackReason?: string }
  ) => {
    try {
      const res = await fetch('/api/proposals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          action,
          ...details,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.appointments) setAppointments(data.appointments);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.whatsappMessages) setWhatsappMessages(data.whatsappMessages);
        setProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? { ...p, status: action } : p))
        );
      }
    } catch (e) {
      console.error(e);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: action } : p))
      );
    }
  };

  const handleSendWhatsAppMessage = async (
    patientId: string,
    type: 'text' | 'audio' | 'image_receipt',
    content: string,
    extra?: { audioTranscript?: string; imageBase64?: string }
  ) => {
    try {
      const res = await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          type,
          content,
          ...extra,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.whatsappMessages) setWhatsappMessages(data.whatsappMessages);
        if (data.proposals) setProposals(data.proposals);
        if (data.appointments) setAppointments(data.appointments);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.patient) {
          setPatients((prev) =>
            prev.map((p) => (p.id === data.patient.id ? data.patient : p))
          );
        }
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
      }
      return data;
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvolution = async (
    patientId: string,
    data: {
      date: string;
      evaPainScale: number;
      romMobility: string;
      interventions: string[];
      notes: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/evolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.patient) {
        setPatients((prev) =>
          prev.map((p) => (p.id === patientId ? resData.patient : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<ClinicConfig>) => {
    setClinicConfig((prev) => ({ ...prev, ...newConfig }));
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerDelay = async (minutes: number) => {
    try {
      const res = await fetch('/api/broadcast/delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delayMinutes: minutes, type: 'delay' }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.appointments) setAppointments(data.appointments);
        if (data.whatsappMessages) setWhatsappMessages(data.whatsappMessages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerBroadcastDelay = async (minutes: number, type: 'delay' | 'advance') => {
    const res = await fetch('/api/broadcast/delay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delayMinutes: minutes, type }),
    });
    const data = await res.json();
    if (data.success) {
      if (data.appointments) setAppointments(data.appointments);
      if (data.whatsappMessages) setWhatsappMessages(data.whatsappMessages);
    }
    return data;
  };

  const handleUploadReceipt = async (base64Image: string, expectedAmount: number) => {
    return handleSendWhatsAppMessage(
      patients[1]?.id || patients[0]?.id,
      'image_receipt',
      'Comprobante de pago',
      { imageBase64: base64Image }
    );
  };

  const handleTriggerCron = async (
    jobType: '24h_reminders' | 'daily_briefing' | 'unassigned_alerts'
  ) => {
    const res = await fetch('/api/cron/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobType }),
    });
    const data = await res.json();
    if (data.success && data.whatsappMessages) {
      setWhatsappMessages(data.whatsappMessages);
    }
    return data;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-300">
      {/* Enterprise Top Header Navbar */}
      <EnterpriseNavbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingProposalsCount={pendingProposalsCount}
        autonomyLevel={clinicConfig.autonomyLevel}
        clinicConfig={clinicConfig}
        onOpenWhatsAppSimulator={() => setIsWhatsAppOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        onRunCronModal={() => setIsCronModalOpen(true)}
      />

      {/* Main Expansive Content Area (Full-Width Desktop Dashboard) */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-8">
        {currentTab === 'agenda' && (
          <AgendaView
            appointments={appointments}
            currentDateStr={currentDateStr}
            onSelectPatient={(id) => setSelectedPatientId(id)}
            onUpdateStatus={handleUpdateStatus}
            onTriggerDelay={handleTriggerDelay}
          />
        )}

        {currentTab === 'proposals' && (
          <PendingProposalsView
            proposals={proposals}
            onAction={handleProposalAction}
            onSelectPatient={(id) => setSelectedPatientId(id)}
          />
        )}

        {currentTab === 'patients' && (
          <PatientsView
            patients={patients}
            onSelectPatient={(id) => setSelectedPatientId(id)}
          />
        )}

        {currentTab === 'financial' && (
          <FinancialBookView
            clinicConfig={clinicConfig}
            appointments={appointments}
            transactions={transactions}
            onUploadReceipt={handleUploadReceipt}
          />
        )}

        {currentTab === 'supervision' && (
          <SupervisionView auditLogs={auditLogs} />
        )}

        {currentTab === 'config' && (
          <AvailabilityAndConfigView
            clinicConfig={clinicConfig}
            onUpdateConfig={handleUpdateConfig}
            onTriggerBroadcastDelay={handleTriggerBroadcastDelay}
          />
        )}
      </main>

      {/* Patient Detail Clinical Chart Modal */}
      {activeSelectedPatient && (
        <PatientDetailModal
          patient={activeSelectedPatient}
          onClose={() => setSelectedPatientId(null)}
          onAddEvolution={handleAddEvolution}
        />
      )}

      {/* Interactive WhatsApp Simulator Drawer */}
      <WhatsAppSimulatorDrawer
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        patients={patients}
        messages={whatsappMessages}
        onSendMessage={handleSendWhatsAppMessage}
      />

      {/* System Architecture Diagram Modal */}
      <SystemArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      {/* Scheduled Cron Job Sandbox Modal */}
      <CronModal
        isOpen={isCronModalOpen}
        onClose={() => setIsCronModalOpen(false)}
        onTriggerCron={handleTriggerCron}
      />
    </div>
  );
}
