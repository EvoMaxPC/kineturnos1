import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  Send,
  Bell,
  CheckCircle,
  AlertTriangle,
  Play,
} from 'lucide-react';

interface CronModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerCron: (jobType: '24h_reminders' | 'daily_briefing' | 'unassigned_alerts') => Promise<any>;
}

export const CronModal: React.FC<CronModalProps> = ({
  isOpen,
  onClose,
  onTriggerCron,
}) => {
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  if (!isOpen) return null;

  const handleRun = async (jobType: '24h_reminders' | 'daily_briefing' | 'unassigned_alerts') => {
    setRunningJob(jobType);
    setResultData(null);
    try {
      const res = await onTriggerCron(jobType);
      setResultData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                ⚡ EJE: Scheduled Cron Engine (F2)
              </h2>
              <p className="text-xs text-slate-400">
                Disparadores automáticos de recordatorios, briefing y alertas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="space-y-2.5">
            {/* Job 1: Resumen Diario Matutino */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-white block">1. Resumen Diario Matutino (IA)</span>
                <span className="text-[11px] text-slate-400">
                  Genera briefing con Gemini: agenda de hoy, pacientes críticos y cobros.
                </span>
              </div>
              <button
                onClick={() => handleRun('daily_briefing')}
                disabled={Boolean(runningJob)}
                className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-slate-950" />
                <span>Ejecutar</span>
              </button>
            </div>

            {/* Job 2: Recordatorios 24h Previas */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-white block">2. Recordatorios WhatsApp 24h</span>
                <span className="text-[11px] text-slate-400">
                  Envía confirmación con botones interactivos a los pacientes de mañana.
                </span>
              </div>
              <button
                onClick={() => handleRun('24h_reminders')}
                disabled={Boolean(runningJob)}
                className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-slate-950" />
                <span>Ejecutar</span>
              </button>
            </div>

            {/* Job 3: Alertas de Sesiones Sin Asignar */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-white block">3. Alerta Sesiones Sin Asignar (N3)</span>
                <span className="text-[11px] text-slate-400">
                  Detecta pacientes con tratamientos incompletos y redacta mensajes de retención.
                </span>
              </div>
              <button
                onClick={() => handleRun('unassigned_alerts')}
                disabled={Boolean(runningJob)}
                className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-slate-950" />
                <span>Ejecutar</span>
              </button>
            </div>
          </div>

          {/* Running State */}
          {runningJob && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/30 flex items-center gap-3 animate-pulse">
              <Sparkles className="w-5 h-5 text-teal-400 animate-spin" />
              <div className="text-xs">
                <p className="font-bold text-white">Ejecutando tarea cron {runningJob}...</p>
                <p className="text-slate-400">Conectando con base de datos y motor Gemini...</p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {resultData && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Cron completado con éxito</span>
              </div>

              {resultData.summary && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed italic">
                  "{resultData.summary}"
                </div>
              )}

              {resultData.sentCount !== undefined && (
                <p className="text-slate-300">
                  Se enviaron {resultData.sentCount} recordatorios de WhatsApp con botones interactivos.
                </p>
              )}

              {resultData.alerts && (
                <div className="space-y-1.5 mt-2">
                  <span className="font-bold text-slate-400 text-[11px] block">Pacientes detectados:</span>
                  {resultData.alerts.map((al: any, i: number) => (
                    <div key={i} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="font-bold text-teal-300">{al.patientName}: </span>
                      <span className="text-slate-400">{al.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
