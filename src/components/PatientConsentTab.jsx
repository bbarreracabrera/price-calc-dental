import React from 'react';
import { FileSignature, Printer } from 'lucide-react';
import { Card, SignaturePad } from './UIComponents';
import { CONSENT_TEMPLATES } from '../constants';

export default function PatientConsentTab({
    themeMode, t, getPatient, selectedPatientId, savePatientData,
    modal, setModal, consentTemplate, setConsentTemplate,
    consentText, setConsentText, generatePDF
}) {
    const patient = getPatient(selectedPatientId);

    return (
        <div className="space-y-4 animate-in fade-in">
            {modal === 'sign' ? (
                <Card theme={themeMode} className="space-y-4">
                    <h3 className="font-bold">{CONSENT_TEMPLATES[consentTemplate]?.title}</h3>
                    <textarea 
                        className="w-full h-48 bg-black/20 p-4 rounded-xl text-sm leading-relaxed outline-none border border-white/10 focus:border-emerald-500 transition-colors resize-none text-white" 
                        value={consentText} 
                        onChange={(e)=>setConsentText(e.target.value)} 
                    />
                    <SignaturePad 
                        theme={themeMode} 
                        onSave={(sig)=>{ 
                            savePatientData(selectedPatientId, {
                                ...patient, 
                                consents: [{
                                    id: Date.now(), 
                                    type: CONSENT_TEMPLATES[consentTemplate].title, 
                                    text: consentText, 
                                    signature: sig
                                }, ...(patient.consents || [])]
                            }); 
                            setModal(null); 
                        }} 
                        onCancel={()=>setModal(null)}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(CONSENT_TEMPLATES).map(([key, tpl]) => (
                        <Card key={key} onClick={()=>{setConsentTemplate(key); setConsentText(tpl.text); setModal('sign');}} theme={themeMode} className="cursor-pointer hover:border-emerald-500 hover:scale-[1.02] transition-transform">
                            <FileSignature className="text-emerald-500 mb-2"/>
                            <span className="font-bold text-sm block">{tpl.title}</span>
                        </Card>
                    ))}
                </div>
            )}
            
            <h3 className="font-bold pt-4 border-t border-white/10 mt-4">Historial</h3>
            <div className="space-y-2">
                {(patient.consents || []).length === 0 && <p className="text-xs opacity-50">No hay consentimientos firmados.</p>}
                {(patient.consents || []).map(c => (
                    <Card key={c.id} theme={themeMode} className="flex justify-between items-center py-3">
                        <div>
                            <p className="font-bold text-sm">{c.type}</p>
                            <p className="text-[10px] opacity-50">{c.date || new Date(c.id).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-1 rounded">
                                <img src={c.signature} className="h-8 object-contain" alt="Firma"/>
                            </div>
                            <button onClick={()=>generatePDF('consent', c)} className={`p-2 rounded-xl ${t.inputBg} hover:opacity-80`}>
                                <Printer size={16}/>
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}