import React from 'react';
import {
  X,
  Brain,
  Zap,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Database,
  Calendar,
  MessageCircle,
} from 'lucide-react';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Arquitectura de la Solución (Mermaid Graph TD)
              </h2>
              <p className="text-xs text-slate-400">
                Flujos entre Motor Gemini AI, Eje Backend/Twilio, Carrocería Android y Supervisión.
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

        {/* Graph Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MOTOR (Gemini AI) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-purple-400">
                <Brain className="w-4 h-4" />
                <h3 className="text-sm font-bold text-white">🧠 MOTOR (Gemini AI)</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span><strong className="text-purple-300">N1: Interpreta Mensajes:</strong> texto/audio + contexto clínico</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span><strong className="text-purple-300">N2: Propone Turnos:</strong> disponibilidad real vs boxes</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span><strong className="text-purple-300">N3: Alertas Proactivas:</strong> sesiones sin asignar, retención</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span><strong className="text-purple-300">N4: Análisis Multimodal:</strong> comprobantes de pago</span>
                </li>
              </ul>
            </div>

            {/* EJE (Backend & Infraestructura) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400">
                <Zap className="w-4 h-4" />
                <h3 className="text-sm font-bold text-white">⚡ EJE (Backend & Infraestructura)</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span><strong className="text-amber-300">F1: Webhook Twilio:</strong> Entrada/Salida WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span><strong className="text-amber-300">F2: Scheduled Cron:</strong> Recordatorios 24h + Resumen matutino</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span><strong className="text-amber-300">F3: State/Trigger:</strong> Notifica confirmación al paciente</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span><strong className="text-amber-300">DB:</strong> Store reactivo persistente en tiempo real</span>
                </li>
              </ul>
            </div>

            {/* CARROCERÍA (App Android) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-teal-400">
                <Smartphone className="w-4 h-4" />
                <h3 className="text-sm font-bold text-white">📱 CARROCERÍA (App Panel Kinesiólogo)</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span><strong className="text-teal-300">A1: Agenda:</strong> Día / Semana por Boxes</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span><strong className="text-teal-300">A2: Turnos Pendientes:</strong> Aprobación 1-click IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span><strong className="text-teal-300">A3: Ficha de Paciente:</strong> Historial + Tratamiento X de N + EVA</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span><strong className="text-teal-300">A4: Disponibilidad & Configs:</strong> Avisos demora con 1-click</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span><strong className="text-teal-300">A5: Libro Diario Económico:</strong> Facturación, Pagos y CBU</span>
                </li>
              </ul>
            </div>

            {/* SUPERVISIÓN Y APRENDIZAJE */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <h3 className="text-sm font-bold text-white">👁️ SUPERVISIÓN Y APRENDIZAJE</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span><strong className="text-emerald-300">S1: Auditoría de Propuestas:</strong> Feedback del kinesiólogo</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span><strong className="text-emerald-300">S2: Aumento Gradual de Autonomía:</strong> Escalamiento controlado</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span><strong className="text-emerald-300">Retroalimentación:</strong> Actualización dinámica de reglas de negocio</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Interactive Flow Diagram */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Flujo Interactivo en Ejecución
            </span>
            <div className="flex items-center justify-between text-slate-300 flex-wrap gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[120px]">
                <span className="text-emerald-400 font-bold block">1. Paciente</span>
                <span className="text-[10px] text-slate-400">WhatsApp / Audio</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[120px]">
                <span className="text-purple-400 font-bold block">2. Gemini 3.8</span>
                <span className="text-[10px] text-slate-400">Inferencia & Reglas</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[120px]">
                <span className="text-teal-400 font-bold block">3. Carrocería Android</span>
                <span className="text-[10px] text-slate-400">1-Click Aprobación</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[120px]">
                <span className="text-emerald-400 font-bold block">4. Feedback S1</span>
                <span className="text-[10px] text-slate-400">Aprendizaje continuo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
