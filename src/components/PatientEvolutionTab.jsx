import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mic, MicOff, FileLock, PenTool, Clock, User, ShieldCheck, ListTodo, CheckCircle2 } from 'lucide-react';
import { Button } from './UIComponents';
import { supabase } from '../supabase';
import { getVaultItem, setVaultItem, removeVaultItem } from '../utils/cryptoVault';

export default function PatientEvolutionTab({ 
    newEvolution, setNewEvolution, 
    getPatient, selectedPatientId, savePatientData, session, logAction
}) {
    const patient = getPatient(selectedPatientId);
    
    const [evolutions, setEvolutions] = useState([]);
    const [loadingEvo, setLoadingEvo] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [draftStatus, setDraftStatus] = useState('');
    const [showDraftRecovered, setShowDraftRecovered] = useState(false);

    const draftKey = `evolution_draft_${selectedPatientId}`;

    const userId = session?.user?.id;

    // Cargar borrador cifrado al montar o cambiar de paciente
    useEffect(() => {
        if (!userId) return;
        const loadDraft = async () => {
            const parsed = await getVaultItem(draftKey, userId);
            if (!parsed) return;
            const ageInDays = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
            if (ageInDays < 7 && parsed.text) {
                setNewEvolution(parsed.text);
                setShowDraftRecovered(true);
                setTimeout(() => setShowDraftRecovered(false), 3000);
            } else {
                removeVaultItem(draftKey);
            }
        };
        loadDraft();
    }, [selectedPatientId]);

    // Guardar borrador cifrado 2s después de cada cambio
    useEffect(() => {
        if (!newEvolution || !userId) return;
        const timer = setTimeout(async () => {
            await setVaultItem(draftKey, { text: newEvolution, timestamp: Date.now() }, userId);
            setDraftStatus('Borrador guardado');
            setTimeout(() => setDraftStatus(''), 1500);
        }, 2000);
        return () => clearTimeout(timer);
    }, [newEvolution, draftKey]);

    // NUEVO: Estado para los tratamientos que el doctor selecciona hoy
    const [linkedItems, setLinkedItems] = useState([]);

    // --- CARGAR EVOLUCIONES (TU CÓDIGO ORIGINAL) ---
    useEffect(() => {
        let isMounted = true;
        const fetchEvolutions = async () => {
            setLoadingEvo(true);
            try {
                const { data, error } = await supabase
                    .from('clinical_evolutions')
                    .select('*')
                    .eq('patient_id', selectedPatientId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (isMounted && data) setEvolutions(data);
            } catch (err) {
                console.error("Error cargando evoluciones:", err);
            } finally {
                if(isMounted) setLoadingEvo(false);
            }
        };

        if(selectedPatientId) fetchEvolutions();
        return () => { isMounted = false; };
    }, [selectedPatientId]);

    // --- MAGIA: BUSCAR TRATAMIENTOS PENDIENTES DEL PLAN ---
    const pendingTreatments = useMemo(() => {
        if (!patient.clinical?.quotes) return [];
        let pending = [];
        
        patient.clinical.quotes.forEach(quote => {
            if (quote.status === 'en_proceso') {
                quote.items.forEach(item => {
                    // Solo traemos los que nacieron 'pending' (como programamos en la vista de presupuestos)
                    if (item.status === 'pending') {
                        pending.push({ ...item, quoteId: quote.id });
                    }
                });
            }
        });
        return pending;
    }, [patient.clinical?.quotes]);

    // Lógica para vincular tratamientos al texto
    const handleLinkTreatment = (item) => {
        if (linkedItems.find(i => i.id === item.id)) return;
        setLinkedItems([...linkedItems, item]);
        const prefix = `[Realizado: ${item.name}${item.tooth ? ` - Pieza ${item.tooth}` : ''}] `;
        setNewEvolution(prev => prev ? `${prev}\n${prefix}` : prefix);
    };

    const handleRemoveLink = (itemId) => {
        setLinkedItems(linkedItems.filter(i => i.id !== itemId));
    };

    // --- MOTOR DE DICTADO (TU CÓDIGO ORIGINAL) ---
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
        recognition.lang = 'es-CL'; 
        recognition.continuous = true; 
        recognition.interimResults = false; 

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setNewEvolution(prev => prev + (prev.length > 0 ? ' ' : '') + transcript);
        };

        recognition.onerror = (event) => {
            console.error("Error en el dictado:", event.error);
            setIsDictating(false);
        };

        recognition.onend = () => {
            setIsDictating(false);
        };

        recognition.start();
        setIsDictating(true);
        recognitionRef.current = recognition;
    };

    // --- FUNCIÓN CRIPTOGRÁFICA (TU CÓDIGO ORIGINAL) ---
    const generateHash = async (text) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(text + Date.now().toString());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // --- GUARDADO SEGURO + CIERRE DE TRATAMIENTO ---
    const handleSave = async () => {
        if (!newEvolution.trim()) return;
        setIsSaving(true);
        
        try {
            const authorEmail = session?.user?.email || 'Usuario Clínico';
            const clinicEmail = patient.admin_email || authorEmail; 
            
            const signature = await generateHash(newEvolution + authorEmail + selectedPatientId);

            const newRecord = {
                patient_id: selectedPatientId,
                clinic_email: clinicEmail,
                author: authorEmail,
                evolution_text: newEvolution,
                signature_hash: signature
            };

            // 1. Guardamos la evolución en su tabla blindada
            const { data, error } = await supabase
                .from('clinical_evolutions')
                .insert([newRecord])
                .select();

            if (error) throw error;

            // 2. MAGIA: Si el doctor seleccionó tratamientos, los marcamos como completados en el JSON
            if (linkedItems.length > 0 && patient.clinical?.quotes) {
                const updatedQuotes = patient.clinical.quotes.map(quote => {
                    let quoteHasChanges = false;
                    const newItems = quote.items.map(item => {
                        if (linkedItems.find(link => link.id === item.id)) {
                            quoteHasChanges = true;
                            return { ...item, status: 'completed' }; // Cambiamos de pending a completed
                        }
                        return item;
                    });
                    
                    const allCompleted = newItems.every(i => i.status === 'completed');
                    
                    return quoteHasChanges ? { 
                        ...quote, 
                        items: newItems,
                        status: allCompleted ? 'completado' : quote.status
                    } : quote;
                });

                // Guardamos el JSON actualizado usando tu función global
                await savePatientData(selectedPatientId, {
                    ...patient,
                    clinical: { ...patient.clinical, quotes: updatedQuotes }
                });
            }

            // 3. Actualizamos la vista localmente
            setEvolutions([data[0], ...evolutions]);
            setNewEvolution('');
            removeVaultItem(draftKey);
            setLinkedItems([]);
            logAction('ADD_EVOLUTION', { text_preview: newEvolution.substring(0,20) }, selectedPatientId);
            
        } catch (err) {
            alert("Error al firmar la evolución. Revisa tu conexión.");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString('es-CL', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute:'2-digit'
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto pb-10">
            
            <div className="border-b border-[#DFD2C4]/50 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-[#312923] tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-[#CBAAA2]/10 text-[#CBAAA2] rounded-xl">
                            <PenTool size={22} />
                        </div>
                        Evolución Clínica
                    </h2>
                    <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest mt-2 ml-1 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-500" /> Registro inmutable encriptado
                    </p>
                </div>
            </div>

            <div className="bg-white border border-[#DFD2C4]/60 rounded-[2rem] p-6 shadow-sm relative">
                
                {/* --- PANEL DE ASISTENCIA CLÍNICA --- */}
                {pendingTreatments.length > 0 && (
                    <div className="mb-6 p-4 bg-[#FDFBF7] border border-[#DFD2C4]/60 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <ListTodo size={16} className="text-[#A3968B]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#312923]">
                                Plan de Tratamiento: Tareas Pendientes
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {pendingTreatments.map(item => {
                                const isLinked = linkedItems.some(i => i.id === item.id);
                                return (
                                    <button 
                                        key={item.id}
                                        onClick={() => isLinked ? handleRemoveLink(item.id) : handleLinkTreatment(item)}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 border ${
                                            isLinked 
                                            ? 'bg-[#5B6651] text-white border-[#5B6651] shadow-sm' 
                                            : 'bg-white text-[#9A8F84] border-[#DFD2C4] hover:border-[#5B6651] hover:text-[#5B6651]'
                                        }`}
                                    >
                                        {isLinked && <CheckCircle2 size={12} />}
                                        {item.name} {item.tooth && `(P: ${item.tooth})`}
                                    </button>
                                );
                            })}
                        </div>
                        {linkedItems.length > 0 && (
                            <p className="text-[9px] text-[#A3968B] mt-3 font-bold">
                                * Al firmar, se marcarán como completados en el presupuesto.
                            </p>
                        )}
                    </div>
                )}

                {showDraftRecovered && (
                    <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl p-3 mb-4 flex items-center gap-2">
                        <span className="text-sm">✨</span>
                        <p className="text-sm font-bold text-[#312923]">Recuperamos un borrador que dejaste sin guardar</p>
                    </div>
                )}

                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5B6651]">Nueva Entrada</span>
                </div>
                
                <div className="relative bg-[#FDFBF7] border border-[#DFD2C4]/50 rounded-2xl p-5 focus-within:border-[#5B6651]/50 transition-colors shadow-inner">
                    <textarea 
                        rows="4" 
                        placeholder="Redacte la evolución clínica del día de hoy... (No podrá ser modificada una vez firmada)" 
                        className="bg-transparent outline-none w-full font-medium text-sm text-[#312923] resize-none placeholder:text-[#9A8F84]/60 custom-scrollbar pr-10" 
                        value={newEvolution} 
                        onChange={e => setNewEvolution(e.target.value)} 
                        disabled={isSaving}
                    />
                    
                    <button 
                        type="button"
                        onClick={toggleDictation} 
                        disabled={isSaving}
                        className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all shadow-sm ${
                            isDictating 
                            ? 'bg-red-500 animate-pulse text-white scale-110 shadow-red-500/30' 
                            : 'bg-white border border-[#DFD2C4] text-[#9A8F84] hover:text-[#5B6651] hover:border-[#5B6651]/30'
                        }`}
                    >
                        {isDictating ? <MicOff size={18}/> : <Mic size={18}/>}
                    </button>
                </div>

                <div className="mt-3 h-4">
                    {draftStatus && (
                        <p className="text-xs text-[#9A8F84] italic">✓ {draftStatus}</p>
                    )}
                </div>

                <div className="mt-3 flex justify-end">
                    <Button 
                        variant="primary" 
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-lg ${
                            newEvolution.trim() && !isSaving
                            ? 'bg-[#312923] text-white hover:bg-[#1a1512] shadow-[#312923]/20 hover:-translate-y-0.5' 
                            : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed shadow-none'
                        }`}
                        onClick={handleSave}
                        disabled={!newEvolution.trim() || isSaving}
                    >
                        {isSaving ? <span className="animate-pulse">SELLANDO...</span> : <><FileLock size={16} /> Firmar y Sellar</>}
                    </Button>
                </div>
            </div>

            {/* --- HISTORIAL (TU CÓDIGO ORIGINAL) --- */}
            <div className="pt-6">
                {loadingEvo ? (
                    <div className="text-center py-12 text-[#9A8F84] text-xs font-bold uppercase tracking-widest animate-pulse">
                        Cargando Historial Criptográfico...
                    </div>
                ) : evolutions.length === 0 ? (
                    <div className="text-center py-12 bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-[2rem]">
                        <Clock className="mx-auto text-[#DFD2C4] mb-3" size={32}/>
                        <p className="text-sm font-bold text-[#9A8F84]">No hay registros clínicos previos</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-[#DFD2C4]/40 ml-4 pl-8 space-y-8 pb-4">
                        {evolutions.map((ev) => (
                            <div key={ev.id} className="relative group">
                                <div className="absolute -left-[41px] top-5 w-4 h-4 bg-white border-4 border-[#CBAAA2] group-hover:border-[#5B6651] rounded-full shadow-sm transition-colors z-10" />
                                <div className="bg-white p-6 rounded-[2rem] border border-[#DFD2C4]/60 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 border-b border-[#DFD2C4]/40 pb-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-[#5B6651] uppercase tracking-widest bg-[#5B6651]/5 px-3 py-1.5 rounded-lg border border-[#5B6651]/10">
                                            <Clock size={14} />
                                            {formatDate(ev.created_at)}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#9A8F84] bg-[#FDFBF7] px-3 py-1.5 rounded-lg border border-[#DFD2C4]/50">
                                            <User size={12} className="text-[#CBAAA2]" />
                                            {ev.author}
                                        </div>
                                    </div>
                                    <p className="text-sm text-[#312923] leading-relaxed whitespace-pre-wrap font-medium">
                                        {ev.evolution_text}
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-[#DFD2C4]/30 flex items-center justify-end opacity-50">
                                        <span className="text-[8px] font-mono text-[#9A8F84] flex items-center gap-1" title="Hash criptográfico SHA-256">
                                            <FileLock size={10} /> Hash: {ev.signature_hash.substring(0, 16)}...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}