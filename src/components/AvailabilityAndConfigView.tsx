import React, { useState } from 'react';
import {
  Settings,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Calendar,
  AlertTriangle,
  Check,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';
import { AutonomyLevel, ClinicConfig } from '../types/index.ts';

interface AvailabilityAndConfigViewProps {
  clinicConfig: ClinicConfig;
  onUpdateConfig: (newConfig: Partial<ClinicConfig>) => void;
  onTriggerBroadcastDelay: (minutes: number, type: 'delay' | 'advance') => Promise<any>;
}

export const AvailabilityAndConfigView: React.FC<AvailabilityAndConfigViewProps> = ({
  clinicConfig,
  onUpdateConfig,
  onTriggerBroadcastDelay,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<AutonomyLevel>(clinicConfig.autonomyLevel);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);
  const [newRuleText, setNewRuleText] = useState('');

  const handleLevelChange = (level: AutonomyLevel) => {
    setSelectedLevel(level);
    onUpdateConfig({ autonomyLevel: level });
  };

  const handleDelayTrigger = async (minutes: number, type: 'delay' | 'advance') => {
    setBroadcasting(true);
    setBroadcastNotice(null);
    try {
      const res = await onTriggerBroadcastDelay(minutes, type);
      if (res && res.notificationsSent) {
        setBroadcastNotice(
          `¡Aviso enviado a ${res.notificationsSent.length} pacientes de hoy por WhatsApp! Horarios actualizados.`
        );
        setTimeout(() => setBroadcastNotice(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;
    const updated = [...clinicConfig.customRules, newRuleText.trim()];
    onUpdateConfig({ customRules: updated });
    setNewRuleText('');
  };

  const handleRemoveRule = (index: number) => {
    const updated = clinicConfig.customRules.filter((_, i) => i !== index);
    onUpdateConfig({ customRules: updated });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-400" />
          Disponibilidad & Configuración
        </h2>
        <p className="text-xs text-slate-400">
          Control de horarios, avisos rápidos por WhatsApp y nivel de autonomía de la IA.
        </p>
      </div>

      {/* 1-Click Delay / Advance Notification Triggers */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-lg">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <Clock className="w-4 h-4" />
          <h3 className="text-sm font-bold text-white">Avisos Rápidos de Demora / Adelanto (1-Click)</h3>
        </div>
        <p className="text-xs text-slate-400 mb-3.5">
          ¿Hubo una urgencia o se liberó un espacio? Envía una plantilla automática y empática de WhatsApp a los próximos pacientes del día.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => handleDelayTrigger(15, 'delay')}
            disabled={broadcasting}
            className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition active:scale-95"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Avisar Demora 15 min</span>
          </button>

          <button
            onClick={() => handleDelayTrigger(30, 'delay')}
            disabled={broadcasting}
            className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition active:scale-95"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Avisar Demora 30 min</span>
          </button>

          <button
            onClick={() => handleDelayTrigger(30, 'advance')}
            disabled={broadcasting}
            className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold transition active:scale-95"
          >
            <Send className="w-4 h-4 text-teal-400" />
            <span>Ofrecer Adelantar Turno</span>
          </button>
        </div>

        {broadcastNotice && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{broadcastNotice}</span>
          </div>
        )}
      </div>

      {/* Autonomy Level Control (Supervisión y Aprendizaje S2) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-bold text-white">Nivel de Autonomía de Gemini AI</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Regula qué tan autónomo es el motor para interactuar y coordinar turnos con los pacientes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Level 1 */}
          <div
            onClick={() => handleLevelChange(1)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition ${
              selectedLevel === 1
                ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400">Nivel 1: Consultivo</span>
              {selectedLevel === 1 && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              La IA solo redacta borradores y propuestas sugeridas. El kinesiólogo debe validar y autorizar cada mensaje manualmente.
            </p>
          </div>

          {/* Level 2 */}
          <div
            onClick={() => handleLevelChange(2)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition ${
              selectedLevel === 2
                ? 'bg-teal-500/10 border-teal-500/50 shadow-md ring-1 ring-teal-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-teal-300">Nivel 2: 1-Click Supervisado</span>
              {selectedLevel === 2 && <span className="w-2 h-2 rounded-full bg-teal-400"></span>}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              La IA dialoga por WhatsApp ofreciendo opciones según disponibilidad real. Una vez elegida la franja, queda lista para confirmación con 1 click.
            </p>
          </div>

          {/* Level 3 */}
          <div
            onClick={() => handleLevelChange(3)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition ${
              selectedLevel === 3
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-400">Nivel 3: Autonomía Avanzada</span>
              {selectedLevel === 3 && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Auto-agenda turnos para pacientes habituales en sus días y horarios recurrentes sin fricción, alertando al kinesiólogo solo ante excepciones.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Rules for AI Prompts */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-teal-400" />
          Reglas de Negocio del Kinesiólogo (Inyectadas en Gemini)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Indicaciones operativas que el motor de IA cumple estrictamente al proponer turnos.
        </p>

        <div className="space-y-2 mb-3">
          {clinicConfig.customRules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
            >
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
                <span>{rule}</span>
              </div>
              <button
                onClick={() => handleRemoveRule(idx)}
                className="text-slate-500 hover:text-red-400 p-0.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddRule} className="flex gap-2">
          <input
            type="text"
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            placeholder="Ej: No agendar sesiones de gimnasio después de las 18:30..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
