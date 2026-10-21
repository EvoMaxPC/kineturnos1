import React, { useState } from 'react';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  CreditCard,
  Copy,
  Check,
  Upload,
  FileCheck2,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { Appointment, ClinicConfig, PaymentTransaction } from '../types/index.ts';
import { calculateFinancialSummary } from '../domain/rules.ts';

interface FinancialBookViewProps {
  clinicConfig: ClinicConfig;
  appointments: Appointment[];
  transactions: PaymentTransaction[];
  onUploadReceipt: (base64Image: string, expectedAmount: number) => Promise<any>;
}

export const FinancialBookView: React.FC<FinancialBookViewProps> = ({
  clinicConfig,
  appointments,
  transactions,
  onUploadReceipt,
}) => {
  const [copiedCbu, setCopiedCbu] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const summary = calculateFinancialSummary(appointments, transactions);

  const copyToClipboard = (text: string, type: 'cbu' | 'alias') => {
    navigator.clipboard.writeText(text);
    if (type === 'cbu') {
      setCopiedCbu(true);
      setTimeout(() => setCopiedCbu(false), 2000);
    } else {
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    }
  };

  // Sample realistic base64 / generated transfer voucher for quick one-click testing
  const sampleReceiptBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const handleTestReceiptAnalysis = async (amount: number = 22000) => {
    setAnalyzingReceipt(true);
    setAnalysisResult(null);
    try {
      const res = await onUploadReceipt(sampleReceiptBase64, amount);
      if (res && res.analysis) {
        setAnalysisResult(res.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingReceipt(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setAnalyzingReceipt(true);
      try {
        const res = await onUploadReceipt(base64, 22000);
        if (res && res.analysis) {
          setAnalysisResult(res.analysis);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyzingReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-teal-400" />
          Libro Diario Económico
        </h2>
        <p className="text-xs text-slate-400">
          Facturación, cobranzas por transferencia/obra social y análisis de comprobantes.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Total Facturado</span>
          <p className="text-lg sm:text-xl font-extrabold text-white mt-1 font-mono">
            ${summary.totalBilled.toLocaleString('es-AR')}
          </p>
          <span className="text-[10px] text-teal-400 mt-1 block">
            {summary.sessionCount} sesiones este mes
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/20">
          <span className="text-[11px] text-emerald-400 font-medium">Cobrado</span>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-300 mt-1 font-mono">
            ${summary.totalCollected.toLocaleString('es-AR')}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {summary.collectionRate}% tasa cobranza
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/20">
          <span className="text-[11px] text-amber-400 font-medium">Por Cobrar</span>
          <p className="text-lg sm:text-xl font-extrabold text-amber-300 mt-1 font-mono">
            ${summary.totalPending.toLocaleString('es-AR')}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Sesiones pendientes</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Honorario Promedio</span>
          <p className="text-lg sm:text-xl font-extrabold text-slate-200 mt-1 font-mono">
            ${summary.averageSessionPrice.toLocaleString('es-AR')}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Por paciente</span>
        </div>
      </div>

      {/* CBU & Transfer Info */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-teal-400" />
            Datos de Cobro Bancario (Para WhatsApp)
          </span>
          <span className="text-[11px] text-teal-400 font-medium">{clinicConfig.bankName}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">Alias para transferir:</span>
              <span className="font-mono font-bold text-slate-200">{clinicConfig.alias}</span>
            </div>
            <button
              onClick={() => copyToClipboard(clinicConfig.alias, 'alias')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Copiar alias"
            >
              {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">CBU 22 dígitos:</span>
              <span className="font-mono text-xs text-slate-300 tracking-tighter truncate max-w-[170px] block">
                {clinicConfig.cbu}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(clinicConfig.cbu, 'cbu')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Copiar CBU"
            >
              {copiedCbu ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Multimodal Payment Receipt Scanner (Gemini Vision AI) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-950/20 via-slate-900 to-slate-900 border border-teal-500/30 shadow-lg">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Validador Multimodal de Comprobantes (Gemini AI)
              </h3>
              <p className="text-xs text-slate-400">
                OCR inteligente: extrae monto, emisor, CBU receptor y concilia el saldo automáticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer transition active:scale-95 shadow-md shadow-teal-500/20">
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Captura / Foto</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={() => handleTestReceiptAnalysis(22000)}
            disabled={analyzingReceipt}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Probar Comprobante Sofía ($22.000)</span>
          </button>
        </div>

        {/* Loading Indicator */}
        {analyzingReceipt && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-teal-500/30 flex items-center gap-3 animate-pulse">
            <Sparkles className="w-5 h-5 text-teal-400 animate-spin" />
            <div className="text-xs">
              <p className="font-bold text-white">Gemini 3.8 Flash analizando imagen del comprobante...</p>
              <p className="text-slate-400">Verificando monto, CBU de destino y emisor...</p>
            </div>
          </div>
        )}

        {/* Analysis Output Result Card */}
        {analysisResult && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Comprobante Verificado con Éxito
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-mono">
                {analysisResult.confidence}% Confiabilidad
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Importe Leído:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ${analysisResult.detectedAmount?.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Destino Leído:</span>
                <span className="font-mono text-slate-200 truncate block">
                  {analysisResult.destinationCbuOrAlias}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Titular Emisor:</span>
                <span className="text-slate-200 truncate block font-medium">
                  {analysisResult.senderName}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Operación N°:</span>
                <span className="font-mono text-slate-300 text-[11px] truncate block">
                  {analysisResult.operationId}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
              <span className="font-semibold text-slate-300">Diagnóstico IA:</span> {analysisResult.notes}
            </p>
          </div>
        )}
      </div>

      {/* Transactions Table / List */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-bold text-white">Transacciones Recientes</h3>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{tx.patientName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {tx.method}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {tx.date} {tx.referenceId ? `• Ref: ${tx.referenceId}` : ''}
                </span>
              </div>

              <div className="text-right">
                <span className="font-bold font-mono text-sm text-emerald-400 block">
                  +${tx.amount.toLocaleString('es-AR')}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    tx.status === 'verified' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {tx.status === 'verified' ? 'Acreditado' : 'Pendiente validación'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
