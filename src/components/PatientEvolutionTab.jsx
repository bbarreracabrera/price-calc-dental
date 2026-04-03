import React, { useState, useRef } from 'react';
import { Mic, MicOff, FileLock, PenTool, Clock, User } from 'lucide-react';
import { Button } from './UIComponents';

export default function PatientEvolutionTab({ 
    newEvolution, setNewEvolution, 
    // Ignoramos las funciones del Asistente Global para no generar conflictos
    getPatient, selectedPatientId, savePatientData, session, logAction
}) {
    const patient = getPatient(selectedPatientId);
    const evolutions = patient.clinical?.evolution || [];

    // --- 🎙️ MOTOR DE DICTADO EXCLUSIVO PARA TEXTO LIBRE ---
    const [isDictating, setIsDictating] = useState(false);
    const recognitionRef = useRef(null);

    const toggleDictation = () => {
        if (isDictating) {
            recognitionRef.current?.stop();
            setIsDictating(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta el dictado por voz. Te recomendamos usar Google Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-CL'; // Español de Chile (ajustable)
        recognition.continuous = true; 
        recognition.interimResults = false; // Solo pega el texto cuando terminas la frase (evita duplicados)

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            
            // Toma lo que ya estaba escrito y le suma la nueva frase
            setNewEvolution(prev => prev + (prev.length > 0 ? ' ' : '') + transcript);
        };

        recognition.onerror = (event) => {
            console.error("Error en el dictado:", event.error);
            setIsDictating(false);
        };

        recognition.onend = () => {
            setIsDictating(false); // Se apaga solo si dejas de hablar mucho rato
        };

        recognition.start();
        setIsDictating(true);
        recognitionRef.current = recognition;
    };
    // -------------------------------------------------------

    const handleSave = () => {
        if (!newEvolution.trim()) return;
        
        const n = {
            id: Date.now().toString(), 
            text: newEvolution, 
            date: new Date().toLocaleString('es-CL'), 
            author: session?.user?.email || 'Usuario Clínico'
        }; 
        
        savePatientData(selectedPatientId, {
            ...patient, 
            clinical: {
                ...patient.clinical, 
                evolution: [n, ...evolutions]
            }
        }); 
        
        setNewEvolution(''); 
        logAction('ADD_EVOLUTION', { text_preview: newEvolution.substring(0,20) }, selectedPatientId);
    };

    return (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto pb-10">
            
            {/* --- ENCABEZADO --- */}
            <div className="border-b border-[#DFD2C4]/50 pb-4">
                <h2 className="text-2xl font-black text-[#312923] tracking-tight flex items-center gap-3">
                    <div className="p-2.5 bg-[#CBAAA2]/10 text-[#CBAAA2] rounded-xl">
                        <PenTool size={22} />
                    </div>
                    Evolución Clínica
                </h2>
                <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-2 ml-1">
                    Registro inmutable de atenciones
                </p>
            </div>

            {/* --- ÁREA DE REDACCIÓN (NUEVA EVOLUCIÓN) --- */}
            <div className="bg-white border border-[#DFD2C4]/60 rounded-[2rem] p-6 shadow-sm relative">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">Nueva Entrada</span>
                    <div className="h-6 flex items-center"> 
                        {isDictating && (
                            <span className="text-[10px] text-white animate-pulse font-bold bg-red-500 px-3 py-1 rounded-full shadow-sm">
                                Dictando... (Hable claro)
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="relative bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-2xl p-5 focus-within:border-[#5B6651]/50 transition-colors shadow-inner">
                    <textarea 
                        rows="4" 
                        placeholder="Redacte la evolución clínica del día de hoy... (No podrá ser modificada una vez firmada)" 
                        className="bg-transparent outline-none w-full font-medium text-sm text-[#312923] resize-none placeholder:text-[#9A8F84]/60 custom-scrollbar pr-10" 
                        value={newEvolution} 
                        onChange={e => setNewEvolution(e.target.value)} 
                    />
                    
                    {/* BOTÓN DEL DICTÁFONO PRIVADO */}
                    <button 
                        type="button"
                        onClick={toggleDictation} 
                        title="Dictado por voz (Texto libre)"
                        className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all shadow-sm ${
                            isDictating 
                            ? 'bg-red-500 animate-pulse text-white scale-110 shadow-red-500/30' 
                            : 'bg-white border border-[#DFD2C4] text-[#9A8F84] hover:text-[#5B6651] hover:border-[#5B6651]/30'
                        }`}
                    >
                        {isDictating ? <MicOff size={18}/> : <Mic size={18}/>}
                    </button>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button 
                        variant="primary" 
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-lg ${
                            newEvolution.trim() 
                            ? 'bg-[#312923] text-white hover:bg-[#1a1512] shadow-[#312923]/20 hover:-translate-y-0.5' 
                            : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed shadow-none'
                        }`}
                        onClick={handleSave}
                        disabled={!newEvolution.trim()}
                    >
                        <FileLock size={16} /> Firmar y Sellar
                    </Button>
                </div>
            </div>

            {/* --- HISTORIAL --- */}
            <div className="pt-6">
                {evolutions.length === 0 ? (
                    <div className="text-center py-12 bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-[2rem]">
                        <Clock className="mx-auto text-[#DFD2C4] mb-3" size={32}/>
                        <p className="text-sm font-bold text-[#9A8F84]">No hay registros clínicos previos</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-[#DFD2C4]/40 ml-4 pl-8 space-y-8 pb-4">
                        {evolutions.map((ev, idx) => (
                            <div key={ev.id} className="relative group">
                                <div className="absolute -left-[41px] top-5 w-4 h-4 bg-white border-4 border-[#CBAAA2] group-hover:border-[#5B6651] rounded-full shadow-sm transition-colors z-10" />
                                <div className="bg-white p-6 rounded-[2rem] border border-[#DFD2C4]/60 shadow-sm hover:shadow-md hover:border-[#5B6651]/30 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 border-b border-[#DFD2C4]/40 pb-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-[#5B6651] uppercase tracking-widest bg-[#5B6651]/5 px-3 py-1.5 rounded-lg border border-[#5B6651]/10">
                                            <Clock size={14} />
                                            {ev.date}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#9A8F84] bg-[#FDFBF7] px-3 py-1.5 rounded-lg border border-[#DFD2C4]/50">
                                            <User size={12} className="text-[#CBAAA2]" />
                                            {ev.author}
                                        </div>
                                    </div>
                                    <p className="text-sm text-[#312923] leading-relaxed whitespace-pre-wrap font-medium">
                                        {ev.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}