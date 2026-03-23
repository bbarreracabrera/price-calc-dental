import React from 'react';
import { Mic, MicOff, FileLock } from 'lucide-react';
import { Button } from './UIComponents';

export default function PatientEvolutionTab({ 
    themeMode, t, newEvolution, setNewEvolution, isListening, toggleVoice, voiceStatus,
    getPatient, selectedPatientId, savePatientData, session, logAction
}) {
    const patient = getPatient(selectedPatientId);

    return (
        <div className="space-y-2 animate-in fade-in">
            <div className={`flex items-start p-3 rounded-2xl transition-all ${t.inputBg}`}>
                <textarea 
                    rows="3" 
                    placeholder="Escribir nueva evolución (No editable después de guardar)..." 
                    className={`bg-transparent outline-none w-full font-bold text-sm resize-none ${t.text}`} 
                    value={newEvolution} 
                    onChange={e=>setNewEvolution(e.target.value)} 
                />
                <div className="flex flex-col items-center gap-1">
                    <button onClick={toggleVoice} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 animate-pulse text-white' : 'text-stone-400 hover:text-cyan-400'}`}>
                        {isListening ? <MicOff size={18}/> : <Mic size={18}/>}
                    </button>
                </div>
            </div>
            {voiceStatus && <p className="text-[10px] text-right opacity-60 animate-pulse font-bold">{voiceStatus}</p>}
            <Button theme={themeMode} className="w-full" onClick={()=>{ 
                if (!newEvolution.trim()) return;
                // V76: Integridad - Nueva evolución se añade al principio, nunca se reemplaza el array
                const n = {id:Date.now(), text:newEvolution, date:new Date().toLocaleString(), author: session.user.email}; 
                savePatientData(selectedPatientId, {...patient, clinical: {...patient.clinical, evolution: [n, ...(patient.clinical.evolution||[])]}}); 
                setNewEvolution(''); 
                logAction('ADD_EVOLUTION', { text_preview: newEvolution.substring(0,20) }, selectedPatientId);
            }}>GUARDAR Y BLOQUEAR</Button>
            
            <div className="space-y-2 mt-4">
                {patient.clinical.evolution?.map(ev=>(
                    <div key={ev.id} className={`p-4 rounded-xl border border-white/5 relative ${t.card}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <FileLock size={14} className="text-emerald-500"/>
                                <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{ev.date}</span>
                            </div>
                            <span className="text-[9px] opacity-30">{ev.author}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{ev.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}