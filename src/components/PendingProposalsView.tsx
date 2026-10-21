import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Clock,
  MapPin,
  Mic,
  MessageSquare,
  Play,
  Pause,
  AlertTriangle,
  ArrowRight,
  ThumbsUp,
  SlidersHorizontal,
} from 'lucide-react';
import { AIProposal, TreatmentArea } from '../types/index.ts';

interface PendingProposalsViewProps {
  proposals: AIProposal[];
  onAction: (
    proposalId: string,
    action: 'approved' | 'modified' | 'rejected',
    details?: { finalDate?: string; finalTime?: string; finalArea?: TreatmentArea; feedbackReason?: string }
  ) => void;
  onSelectPatient: (patientId: string) => void;
}

export const PendingProposalsView: React.FC<PendingProposalsViewProps> = ({
  proposals,
  onAction,
  onSelectPatient,
}) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [modifyingProposal, setModifyingProposal] = useState<AIProposal | null>(null);
  const [rejectingProposal, setRejectingProposal] = useState<AIProposal | null>(null);

  // Form states for modify modal
  const [modifyDate, setModifyDate] = useState('');
  const [modifyTime, setModifyTime] = useState('');
  const [modifyArea, setModifyArea] = useState<TreatmentArea>('Box 1 - Fisioterapia');
  const [modifyReason, setModifyReason] = useState('');

  // Form state for reject modal
  const [rejectReason, setRejectReason] = useState('');

  const pendingList = proposals.filter((p) => p.status === 'pending');
  const pastList = proposals.filter((p) => p.status !== 'pending');

  const toggleAudio = (id: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      // Simulate finish after 4 seconds
      setTimeout(() => setPlayingAudioId(null), 4000);
    }
  };

  const openModifyModal = (prop: AIProposal) => {
    setModifyingProposal(prop);
    setModifyDate(prop.proposedDate);
    setModifyTime(prop.proposedTime);
    setModifyArea(prop.proposedArea);
    setModifyReason('Ajuste de horario por preferencia del profesional.');
  };

  const handleConfirmModify = () => {
    if (!modifyingProposal) return;
    onAction(modifyingProposal.id, 'modified', {
      finalDate: modifyDate,
      finalTime: modifyTime,
      finalArea: modifyArea,
      feedbackReason: modifyReason,
    });
    setModifyingProposal(null);
  };

  const handleConfirmReject = () => {
    if (!rejectingProposal) return;
    onAction(rejectingProposal.id, 'rejected', {
      feedbackReason: rejectReason || 'No se cuenta con disponibilidad para el caso.',
    });
    setRejectingProposal(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Turnos Pendientes & Aprobación IA</h2>
            <p className="text-xs text-slate-400">
              Solicitudes recibidas por WhatsApp procesadas por Gemini AI.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Items List */}
      <div className="space-y-3">
        {pendingList.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 p-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-3 text-teal-400">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">Bandeja al día</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              No hay solicitudes pendientes de validación. La IA se encuentra en escucha activa de WhatsApp.
            </p>
          </div>
        ) : (
          pendingList.map((prop) => (
            <div
              key={prop.id}
              className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-lg"
            >
              {/* Patient and Timestamp Header */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <button
                    onClick={() => onSelectPatient(prop.patientId)}
                    className="text-sm font-bold text-white hover:text-teal-400 text-left transition"
                  >
                    {prop.patientName}
                  </button>
                  <span className="text-[11px] text-slate-400 block font-mono">{prop.patientPhone}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {prop.confidenceScore}% Confiabilidad
                  </span>
                </div>
              </div>

              {/* Patient Message / Audio Card */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                  {prop.isAudio ? (
                    <>
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Nota de voz recibida ({prop.audioDurationSec || 20}s)</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>Mensaje de WhatsApp</span>
                    </>
                  )}
                </div>

                {prop.isAudio && (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800 mb-2">
                    <button
                      onClick={() => toggleAudio(prop.id)}
                      className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition shadow"
                    >
                      {playingAudioId === prop.id ? (
                        <Pause className="w-4 h-4 fill-slate-950" />
                      ) : (
                        <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
                        <div
                          className={`h-full bg-emerald-400 transition-all duration-300 ${
                            playingAudioId === prop.id ? 'w-3/4 animate-pulse' : 'w-1/4'
                          }`}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {playingAudioId === prop.id ? 'Reproduciendo audio...' : 'Click para escuchar'}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-300 italic">
                  "{prop.audioTranscript || prop.incomingMessage}"
                </p>
              </div>

              {/* Gemini Proposal Highlight */}
              <div className="p-3 rounded-2xl bg-teal-950/20 border border-teal-500/30 mb-3">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                  Propuesta de Turno Sugerida:
                </span>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-slate-200 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{prop.proposedDate} • {prop.proposedTime} hs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>{prop.proposedArea}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                  <span className="font-semibold text-slate-300">Criterio IA:</span> {prop.clinicalReasoning}
                </p>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => openModifyModal(prop)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ajustar Horario</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRejectingProposal(prop);
                      setRejectReason('');
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition"
                    title="Rechazar propuesta"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onAction(prop.id, 'approved')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Aprobar (1-Click)</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modify Modal */}
      {modifyingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-teal-400" />
              Ajustar Propuesta de Turno
            </h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Fecha</label>
                <input
                  type="date"
                  value={modifyDate}
                  onChange={(e) => setModifyDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Horario (HH:mm)</label>
                <input
                  type="time"
                  value={modifyTime}
                  onChange={(e) => setModifyTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Espacio / Box</label>
                <select
                  value={modifyArea}
                  onChange={(e) => setModifyArea(e.target.value as TreatmentArea)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="Box 1 - Fisioterapia">Box 1 - Fisioterapia</option>
                  <option value="Box 2 - Magneto & Ondas">Box 2 - Magneto & Ondas</option>
                  <option value="Box 3 - Camilla Manual">Box 3 - Camilla Manual</option>
                  <option value="Gimnasio Rehabilitación">Gimnasio Rehabilitación</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Motivo del Ajuste (Feedback IA)</label>
                <input
                  type="text"
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  placeholder="Ej: Prefiero no sobrecargar Box 1..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setModifyingProposal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmModify}
                className="flex-1 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 transition"
              >
                Guardar y Notificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Rechazar Propuesta
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Indicar el motivo para retroalimentar el motor de aprendizaje de Gemini.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: Paciente requiere interconsulta previa con traumatólogo..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white mb-4 focus:outline-none focus:border-red-400"
            ></textarea>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectingProposal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
