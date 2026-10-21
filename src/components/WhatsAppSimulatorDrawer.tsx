import React, { useState } from 'react';
import {
  X,
  Send,
  Mic,
  Image as ImageIcon,
  Paperclip,
  CheckCheck,
  Sparkles,
  Phone,
  Video,
  MoreVertical,
  Play,
  Pause,
  AlertCircle,
} from 'lucide-react';
import { Patient, WhatsAppMessage } from '../types/index.ts';

interface WhatsAppSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  messages: WhatsAppMessage[];
  onSendMessage: (
    patientId: string,
    type: 'text' | 'audio' | 'image_receipt',
    content: string,
    extra?: { audioTranscript?: string; imageBase64?: string }
  ) => Promise<any>;
}

export const WhatsAppSimulatorDrawer: React.FC<WhatsAppSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  patients,
  messages,
  onSendMessage,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[1]?.id || patients[0]?.id);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const patientMessages = messages.filter((m) => m.patientId === selectedPatientId);

  const sampleReceiptBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const handleSend = async (
    type: 'text' | 'audio' | 'image_receipt' = 'text',
    overrideContent?: string,
    extra?: { audioTranscript?: string; imageBase64?: string }
  ) => {
    const textToSend = overrideContent || inputText;
    if (!textToSend.trim() && type === 'text') return;

    setIsSending(true);
    setInputText('');
    try {
      await onSendMessage(activePatient.id, type, textToSend, extra);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const toggleAudio = (id: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      setTimeout(() => setPlayingAudioId(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Drawer Container */}
      <div className="w-full max-w-md h-full bg-[#0b141a] flex flex-col shadow-2xl border-l border-slate-800">
        {/* WhatsApp Green Header */}
        <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between text-white border-b border-[#2a3942]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm text-white">
              {activePatient?.fullName.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{activePatient?.fullName}</span>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                KineFlow AI Bot Conectado
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
              title="Cerrar simulador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Patient Switcher & Scenarios Bar */}
        <div className="bg-[#111b21] p-2.5 border-b border-[#222e35] space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Simulando como:</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-[#202c33] border border-[#2a3942] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-400"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.clinicalDiagnosis.slice(0, 24)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={() =>
                handleSend(
                  'text',
                  'Hola Santi! Me duele un poco el cuello por la guardia del finde. ¿Podemos sumar una sesión extra este jueves a la tarde después de las 16 hs?'
                )
              }
              className="px-2.5 py-1 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-teal-300 border border-teal-500/20 whitespace-nowrap transition"
            >
              Turno por Dolor
            </button>

            <button
              onClick={() =>
                handleSend(
                  'audio',
                  'Nota de voz',
                  {
                    audioTranscript:
                      'Hola Santi, che mirá, salí a trotar 10 minutos suave como me dijiste y sentí un tirón leve en el gemelo, quería consultarte si conviene vernos mañana.',
                  }
                )
              }
              className="px-2.5 py-1 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-emerald-300 border border-emerald-500/20 whitespace-nowrap flex items-center gap-1 transition"
            >
              <Mic className="w-3 h-3 text-emerald-400" /> Audio Paciente
            </button>

            <button
              onClick={() =>
                handleSend(
                  'image_receipt',
                  'Comprobante de pago',
                  { imageBase64: sampleReceiptBase64 }
                )
              }
              className="px-2.5 py-1 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-amber-300 border border-amber-500/20 whitespace-nowrap flex items-center gap-1 transition"
            >
              <ImageIcon className="w-3 h-3 text-amber-400" /> Comprobante $22.000
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-opacity-90">
          {patientMessages.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Inicia una conversación simulada para ver la interacción con Gemini AI y Twilio.
            </div>
          ) : (
            patientMessages.map((msg) => {
              const isPatient = msg.sender === 'patient';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 shadow-md ${
                      isPatient
                        ? 'bg-[#005c4b] rounded-tr-none text-white'
                        : 'bg-[#202c33] rounded-tl-none border border-[#2a3942]'
                    }`}
                  >
                    {!isPatient && (
                      <div className="flex items-center gap-1 text-[10px] text-teal-400 font-bold mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>KineFlow Asistente Clínico</span>
                      </div>
                    )}

                    {msg.type === 'audio' ? (
                      <div className="flex items-center gap-2.5 my-1">
                        <button
                          onClick={() => toggleAudio(msg.id)}
                          className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center transition"
                        >
                          {playingAudioId === msg.id ? (
                            <Pause className="w-3.5 h-3.5 fill-slate-950" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />
                          )}
                        </button>
                        <div>
                          <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-emerald-300 ${
                                playingAudioId === msg.id ? 'w-full transition-all duration-3000' : 'w-1/3'
                              }`}
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono mt-0.5 block">0:24</span>
                        </div>
                      </div>
                    ) : msg.type === 'image_receipt' ? (
                      <div className="my-1 p-2 rounded-xl bg-slate-950/60 border border-teal-500/20">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Comprobante de Transferencia Adjunto</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Transferencia a favor de kine.gomez.salud por $22.000 ARS.
                        </p>
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {/* Interactive Options if provided */}
                    {msg.interactiveOptions && msg.interactiveOptions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
                        {msg.interactiveOptions.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend('text', opt)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-[11px] font-semibold transition"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      {isPatient && <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#202c33] max-w-[200px] text-slate-400 text-xs animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
              <span>Gemini procesando...</span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="bg-[#202c33] p-3 border-t border-[#2a3942] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend('text')}
            placeholder="Escribí un mensaje..."
            className="flex-1 bg-[#2a3942] rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />

          <button
            onClick={() => handleSend('text')}
            disabled={!inputText.trim() || isSending}
            className="w-9 h-9 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
