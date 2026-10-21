import React, { useState } from 'react';
import {
  X,
  User,
  Activity,
  Calendar,
  AlertCircle,
  Plus,
  CheckCircle,
  FileText,
  DollarSign,
  Phone,
  Shield,
  HeartPulse,
} from 'lucide-react';
import { Patient } from '../types/index.ts';
import { calculateTreatmentProgress } from '../domain/rules.ts';

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  onAddEvolution: (
    patientId: string,
    data: {
      date: string;
      evaPainScale: number;
      romMobility: string;
      interventions: string[];
      notes: string;
    }
  ) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  onClose,
  onAddEvolution,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [evaScore, setEvaScore] = useState(3);
  const [romInput, setRomInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([
    'Terapia manual miofascial',
    'Fortalecimiento excéntrico',
  ]);

  const progress = calculateTreatmentProgress(patient);

  const availableInterventions = [
    'Terapia manual miofascial',
    'Magnetoterapia 20 min',
    'Ondas de choque radiales',
    'Ultrasonido continuo/pulsado',
    'Electroestimulación VMS/TENS',
    'Ejercicios propiocepción en bosu',
    'Fortalecimiento excéntrico',
    'Punción seca',
    'Crioterapia / Termoterapia',
  ];

  const toggleIntervention = (item: string) => {
    if (selectedInterventions.includes(item)) {
      setSelectedInterventions(selectedInterventions.filter((i) => i !== item));
    } else {
      setSelectedInterventions([...selectedInterventions, item]);
    }
  };

  const handleSaveEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEvolution(patient.id, {
      date: new Date().toISOString().split('T')[0],
      evaPainScale: evaScore,
      romMobility: romInput || 'Movilidad articular conservada y dentro de parámetros funcionales.',
      interventions: selectedInterventions,
      notes: notesInput || 'Paciente evoluciona favorablemente según protocolo establecido.',
    });
    setShowAddForm(false);
    setRomInput('');
    setNotesInput('');
  };

  const getEvaColor = (score: number) => {
    if (score <= 3) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score <= 6) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-lg">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">{patient.fullName}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 text-teal-300 border border-slate-700">
                  {patient.insurance} {patient.affiliateNumber ? `(${patient.affiliateNumber})` : ''}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>DNI: {patient.documentId}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  {patient.phone}
                </span>
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
          {/* Diagnosis & Referring Doctor */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wide block mb-1">
              Diagnóstico Clínico Kinesiológico
            </span>
            <p className="text-sm font-semibold text-slate-200">{patient.clinicalDiagnosis}</p>
            {patient.referringDoctor && (
              <p className="text-xs text-slate-400 mt-1">
                <span className="text-slate-500">Médico derivante:</span> {patient.referringDoctor}
              </p>
            )}
          </div>

          {/* Treatment Progress Tracker (X de N) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/30 to-slate-900 border border-teal-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white">Progreso del Plan de Tratamiento</span>
              </div>
              <span className="text-sm font-extrabold text-teal-300 font-mono">
                Sesión {progress.currentSession} de {progress.totalSessions}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-2 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{progress.progressPercent}% del ciclo completado</span>
              <span>Frecuencia: {patient.currentTreatment.weeklyFrequency}x por semana</span>
            </div>

            {progress.needsRenewal && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Alerta clínica: Tratamiento próximo a finalizar. Solicitar nueva orden médica al traumatólogo para extender sesiones.
                </span>
              </div>
            )}
          </div>

          {/* Balance / Financial Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400">Saldo del Paciente:</span>
            {patient.balance > 0 ? (
              <span className="text-xs font-bold text-amber-400 font-mono">
                Adeuda ${patient.balance.toLocaleString('es-AR')}
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle className="w-3.5 h-3.5" /> Al día ($0)
              </span>
            )}
          </div>

          {/* Evolution Notes & Form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Historial de Evolución Kinesiológica
              </h3>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cargar Evolución</span>
                </button>
              )}
            </div>

            {/* Add Evolution Form */}
            {showAddForm && (
              <form
                onSubmit={handleSaveEvolution}
                className="p-4 rounded-2xl bg-slate-950 border border-teal-500/40 space-y-3.5 animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300">
                    Nueva Sesión #{progress.currentSession + 1} de {progress.totalSessions}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancelar
                  </button>
                </div>

                {/* EVA Pain Scale Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                      Escala Visual Analógica de Dolor (EVA 0-10):
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-extrabold border ${getEvaColor(evaScore)}`}>
                      {evaScore} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={evaScore}
                    onChange={(e) => setEvaScore(Number(e.target.value))}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>0: Sin Dolor</span>
                    <span>5: Moderado</span>
                    <span>10: Insoportable</span>
                  </div>
                </div>

                {/* ROM Mobility text */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Rango Articular (ROM) y Movilidad
                  </label>
                  <input
                    type="text"
                    value={romInput}
                    onChange={(e) => setRomInput(e.target.value)}
                    placeholder="Ej: Flexión 125°, extensión 0°, marcha sin claudicación..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                {/* Checklist of Interventions */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Técnicas e Intervenciones Aplicadas
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableInterventions.map((item) => {
                      const isSel = selectedInterventions.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleIntervention(item)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                            isSel
                              ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Private Notes */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Observaciones y Respuesta al Tratamiento
                  </label>
                  <textarea
                    rows={2}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Evolución clínica, tolerancia a la carga, sensaciones del paciente..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-400"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition"
                >
                  Guardar Evolución y Avanzar Contador a Sesión {progress.currentSession + 1}
                </button>
              </form>
            )}

            {/* List of past evolutions */}
            <div className="space-y-2.5">
              {patient.evolutionHistory.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
                  Aún no hay evoluciones registradas para este tratamiento.
                </div>
              ) : (
                patient.evolutionHistory.map((evo) => (
                  <div
                    key={evo.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          Sesión {evo.sessionNumber}/{evo.totalSessions}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{evo.date}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getEvaColor(evo.evaPainScale)}`}>
                        EVA {evo.evaPainScale}/10
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium mb-1.5">
                      <span className="text-slate-400 font-normal">ROM:</span> {evo.romMobility}
                    </p>

                    {evo.interventions && evo.interventions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {evo.interventions.map((int, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]"
                          >
                            {int}
                          </span>
                        ))}
                      </div>
                    )}

                    {evo.notes && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                        "{evo.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
