import React, { useState } from 'react';
import { FileSignature, Printer, FileText, CheckCircle2, FileX, PenTool, ShieldCheck } from 'lucide-react';
import { SignaturePad } from './UIComponents';
import { CONSENT_TEMPLATES } from '../constants';

export default function PatientConsentTab({
    getPatient, selectedPatientId, savePatientData,
    modal, setModal, consentTemplate, setConsentTemplate,
    consentText, setConsentText, generatePDF, session, notify
}) {
    const patient = getPatient(selectedPatientId);
    const signedConsents = patient?.consents || [];
    const [hasSignature, setHasSignature] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    const handleSignConsent = async () => {
        setIsSigning(true);
        try {
            const signatureData = SignaturePad.getSignature?.();

            if (!hasSignature || !signatureData) {
                if (notify) notify('Por favor firma antes de continuar');
                return;
            }

            const textToHash = consentText + signatureData;
            const encoder = new TextEncoder();
            const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(textToHash));
            const hashHex = Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0')).join('');

            let clientIP = 'no_disponible';
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
                clearTimeout(timeoutId);
                const ipData = await res.json();
                clientIP = ipData.ip;
            } catch (e) { /* falla silenciosa */ }

            const newConsent = {
                id: `consent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                type: CONSENT_TEMPLATES[consentTemplate]?.title || consentTemplate,
                text: consentText,
                signature: signatureData,
                date: new Date().toLocaleDateString('es-CL'),
                signed_at: new Date().toISOString(),
                signed_by: patient?.personal?.legalName || 'Paciente',
                patient_rut: patient?.personal?.rut || '',
                ip_address: clientIP,
                user_agent: navigator.userAgent.substring(0, 200),
                hash: hashHex.substring(0, 32),
                full_hash: hashHex,
                clinic_email: session?.user?.email || '',
            };

            savePatientData(selectedPatientId, {
                ...patient,
                consents: [newConsent, ...signedConsents],
            });

            setHasSignature(false);
            if (notify) notify('Consentimiento firmado y guardado');
            setModal(null);
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto pb-10">

            {/* --- ENCABEZADO --- */}
            <div className="border-b border-[#DFD2C4]/50 pb-4">
                <h2 className="text-2xl font-black text-[#312923] tracking-tight flex items-center gap-3">
                    <div className="p-2.5 bg-[#5B6651]/10 text-[#5B6651] rounded-xl">
                        <FileSignature size={22} />
                    </div>
                    Consentimientos Informados
                </h2>
                <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-2 ml-1">
                    Documentación Legal y Firmas — Ley 19.799
                </p>
            </div>

            {/* --- ÁREA PRINCIPAL --- */}
            {modal === 'sign' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-xl text-[#312923]">{CONSENT_TEMPLATES[consentTemplate]?.title}</h3>
                        <button onClick={() => setModal(null)} className="px-4 py-2 bg-[#FDFBF7] text-[#9A8F84] hover:text-[#312923] border border-[#DFD2C4]/50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors">
                            Cancelar
                        </button>
                    </div>

                    {/* Texto del Consentimiento */}
                    <div className="bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-3xl p-6 shadow-inner focus-within:border-[#5B6651]/30 transition-colors">
                        <textarea
                            className="w-full h-64 bg-transparent text-sm leading-relaxed outline-none resize-none text-[#312923] font-medium custom-scrollbar pr-4"
                            value={consentText}
                            onChange={(e) => setConsentText(e.target.value)}
                            placeholder="Redacte o ajuste el consentimiento aquí..."
                        />
                    </div>

                    {/* Pad de Firma */}
                    <div className="bg-white border border-[#DFD2C4]/60 rounded-3xl p-6 shadow-sm">
                        <div className="mb-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5B6651] flex items-center gap-2">
                                <PenTool size={14}/> Firma del Paciente / Apoderado
                            </h4>
                            <p className="text-[10px] text-[#9A8F84] font-medium mt-1">Por favor, firme dentro del recuadro utilizando el cursor o su dedo.</p>
                        </div>

                        <SignaturePad onSignatureChange={setHasSignature} />

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={handleSignConsent}
                                disabled={isSigning || !hasSignature}
                                className="flex-1 py-3.5 bg-[#5B6651] hover:bg-[#4a5442] text-white font-black text-sm rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                            >
                                {isSigning ? (
                                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Guardando firma...</>
                                ) : 'Confirmar y guardar firma'}
                            </button>
                            <button
                                onClick={() => setModal(null)}
                                className="px-6 py-3.5 bg-[#FDFBF7] border border-[#DFD2C4] text-[#312923] font-black text-sm rounded-2xl hover:bg-[#DFD2C4]/30 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // Modo selección de plantilla
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] border-b border-[#DFD2C4]/50 pb-2">
                        Plantillas Disponibles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {Object.entries(CONSENT_TEMPLATES).map(([key, tpl]) => (
                            <button
                                key={key}
                                onClick={() => { setConsentTemplate(key); setConsentText(tpl.text); setModal('sign'); }}
                                className="group flex flex-col items-center justify-center p-8 bg-white border border-[#DFD2C4]/60 hover:border-[#5B6651] rounded-3xl transition-all shadow-sm hover:shadow-md text-center"
                            >
                                <div className="w-14 h-14 bg-[#FDFBF7] rounded-2xl flex items-center justify-center group-hover:bg-[#5B6651]/10 group-hover:scale-110 transition-all duration-300 border border-[#DFD2C4]/50 mb-4">
                                    <FileText className="text-[#9A8F84] group-hover:text-[#5B6651] transition-colors" size={24}/>
                                </div>
                                <span className="font-black text-sm text-[#312923] group-hover:text-[#5B6651] transition-colors line-clamp-2">
                                    {tpl.title}
                                </span>
                                <span className="text-[9px] font-bold text-[#9A8F84] uppercase tracking-widest mt-2">Crear Nuevo</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* --- ARCHIVO DE CONSENTIMIENTOS FIRMADOS --- */}
            {modal !== 'sign' && (
                <div className="pt-8">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] border-b border-[#DFD2C4]/50 pb-2 mb-6 flex items-center gap-2">
                        <CheckCircle2 size={14}/> Archivo Legal (Firmados)
                    </h3>

                    {signedConsents.length === 0 ? (
                        <div className="text-center py-12 bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-3xl">
                            <FileX className="mx-auto text-[#DFD2C4] mb-3" size={32}/>
                            <p className="text-sm font-bold text-[#9A8F84]">No hay consentimientos firmados para este paciente.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {signedConsents.map((c, i) => (
                                <div key={c.id || i} className="bg-white border border-[#DFD2C4]/60 rounded-3xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2.5 bg-[#FDFBF7] rounded-xl text-[#9A8F84] shrink-0">
                                                <FileSignature size={20}/>
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-[#312923]">{c.type}</p>
                                                <p className="text-[10px] font-bold text-[#9A8F84] mt-0.5">
                                                    Firmado el {c.signed_at
                                                        ? new Date(c.signed_at).toLocaleString('es-CL')
                                                        : (c.date || '—')}
                                                </p>
                                            </div>
                                        </div>
                                        {c.hash && (
                                            <div className="flex items-center gap-1.5 text-[#5B6651] text-[10px] font-black bg-[#5B6651]/10 px-2.5 py-1 rounded-full border border-[#5B6651]/20 shrink-0">
                                                <ShieldCheck size={11}/> Verificado
                                            </div>
                                        )}
                                    </div>

                                    {c.hash && (
                                        <p className="text-[9px] font-mono text-[#A3968B] mb-3 bg-[#FDFBF7] px-3 py-1.5 rounded-xl border border-[#DFD2C4]/50 break-all">
                                            Hash: {c.hash}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        {c.signature && (
                                            <div className="bg-[#FDFBF7] p-1.5 rounded-xl border border-[#DFD2C4]/50 h-10 w-20 flex items-center justify-center">
                                                <img src={c.signature} className="max-h-full max-w-full object-contain opacity-80 mix-blend-multiply" alt="Firma"/>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => generatePDF('consent', c)}
                                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#312923] hover:bg-[#1a1512] text-white rounded-xl text-xs font-bold transition-colors"
                                        >
                                            <Printer size={13}/> Descargar PDF
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
