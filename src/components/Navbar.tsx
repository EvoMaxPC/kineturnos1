import React from 'react';
import {
  Calendar,
  Sparkles,
  Users,
  Wallet,
  Settings,
  ShieldCheck,
  MessageCircle,
  Network,
  Activity,
  Bell,
  Clock,
  Building2,
} from 'lucide-react';
import { AutonomyLevel, ClinicConfig } from '../types/index.ts';

interface EnterpriseNavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingProposalsCount: number;
  autonomyLevel: AutonomyLevel;
  clinicConfig: ClinicConfig;
  onOpenWhatsAppSimulator: () => void;
  onOpenArchitectureModal: () => void;
  onRunCronModal: () => void;
}

export const EnterpriseNavbar: React.FC<EnterpriseNavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingProposalsCount,
  autonomyLevel,
  clinicConfig,
  onOpenWhatsAppSimulator,
  onOpenArchitectureModal,
  onRunCronModal,
}) => {
  const tabs = [
    { id: 'agenda', label: 'Agenda Operativa', icon: Calendar, badge: 0 },
    { id: 'proposals', label: 'Turnos IA & WhatsApp', icon: Sparkles, badge: pendingProposalsCount },
    { id: 'patients', label: 'Fichas de Pacientes', icon: Users, badge: 0 },
    { id: 'financial', label: 'Libro Diario Económico', icon: Wallet, badge: 0 },
    { id: 'supervision', label: 'Supervisión & Auditoría', icon: ShieldCheck, badge: 0 },
    { id: 'config', label: 'Disponibilidad & IA', icon: Settings, badge: 0 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-xl">
      {/* Top Enterprise Bar */}
      <div className="max-w-[1600px] mx-auto px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand & Clinic Info */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
                KineFlow <span className="text-teal-400 font-black">Enterprise AI</span>
              </h1>
              <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/25">
                Sistema Clínico de Élite
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="font-medium text-slate-300">Lic. {clinicConfig.kinesiologistName}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[11px] text-slate-400">{clinicConfig.licenseNumber}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{clinicConfig.specialty.slice(0, 38)}...</span>
            </p>
          </div>
        </div>

        {/* Center: Live AI Autonomy Badge */}
        <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-inner">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Motor Gemini IA:</span>
            <span
              className={`font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-sm ${
                autonomyLevel === 3
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : autonomyLevel === 2
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              {autonomyLevel === 3
                ? 'Nivel 3: Autonomía Avanzada'
                : autonomyLevel === 2
                ? 'Nivel 2: 1-Click Supervisado'
                : 'Nivel 1: Modo Consultivo'}
            </span>
          </div>
        </div>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-3">
          {/* Architecture Modal Button */}
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition shadow-sm"
            title="Ver diagrama de arquitectura de la solución"
          >
            <Network className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">Arquitectura del Sistema</span>
          </button>

          {/* Cron Trigger Modal Button */}
          <button
            onClick={onRunCronModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition shadow-sm"
            title="Simular ejecución de cron (recordatorios 24h, resumen diario, retención)"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Scheduled Cron Jobs</span>
          </button>

          {/* WhatsApp Simulator Drawer Button */}
          <button
            onClick={onOpenWhatsAppSimulator}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>Simulador WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Enterprise Tabs Navigation Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800 px-6">
        <div className="max-w-[1600px] mx-auto flex items-center gap-2 overflow-x-auto py-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 relative ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="px-1.5 min-w-[18px] h-[18px] rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center animate-bounce shadow">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
