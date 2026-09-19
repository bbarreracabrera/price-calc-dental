import React, { useState } from 'react';
import { supabase } from '../supabase';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

export default function BoletaAssistantModal({ isOpen, onClose, payment, patient, onMarkEmitted }) {
    const [copied, setCopied] = useState({});

    if (!isOpen || !payment) return null;

    const amount      = payment.total || payment.amount || 0;
    const description = payment.treatment || payment.description || 'Atención dental';
    const patientName = patient?.personal?.legalName || payment.patientName || 'Cliente final';
    const patientRut  = patient?.personal?.rut || '66666666-6';

    const copy = (key, value) => {
        navigator.clipboard.writeText(value);
        setCopied(prev => ({ ...prev, [key]: true }));
        setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
    };

    const handleMarkEmitted = async () => {
        await supabase
            .from('financials')
            .update({ boleta_emitida: true, boleta_fecha: new Date().toISOString() })
            .eq('id', payment.id);
        if (onMarkEmitted) onMarkEmitted(payment.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#241F1B]/60 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg p-6 max-h-[95vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-black text-[#241F1B]">📄 Asistente de boleta SII</h3>
                        <p className="text-sm font-bold text-[#5E554E] mt-1">Datos listos para copiar al portal del SII</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-[#5E554E] hover:text-[#241F1B] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="bg-[#FBFAF8] rounded-2xl p-4 mb-4 border border-[#D9D2C7]/50">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E] mb-2">Cómo emitir tu boleta exenta</p>
                    <ol className="text-sm font-bold text-[#241F1B] space-y-1 list-decimal list-inside">
                        <li>Abre el portal SII (botón abajo)</li>
                        <li>Inicia sesión con tu clave tributaria</li>
                        <li>Una vez dentro, busca "Boleta Electrónica" → "Emitir Boleta Exenta"</li>
                        <li>Copia y pega cada dato desde aquí</li>
                        <li>Confirma y emite</li>
                        <li>Marca como emitida en esta app</li>
                    </ol>
                </div>

                <div className="space-y-3 mb-4">
                    <CopyField label="RUT del paciente"       value={patientRut}         copyKey="rut"    copied={copied.rut}    onCopy={copy} />
                    <CopyField label="Nombre / Razón social"  value={patientName}         copyKey="name"   copied={copied.name}   onCopy={copy} />
                    <CopyField label="Descripción del servicio" value={description}       copyKey="desc"   copied={copied.desc}   onCopy={copy} />
                    <CopyField label="Monto (CLP)"            value={amount.toString()}   copyKey="amount" copied={copied.amount} onCopy={copy} highlight />
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => window.open('https://misiir.sii.cl/cgi_misii/siihome.cgi', '_blank')}
                        className="w-full py-3 bg-[#241F1B] hover:bg-[#1a1512] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <ExternalLink size={16} /> Abrir portal SII
                    </button>
                    <button
                        onClick={handleMarkEmitted}
                        className="w-full py-3 bg-[#46523C] hover:bg-[#36402F] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Check size={16} /> Ya emití la boleta — marcar como completada
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 border border-[#D9D2C7] rounded-2xl font-black text-sm text-[#241F1B] hover:bg-[#D9D2C7]/30 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>

                <p className="text-xs font-bold text-[#5E554E] mt-4 text-center italic">
                    Los servicios de salud están exentos de IVA (Art. 12 DL 825). Usa siempre "Boleta Exenta" en el portal SII.
                </p>
            </div>
        </div>
    );
}

function CopyField({ label, value, copyKey, copied, onCopy, highlight }) {
    return (
        <div className={`rounded-2xl p-3 ${highlight ? 'bg-[#46523C]/10 border border-[#46523C]/30' : 'bg-[#FBFAF8] border border-[#D9D2C7]'}`}>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#5E554E] mb-1">{label}</p>
            <div className="flex items-center justify-between gap-2">
                <p className={`font-black text-[#241F1B] ${highlight ? 'text-lg' : 'text-sm'}`}>
                    {highlight ? `$${Number(value).toLocaleString('es-CL')}` : value}
                </p>
                <button
                    onClick={() => onCopy(copyKey, value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors ${
                        copied ? 'bg-[#46523C] text-white' : 'bg-white border border-[#D9D2C7] text-[#241F1B] hover:bg-[#D9D2C7]/30'
                    }`}
                >
                    {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                </button>
            </div>
        </div>
    );
}
