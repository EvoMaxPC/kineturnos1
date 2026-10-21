import React, { useState } from 'react';
import {
  Users,
  Search,
  Activity,
  ChevronRight,
  Phone,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Patient } from '../types/index.ts';
import { calculateTreatmentProgress } from '../domain/rules.ts';

interface PatientsViewProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  onSelectPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInsurance, setFilterInsurance] = useState('all');

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clinicalDiagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.documentId.includes(searchTerm);

    const matchesInsurance =
      filterInsurance === 'all' ? true : p.insurance === filterInsurance;

    return matchesSearch && matchesInsurance;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            Fichas de Pacientes & Tratamientos
          </h2>
          <p className="text-xs text-slate-400">
            Control de ciclos kinesiológicos (Sesión X de N) y evolución clínica.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, diagnóstico o DNI..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
          />
        </div>

        <select
          value={filterInsurance}
          onChange={(e) => setFilterInsurance(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-400 w-full sm:w-auto"
        >
          <option value="all">Todas las Obras Sociales</option>
          <option value="OSDE">OSDE</option>
          <option value="Swiss Medical">Swiss Medical</option>
          <option value="Galeno">Galeno</option>
          <option value="Particular">Particular</option>
        </select>
      </div>

      {/* Patients List Cards */}
      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="py-10 text-center bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No se encontraron pacientes con ese criterio.</p>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const progress = calculateTreatmentProgress(patient);

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className="p-4 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-sm">
                      {patient.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white group-hover:text-teal-400 transition">
                          {patient.fullName}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                          {patient.insurance}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {patient.clinicalDiagnosis}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition" />
                </div>

                {/* Treatment Progress Bar */}
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                      Plan de Tratamiento
                    </span>
                    <span className="font-bold text-teal-300 font-mono">
                      Sesión {progress.currentSession} de {progress.totalSessions}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                      style={{ width: `${progress.progressPercent}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-600" /> {patient.phone}
                    </span>
                    {patient.balance > 0 ? (
                      <span className="text-amber-400 font-bold">
                        Adeuda ${patient.balance.toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Al día</span>
                    )}
                  </div>

                  {progress.needsRenewal && (
                    <div className="mt-2 text-[10px] text-amber-300 font-medium flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>Renovación de orden médica requerida al completar sesión 10</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
