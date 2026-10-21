import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  User,
  Filter,
  DollarSign,
  Send,
  Sparkles,
} from 'lucide-react';
import { Appointment, TreatmentArea } from '../types/index.ts';

interface AgendaViewProps {
  appointments: Appointment[];
  currentDateStr: string;
  onSelectPatient: (patientId: string) => void;
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => void;
  onTriggerDelay: (minutes: number) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  currentDateStr,
  onSelectPatient,
  onUpdateStatus,
  onTriggerDelay,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [delayModalOpen, setDelayModalOpen] = useState(false);

  // Filter appointments
  const filteredAppointments = appointments.filter((app) => {
    const matchesDate = viewMode === 'day' ? app.date === currentDateStr : true;
    const matchesArea = selectedArea === 'all' ? true : app.area === selectedArea;
    return matchesDate && matchesArea;
  });

  // Sort by startTime
  const sortedAppointments = [...filteredAppointments].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const todayCount = appointments.filter((a) => a.date === currentDateStr).length;
  const inProgressApp = appointments.find((a) => a.date === currentDateStr && a.status === 'in_progress');
  const completedCount = appointments.filter((a) => a.date === currentDateStr && a.status === 'completed').length;

  const areas: TreatmentArea[] = [
    'Box 1 - Fisioterapia',
    'Box 2 - Magneto & Ondas',
    'Box 3 - Camilla Manual',
    'Gimnasio Rehabilitación',
  ];

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> En Atención
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completado
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25">
            Confirmado
          </span>
        );
      case 'ai_pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Propuesta IA
          </span>
        );
      case 'rescheduled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/25">
            Reagendado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-400" />
            Agenda Kinesiológica
          </h2>
          <p className="text-xs text-slate-400">
            {viewMode === 'day' ? `Turnos de hoy (${currentDateStr})` : 'Vista semanal consolidada'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day / Week Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                viewMode === 'day' ? 'bg-teal-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                viewMode === 'week' ? 'bg-teal-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Quick Delay Trigger */}
          <button
            onClick={() => setDelayModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Avisar Demora</span>
          </button>
        </div>
      </div>

      {/* Daily Pulse Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium">Turnos Hoy</span>
          <p className="text-xl font-bold text-white mt-0.5">{todayCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <span className="text-[11px] text-teal-400 font-medium">En Atención</span>
          <p className="text-xl font-bold text-teal-300 mt-0.5">{inProgressApp ? '1 activo' : 'Ninguno'}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
          <span className="text-[11px] text-emerald-400 font-medium">Completados</span>
          <p className="text-xl font-bold text-emerald-300 mt-0.5">{completedCount}</p>
        </div>
      </div>

      {/* Filter by Area Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedArea('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
            selectedArea === 'all'
              ? 'bg-slate-700 text-white font-semibold border border-slate-600'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Todos los Boxes
        </button>
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedArea === area
                ? 'bg-teal-600 text-white font-semibold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Appointment Cards List */}
      <div className="space-y-3">
        {sortedAppointments.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No hay turnos agendados</p>
            <p className="text-xs text-slate-500 mt-1">
              Probá seleccionando otro box o simulando una solicitud por WhatsApp.
            </p>
          </div>
        ) : (
          sortedAppointments.map((app) => (
            <div
              key={app.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                app.status === 'in_progress'
                  ? 'bg-gradient-to-r from-teal-950/40 to-slate-900 border-teal-500/40 shadow-lg shadow-teal-950/20 ring-1 ring-teal-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  {/* Time Badge */}
                  <div className="flex flex-col items-center justify-center min-w-[58px] p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200">
                    <span className="text-xs font-bold font-mono">{app.startTime}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{app.endTime}</span>
                  </div>

                  <div>
                    {/* Patient Name & Session info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onSelectPatient(app.patientId)}
                        className="text-sm font-bold text-white hover:text-teal-400 transition text-left"
                      >
                        {app.patientName}
                      </button>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                        Sesión {app.sessionNumber}/{app.totalSessions}
                      </span>
                    </div>

                    {/* Area & Notes */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {app.area}
                      </span>
                      {app.price && (
                        <span className="flex items-center text-slate-400 font-mono text-[11px]">
                          ${app.price.toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>

                    {app.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-1.5 bg-slate-800/40 px-2 py-1 rounded-md border border-slate-800/60">
                        {app.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div>{getStatusBadge(app.status)}</div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectPatient(app.patientId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 transition"
                  >
                    <User className="w-3 h-3 text-teal-400" />
                    <span>Ver Ficha</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {app.status === 'confirmed' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'in_progress')}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Iniciar Atención</span>
                    </button>
                  )}

                  {app.status === 'in_progress' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'completed')}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Finalizar Sesión</span>
                    </button>
                  )}

                  {app.status === 'completed' && (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sesión registrada
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delay Broadcast Modal */}
      {delayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Clock className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Aviso de Demora en Consultorio</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Dispara automáticamente una notificación personalizada de WhatsApp a todos los pacientes de hoy con turno pendiente.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => {
                  onTriggerDelay(15);
                  setDelayModalOpen(false);
                }}
                className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700 text-slate-200 text-center font-bold text-sm transition"
              >
                +15 Minutos
              </button>
              <button
                onClick={() => {
                  onTriggerDelay(30);
                  setDelayModalOpen(false);
                }}
                className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700 text-slate-200 text-center font-bold text-sm transition"
              >
                +30 Minutos
              </button>
            </div>

            <button
              onClick={() => setDelayModalOpen(false)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
