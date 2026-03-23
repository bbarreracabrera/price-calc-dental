import React from 'react';
import { ArrowLeft, FileText, ArrowRight } from 'lucide-react';
import { Card, InputField } from './UIComponents';
import { ANAMNESIS_TAGS } from '../constants';

export default function PatientAnamnesisTab({
    themeMode, t, getPatient, selectedPatientId, savePatientData,
    session, notify, activeFormType, setActiveFormType,
    viewingForm, setViewingForm
}) {
    const p = getPatient(selectedPatientId);
    
    // Inicializadores seguros de borradores
    const drafts = p.anamnesis?.drafts || { general: {}, cirugia: {}, endodoncia: {} };
    const history = p.anamnesis?.history || [];
    
    const setDraft = (type, field, value) => {
        savePatientData(selectedPatientId, { ...p, anamnesis: { ...p.anamnesis, drafts: { ...drafts, [type]: { ...drafts[type], [field]: value } } } });
    };

    const saveFinalForm = (type) => {
        if (!window.confirm(`¿Guardar esta Ficha de ${type} como definitiva? No se podrá editar después.`)) return;
        
        const newForm = {
            id: Date.now().toString(),
            type: type,
            date: new Date().toLocaleString(),
            author: session?.user?.email,
            data: { ...drafts[type] }
        };
        
        // Guardamos en el historial y limpiamos el borrador
        savePatientData(selectedPatientId, { 
            ...p, 
            anamnesis: { 
                ...p.anamnesis, 
                history: [newForm, ...history],
                drafts: { ...drafts, [type]: {} } // Limpia el formulario
            } 
        });
        notify(`Ficha de ${type} guardada en el historial`);
        setViewingForm(newForm); // Lo abrimos en modo lectura
    };

    // Datos activos según si estamos viendo el historial o escribiendo un borrador
    const activeData = viewingForm ? viewingForm.data : drafts[activeFormType];
    const isReadOnly = viewingForm !== null;

    return (
        <div className="space-y-4 animate-in fade-in h-full flex flex-col">
            {/* CABECERA Y NAVEGACIÓN */}
            <div className="flex justify-between items-center mb-2">
                {isReadOnly ? (
                    <div className="flex items-center gap-3">
                        <button onClick={()=>setViewingForm(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors"><ArrowLeft size={14} className="inline mr-1"/> Volver a Edición</button>
                        <span className="text-sm font-black text-cyan-400 uppercase tracking-widest">Ficha Histórica: {viewingForm.type}</span>
                        <span className="text-[10px] opacity-50 bg-black/20 px-2 py-1 rounded border border-white/5">{viewingForm.date} • {viewingForm.author}</span>
                    </div>
                ) : (
                    <div className="flex bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar w-full">
                        <button onClick={()=>setActiveFormType('general')} className={`flex-1 p-3 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeFormType==='general'?t.accentBg:'opacity-50'}`}> Ficha General</button>
                        <button onClick={()=>setActiveFormType('cirugia')} className={`flex-1 p-3 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeFormType==='cirugia'?'bg-red-500 text-white':'opacity-50'}`}> Cirugía</button>
                        <button onClick={()=>setActiveFormType('endodoncia')} className={`flex-1 p-3 rounded-lg text-[11px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${activeFormType==='endodoncia'?'bg-purple-500 text-white':'opacity-50'}`}> Endodoncia</button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-6">
                {/* --- 1. FICHA GENERAL EXTENDIDA --- */}
                {(isReadOnly ? viewingForm.type === 'general' : activeFormType === 'general') && (
                    <Card theme={themeMode} className="space-y-6 border-t-2 border-t-amber-500 animate-in slide-in-from-left">
                        <h3 className="font-black text-amber-500 uppercase tracking-widest text-sm border-b border-white/5 pb-2">Anamnesis y Examen General</h3>
                        
                        {!isReadOnly && (
                            <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl mb-4">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Alertas Médicas Globales</p>
                                <div className="flex flex-wrap gap-2">
                                    {ANAMNESIS_TAGS.map(tag => {
                                        const isActive = getPatient(selectedPatientId).anamnesis?.conditions?.[tag];
                                        return (
                                            <button key={tag} onClick={() => { 
                                                const pat = getPatient(selectedPatientId); 
                                                const newCond = { ...pat.anamnesis.conditions, [tag]: !isActive }; 
                                                savePatientData(selectedPatientId, { ...pat, anamnesis: { ...pat.anamnesis, conditions: newCond } }); 
                                            }} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${isActive ? 'bg-red-500 border-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-white/5 border-white/10 text-stone-400 hover:border-white/30'}`}>{tag}</button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-1">1. Motivo de Consulta</h4>
                            <InputField theme={themeMode} textarea label="Motivo de Consulta (En palabras del paciente)" disabled={isReadOnly} value={activeData.motivo || ''} onChange={e=>setDraft('general', 'motivo', e.target.value)} />
                            <InputField theme={themeMode} textarea label="Historia de la Enfermedad Actual" disabled={isReadOnly} value={activeData.enfermedadActual || ''} onChange={e=>setDraft('general', 'enfermedadActual', e.target.value)} />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-1">2. Antecedentes Remotos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField theme={themeMode} textarea label="Antecedentes Médicos y Quirúrgicos" disabled={isReadOnly} value={activeData.medicos || ''} onChange={e=>setDraft('general', 'medicos', e.target.value)} />
                                <InputField theme={themeMode} textarea label="Fármacos en Uso y Alergias Detalladas" disabled={isReadOnly} value={activeData.farmacosAlergias || ''} onChange={e=>setDraft('general', 'farmacosAlergias', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField theme={themeMode} textarea label="Hábitos (Tabaco, Alcohol, Bruxismo, etc.)" disabled={isReadOnly} value={activeData.habitos || ''} onChange={e=>setDraft('general', 'habitos', e.target.value)} />
                                <InputField theme={themeMode} textarea label="Antecedentes Odontológicos (Traumas, Ortodoncia previa)" disabled={isReadOnly} value={activeData.odontologicos || ''} onChange={e=>setDraft('general', 'odontologicos', e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b border-white/10 pb-1">3. Examen Físico</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField theme={themeMode} textarea label="Examen Extraoral (ATM, Asimetrías, Ganglios)" disabled={isReadOnly} value={activeData.extraoral || ''} onChange={e=>setDraft('general', 'extraoral', e.target.value)} />
                                <InputField theme={themeMode} textarea label="Examen Intraoral (Mucosas, Lengua, Piso de boca)" disabled={isReadOnly} value={activeData.intraoral || ''} onChange={e=>setDraft('general', 'intraoral', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField theme={themeMode} textarea label="Examen de Oclusión (Clase Angle, Overjet, Guías)" disabled={isReadOnly} value={activeData.oclusion || ''} onChange={e=>setDraft('general', 'oclusion', e.target.value)} />
                                <InputField theme={themeMode} textarea label="Examen Periodontal Inicial (Biotipo, Higiene, Sangrado)" disabled={isReadOnly} value={activeData.periodonto || ''} onChange={e=>setDraft('general', 'periodonto', e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-b border-amber-500/20 pb-1">4. Conclusión</h4>
                            <InputField theme={themeMode} textarea label="Diagnóstico Clínico Integral" disabled={isReadOnly} value={activeData.diagnostico || ''} onChange={e=>setDraft('general', 'diagnostico', e.target.value)} />
                            <InputField theme={themeMode} textarea label="Plan de Tratamiento (Fases)" disabled={isReadOnly} value={activeData.plan || ''} onChange={e=>setDraft('general', 'plan', e.target.value)} />
                        </div>
                    </Card>
                )}

                {/* --- 2. FICHA PRE-QUIRÚRGICA --- */}
                {(isReadOnly ? viewingForm.type === 'cirugia' : activeFormType === 'cirugia') && (
                    <Card theme={themeMode} className="space-y-6 border-t-2 border-t-red-500">
                        <h3 className="font-black text-red-500 uppercase tracking-widest text-sm border-b border-white/5 pb-2">Protocolo Pre-Quirúrgico</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">ASA</label>
                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.asa || ''} onChange={e=>setDraft('cirugia', 'asa', e.target.value)}>
                                    <option value="">Seleccione...</option><option value="I">ASA I</option><option value="II">ASA II</option><option value="III">ASA III</option>
                                </select>
                            </div>
                            <InputField theme={themeMode} label="Presión Art." placeholder="120/80" disabled={isReadOnly} value={activeData.pa || ''} onChange={e=>setDraft('cirugia', 'pa', e.target.value)} />
                            <InputField theme={themeMode} label="Frec. Card." placeholder="Lpm" disabled={isReadOnly} value={activeData.fc || ''} onChange={e=>setDraft('cirugia', 'fc', e.target.value)} />
                            <InputField theme={themeMode} label="HGT (Glicemia)" placeholder="mg/dl" disabled={isReadOnly} value={activeData.hgt || ''} onChange={e=>setDraft('cirugia', 'hgt', e.target.value)} />
                        </div>

                        <InputField theme={themeMode} textarea label="Sistemática Radiográfica" disabled={isReadOnly} value={activeData.rx || ''} onChange={e=>setDraft('cirugia', 'rx', e.target.value)} />
                        
                        <div className="space-y-4 bg-red-500/5 p-4 rounded-2xl border border-red-500/20">
                            <InputField theme={themeMode} textarea label="Diagnóstico Quirúrgico" disabled={isReadOnly} value={activeData.diagnostico || ''} onChange={e=>setDraft('cirugia', 'diagnostico', e.target.value)} />
                            <InputField theme={themeMode} textarea label="Paso a paso Quirúrgico (Técnica)" disabled={isReadOnly} value={activeData.tecnica || ''} onChange={e=>setDraft('cirugia', 'tecnica', e.target.value)} />
                        </div>
                    </Card>
                )}

                {/* --- 3. FICHA ENDODONCIA --- */}
                {(isReadOnly ? viewingForm.type === 'endodoncia' : activeFormType === 'endodoncia') && (
                    <Card theme={themeMode} className="space-y-6 border-t-2 border-t-purple-500">
                        <h3 className="font-black text-purple-500 uppercase tracking-widest text-sm border-b border-white/5 pb-2">Evaluación Endodóntica</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField theme={themeMode} label="Diente a Tratar" type="number" placeholder="Ej: 36" disabled={isReadOnly} value={activeData.diente || ''} onChange={e=>setDraft('endodoncia', 'diente', e.target.value)} />
                            <div className="md:col-span-2">
                                <InputField theme={themeMode} label="Semiología del Dolor" placeholder="Localización, cronología, alivio..." disabled={isReadOnly} value={activeData.dolor || ''} onChange={e=>setDraft('endodoncia', 'dolor', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Pruebas Sensibilidad (Frío)</label>
                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.frio || ''} onChange={e=>setDraft('endodoncia', 'frio', e.target.value)}>
                                    <option value="">Seleccione...</option><option value="Normal">Normal</option><option value="Aumentada (+)">Aumentada (+)</option><option value="Disminuida (-)">Disminuida (-)</option><option value="Sin Respuesta">Sin Respuesta</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Percusión / Palpación</label>
                                <input className={`w-full p-3 rounded-xl border text-sm font-bold outline-none ${t.inputBg} ${t.text} ${t.border}`} placeholder="Vertical (+), Horizontal (-)..." disabled={isReadOnly} value={activeData.percusion || ''} onChange={e=>setDraft('endodoncia', 'percusion', e.target.value)} />
                            </div>
                        </div>

                        <InputField theme={themeMode} textarea label="Examen Radiográfico (Raíces, conductos, zona apical)" disabled={isReadOnly} value={activeData.rx || ''} onChange={e=>setDraft('endodoncia', 'rx', e.target.value)} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 ml-1">Diagnóstico Pulpar</label>
                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.dxPulpar || ''} onChange={e=>setDraft('endodoncia', 'dxPulpar', e.target.value)}>
                                    <option value="">Seleccione...</option>
                                    <option value="Pulpa Normal">Pulpa Normal</option>
                                    <option value="Pulpitis Reversible">Pulpitis Reversible</option>
                                    <option value="Pulpitis Irreversible Sintomática">Pulpitis Irreversible Sintomática</option>
                                    <option value="Pulpitis Irreversible Asintomática">Pulpitis Irreversible Asintomática</option>
                                    <option value="Necrosis Pulpar">Necrosis Pulpar</option>
                                    <option value="Diente Previamente Tratado">Diente Previamente Tratado</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 ml-1">Diagnóstico Periapical</label>
                                <select className={`w-full p-3 rounded-xl border font-bold outline-none text-sm ${t.inputBg} ${t.text} ${t.border}`} disabled={isReadOnly} value={activeData.dxPeriapical || ''} onChange={e=>setDraft('endodoncia', 'dxPeriapical', e.target.value)}>
                                    <option value="">Seleccione...</option>
                                    <option value="Tejido Apical Normal">Tejido Apical Normal</option>
                                    <option value="Periodontitis Apical Sintomática">Periodontitis Apical Sintomática</option>
                                    <option value="Periodontitis Apical Asintomática">Periodontitis Apical Asintomática</option>
                                    <option value="Absceso Apical Agudo">Absceso Apical Agudo</option>
                                    <option value="Absceso Apical Crónico">Absceso Apical Crónico</option>
                                </select>
                            </div>
                        </div>
                    </Card>
                )}

                {/* BOTÓN DE GUARDADO (SOLO EN MODO BORRADOR) */}
                {!isReadOnly && (
                    <button onClick={() => saveFinalForm(activeFormType)} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30">
                        💾 GUARDAR FICHA DEFINITIVA
                    </button>
                )}

                {/* LISTA DE FICHAS HISTÓRICAS DE ESTE PACIENTE */}
                {!isReadOnly && (
                    <div className="pt-6 border-t border-white/10 mt-6">
                        <h4 className="font-bold text-sm mb-3">Historial de Fichas Guardadas</h4>
                        {history.length === 0 ? (
                            <p className="text-xs opacity-50 text-center py-4 border border-dashed border-white/10 rounded-xl">No hay fichas históricas guardadas.</p>
                        ) : (
                            <div className="grid gap-2">
                                {history.map(form => (
                                    <div key={form.id} onClick={() => setViewingForm(form)} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${form.type==='general'?'bg-amber-500/20 text-amber-500':form.type==='cirugia'?'bg-red-500/20 text-red-500':'bg-purple-500/20 text-purple-500'}`}>
                                                <FileText size={16}/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm capitalize">Ficha {form.type}</p>
                                                <p className="text-[10px] opacity-50">{form.date}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400"/>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}