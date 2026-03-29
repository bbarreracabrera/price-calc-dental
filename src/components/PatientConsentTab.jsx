import React from 'react';
import { FileSignature, Printer, FileText, CheckCircle2, FileX } from 'lucide-react';
import { Card, SignaturePad } from './UIComponents';
import { CONSENT_TEMPLATES } from '../constants';

export default function PatientConsentTab({
    getPatient, selectedPatientId, savePatientData,
    modal, setModal, consentTemplate, setConsentTemplate,
    consentText, setConsentText, generatePDF
}) {
    const patient = getPatient(selectedPatientId);
    const signedConsents = patient.consents || [];

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
                    Documentación Legal y Firmas
                </p>
            </div>

            {/* --- ÁREA PRINCIPAL --- */}
            {modal === 'sign' ? (
                // 1. MODO LECTURA Y FIRMA (Documento Abierto)
                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-xl text-[#312923]">{CONSENT_TEMPLATES[consentTemplate]?.title}</h3>
                        <button onClick={() => setModal(null)} className="px-4 py-2 bg-[#FDFBF7] text-[#9A8F84] hover:text-[#312923] border border-[#DFD2C4]/50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors">
                            Cancelar
                        </button>
                    </div>

                    {/* El Papel (Texto del Consentimiento) */}
                    <div className="bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-3xl p-6 shadow-inner focus-within:border-[#5B6651]/30 transition-colors">
                        <textarea 
                            className="w-full h-64 bg-transparent text-sm leading-relaxed outline-none resize-none text-[#312923] font-medium custom-scrollbar pr-4" 
                            value={consentText} 
                            onChange={(e) => setConsentText(e.target.value)} 
                            placeholder="Redacte o ajuste el consentimiento aquí..."
                        />
                    </div>

                    {/* El Pad de Firma */}
                    <div className="bg-white border border-[#DFD2C4]/60 rounded-3xl p-6 shadow-sm">
                        <div className="mb-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5B6651] flex items-center gap-2">
                                <PenTool size={14}/> Firma del Paciente / Apoderado
                            </h4>
                            <p className="text-[10px] text-[#9A8F84] font-medium mt-1">Por favor, firme dentro del recuadro utilizando el cursor o su dedo.</p>
                        </div>
                        
                        <SignaturePad 
                            onSave={(sig) => { 
                                savePatientData(selectedPatientId, {
                                    ...patient, 
                                    consents: [{
                                        id: Date.now(), 
                                        type: CONSENT_TEMPLATES[consentTemplate].title, 
                                        text: consentText, 
                                        signature: sig,
                                        date: new Date().toLocaleDateString('es-CL')
                                    }, ...signedConsents]
                                }); 
                                setModal(null); 
                            }} 
                            onCancel={() => setModal(null)}
                        />
                    </div>
                </div>
            ) : (
                // 2. MODO SELECCIÓN DE PLANTILLA
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {signedConsents.map(c => (
                                <div key={c.id} className="bg-white p-5 rounded-3xl border border-[#DFD2C4]/60 shadow-sm flex items-center justify-between group hover:border-[#CBAAA2] transition-colors">
                                    
                                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                        <div className="p-3 bg-[#FDFBF7] rounded-xl text-[#9A8F84]">
                                            <FileSignature size={20}/>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-black text-sm text-[#312923] truncate">{c.type}</p>
                                            <p className="text-[10px] font-bold text-[#9A8F84] mt-1">{c.date || new Date(c.id).toLocaleDateString('es-CL')}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 pl-4 border-l border-[#DFD2C4]/40 ml-4 shrink-0">
                                        {/* Miniatura de la firma */}
                                        <div className="bg-[#FDFBF7] p-1.5 rounded-lg border border-[#DFD2C4]/50 h-10 w-16 flex items-center justify-center">
                                            <img src={c.signature} className="max-h-full max-w-full object-contain opacity-80 mix-blend-multiply" alt="Firma"/>
                                        </div>
                                        
                                        {/* Botón Imprimir/PDF */}
                                        <button 
                                            onClick={() => generatePDF('consent', c)} 
                                            className="p-3 bg-[#FDFBF7] border border-[#DFD2C4] text-[#6B615A] rounded-xl hover:bg-[#CBAAA2] hover:text-white hover:border-[#CBAAA2] transition-all shadow-sm"
                                            title="Generar PDF"
                                        >
                                            <Printer size={16}/>
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

// Para que funcione el ícono que usamos en el título
import { PenTool } from 'lucide-react';