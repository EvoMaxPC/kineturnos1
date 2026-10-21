import React from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  SlidersHorizontal,
  XCircle,
  TrendingUp,
  Brain,
  Sparkles,
} from 'lucide-react';
import { AuditLogItem } from '../types/index.ts';

interface SupervisionViewProps {
  auditLogs: AuditLogItem[];
}

export const SupervisionView: React.FC<SupervisionViewProps> = ({ auditLogs }) => {
  const total = auditLogs.length || 1;
  const approvedCount = auditLogs.filter((a) => a.action === 'approved' || a.action === 'auto_booked').length;
  const modifiedCount = auditLogs.filter((a) => a.action === 'modified').length;
  const rejectedCount = auditLogs.filter((a) => a.action === 'rejected').length;

  const agreementRate = Math.round((approvedCount / total) * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          Supervisión & Aprendizaje del Motor IA
        </h2>
        <p className="text-xs text-slate-400">
          Auditoría de propuestas clínicas, feedback del kinesiólogo y métricas de autonomía.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-teal-500/30">
          <span className="text-[11px] text-teal-400 font-medium flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Concordancia
          </span>
          <p className="text-2xl font-extrabold text-white mt-1 font-mono">{agreementRate}%</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Aprobado sin cambios</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/20">
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobados
          </span>
          <p className="text-2xl font-extrabold text-emerald-300 mt-1 font-mono">{approvedCount}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Propuestas válidas</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/20">
          <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Ajustados
          </span>
          <p className="text-2xl font-extrabold text-amber-300 mt-1 font-mono">{modifiedCount}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Horario corregido</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-red-500/20">
          <span className="text-[11px] text-red-400 font-medium flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Rechazados
          </span>
          <p className="text-2xl font-extrabold text-red-300 mt-1 font-mono">{rejectedCount}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Rechazo con motivo</span>
        </div>
      </div>

      {/* Autonomy Escalation Gauge Card (S2) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-950/20 via-slate-900 to-slate-900 border border-teal-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-bold text-white">Progreso de Madurez del Motor (S2)</h3>
        </div>
        <p className="text-xs text-slate-300 mb-3">
          A medida que el kinesiólogo aprueba propuestas sin correcciones, el índice de confianza habilita la transición gradual hacia mayor autonomía.
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Umbral para Autonomía Avanzada (Nivel 3)</span>
            <span className="font-bold text-teal-300 font-mono">{agreementRate} / 90% requerido</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, agreementRate)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-bold text-white">Historial de Auditoría & Retroalimentación</h3>
        <div className="space-y-2">
          {auditLogs.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white">{item.patientName}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.action === 'approved' || item.action === 'auto_booked'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : item.action === 'modified'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/15 text-red-300 border border-red-500/30'
                  }`}
                >
                  {item.action === 'auto_booked'
                    ? 'Auto-agendado Nivel 3'
                    : item.action === 'approved'
                    ? 'Aprobado sin cambios'
                    : item.action === 'modified'
                    ? 'Ajustado manualmente'
                    : 'Rechazado'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-400">
                <div>
                  <span className="text-slate-500">Sugerido por IA: </span>
                  <span className="font-mono text-slate-300">{item.originalSlot}</span>
                </div>
                <div>
                  <span className="text-slate-500">Resolución final: </span>
                  <span className="font-mono text-slate-300">{item.finalSlot}</span>
                </div>
              </div>

              {item.feedbackReason && (
                <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-slate-300 font-semibold not-italic">Motivo / Criterio:</span> "{item.feedbackReason}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
