import React, { useEffect, useCallback } from 'react';
import { 
    AlertCircle, FileText, Syringe, Activity, ChevronDown, 
    Save, FilePlus2, CheckSquare, ArrowLeft, ArrowRight, History
} from 'lucide-react';
import { Card, InputField, Button } from './UIComponents';
import { ANAMNESIS_TAGS } from '../constants';
import { useDialog } from './DialogProvider';

export default function PatientAnamnesisTab({
    getPatient, selectedPatientId, savePatientData,
    session, notify, activeFormType, setActiveFormType,
    viewingForm, setViewingForm
}) {
    const { confirm } = useDialog();
    const p = getPatient(selectedPatientId);
    
    const anamnesis = p.anamnesis || { conditions: {}, drafts: {}, history: [] };
    const drafts = anamnesis.drafts || { general: {}, cirugia: {}, endodoncia: {} };
    const history = anamnesis.history || [];
    
    useEffect(() => {
        if (!activeFormType && !viewingForm) setActiveFormType('general');
    }, [activeFormType, viewingForm, setActiveFormType]);

    const availableForms = [
        { id: 'general', label: 'Anamnesis General', icon: FileText, quickAccess: true },
        { id: 'cirugia', label: 'Ficha de Cirugía', icon: Syringe, quickAccess: true },
        { id: 'endodoncia', label: 'Ficha Endodoncia', icon: Activity, quickAccess: true },
        { id: 'ortodoncia', label: 'Ortodoncia', icon: FilePlus2, quickAccess: false },
        { id: 'periodoncia', label: 'Periodoncia', icon: FilePlus2, quickAccess: false },
        { id: 'implantologia', label: 'Implantología', icon: FilePlus2, quickAccess: false },
        { id: 'pediatria', label: 'Odontopediatría', icon: FilePlus2, quickAccess: false },
    ];

    // --- FUNCIÓN CIEGA PARA EVITAR EL BUCLE INFINITO ---
    const handleConditionToggle = useCallback((tag, isActive) => {
        const newCond = { ...anamnesis.conditions, [tag]: !isActive }; 
        savePatientData(selectedPatientId, { ...p, anamnesis: { ...anamnesis, conditions: newCond } }); 
    }, [anamnesis, p, savePatientData, selectedPatientId]);

    const setDraft = (type, field, value) => {
        savePatientData(selectedPatientId, { 
            ...p, 
            anamnesis: { ...anamnesis, drafts: { ...drafts, [type]: { ...drafts[type], [field]: value } } } 
        });
    };

    const saveFinalForm = async (type) => {
        if (!await confirm(`¿Guardar esta Ficha de ${type} como definitiva? No se podrá editar después.`)) return;
        const formLabel = availableForms.find(f => f.id === type)?.label || type;
        const newForm = { id: Date.now().toString(), type: type, label: formLabel, date: new Date().toLocaleString(), author: session?.user?.email || 'Usuario Clínico', data: { ...drafts[type] } };
        savePatientData(selectedPatientId, { ...p, anamnesis: { ...anamnesis, history: [newForm, ...history], drafts: { ...drafts, [type]: {} } } });
        notify(`Ficha de ${formLabel} guardada en el historial`);
        setViewingForm(newForm); 
    };

    const activeData = viewingForm ? viewingForm.data : (drafts[activeFormType] || {});
    const isReadOnly = viewingForm !== null;
    const currentFormDef = availableForms.find(f => f.id === (viewingForm ? viewingForm.type : activeFormType)) || availableForms[0];

    return (
        <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto pb-10">
            
            {/* ALERTAS MÉDICAS */}
            <div className="bg-[#FDFBF7] border border-[#CBAAA2]/50 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#CBAAA2]"></div>
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-[#CBAAA2]/10 rounded-xl text-[#CBAAA2]"><AlertCircle size={20} /></div>
                    <div><h3 className="text-[11px] font-black text-[#312923] uppercase tracking-widest leading-none">Alertas Médicas Activas</h3></div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {ANAMNESIS_TAGS.map(tag => {
                        const isActive = anamnesis.conditions?.[tag];
                        return (
                            <button 
                                key={tag} 
                                onClick={() => handleConditionToggle(tag, isActive)} // Usamos la función segura
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${isActive ? 'bg-[#CBAAA2] border-[#CBAAA2] text-white shadow-sm' : 'bg-white border-[#DFD2C4]/50 text-[#9A8F84] hover:border-[#DFD2C4]'}`}
                            >
                                {isActive && <CheckSquare size={12} />} {tag}
                            </button>
                        );
                    })}
                </div>

                <div className="bg-white p-1 rounded-2xl border border-[#DFD2C4]/50 focus-within:border-[#CBAAA2] transition-colors">
                    <input className="w-full bg-transparent border-none outline-none px-4 py-3 text-[11px] font-bold text-[#312923] placeholder-[#9A8F84]/50" placeholder="Ej: Alergia a la Penicilina..." value={anamnesis.remote || ''} onChange={(e) => savePatientData(selectedPatientId, { ...p, anamnesis: { ...anamnesis, remote: e.target.value } })} />
                </div>
            </div>

            {/* CABECERA: NAVEGACIÓN Y SELECTOR */}
            {isReadOnly ? (
                <div className="flex items-center justify-between bg-white border border-[#DFD2C4]/50 p-4 rounded-3xl shadow-sm">
                    <button onClick={() => setViewingForm(null)} className="flex items-center gap-2 px-4 py-2 bg-[#FDFBF7] hover:bg-[#DFD2C4]/30 rounded-xl text-[10px] font-black text-[#9A8F84] uppercase transition-colors"><ArrowLeft size={14}/> Volver a Edición</button>
                    <div className="text-center"><p className="text-[10px] font-black text-[#5B6651] uppercase mb-1">Archivo Histórico Intocable</p><h2 className="text-lg font-black text-[#312923] capitalize">{viewingForm.label}</h2></div>
                    <div className="text-right hidden sm:block"><p className="text-[10px] font-bold text-[#9A8F84] uppercase">{viewingForm.date}</p><p className="text-[10px] font-bold text-[#6B615A] uppercase">{viewingForm.author}</p></div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#DFD2C4]/50 pb-6">
                    <div className="flex bg-[#FDFBF7] p-1.5 rounded-2xl border border-[#DFD2C4] shadow-sm w-full md:w-auto overflow-x-auto hide-scrollbar">
                        {availableForms.filter(f => f.quickAccess).map(form => {
                            const isActive = activeFormType === form.id;
                            return (
                                <button key={form.id} onClick={() => setActiveFormType(form.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${isActive ? 'bg-[#5B6651] text-white shadow-md' : 'text-[#9A8F84] hover:text-[#5B6651]'}`}>
                                    <form.icon size={16} /> {form.label}
                                </button>
                            )
                        })}
                    </div>
                    <div className="relative w-full md:w-64">
                        <select value={activeFormType} onChange={(e) => setActiveFormType(e.target.value)} className="w-full appearance-none bg-white border border-[#DFD2C4] text-[#312923] text-[10px] font-black uppercase tracking-widest px-5 py-3.5 rounded-2xl outline-none focus:border-[#5B6651] shadow-sm cursor-pointer">
                            <optgroup label="Accesos Rápidos">{availableForms.filter(f => f.quickAccess).map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</optgroup>
                            <optgroup label="Otras Especialidades">{availableForms.filter(f => !f.quickAccess).map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</optgroup>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A8F84] pointer-events-none" />
                    </div>
                </div>
            )}

            {/* LIENZO DE LA FICHA */}
            <div className="bg-white border border-[#DFD2C4]/40 rounded-[2rem] p-6 md:p-10 shadow-sm relative">
                {!isReadOnly && (
                    <div className="flex items-center gap-3 mb-8 border-b border-[#DFD2C4]/40 pb-4">
                        <div className="p-3 bg-[#5B6651]/10 text-[#5B6651] rounded-xl">{React.createElement(currentFormDef.icon, { size: 24 })}</div>
                        <div><h2 className="text-2xl font-black text-[#312923] tracking-tight">{currentFormDef.label}</h2><p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">Borrador en edición</p></div>
                    </div>
                )}

                <div className="space-y-8">
                    {(isReadOnly ? viewingForm.type === 'general' : activeFormType === 'general') && (
                        <>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-[#9A8F84] border-b border-[#DFD2C4]/50 pb-1">1. Motivo de Consulta</h4>
                                <InputField textarea label="Motivo de Consulta" disabled={isReadOnly} value={activeData.motivo || ''} onChange={e=>setDraft('general', 'motivo', e.target.value)} />
                                <InputField textarea label="Historia de la Enfermedad" disabled={isReadOnly} value={activeData.enfermedadActual || ''} onChange={e=>setDraft('general', 'enfermedadActual', e.target.value)} />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-[#9A8F84] border-b border-[#DFD2C4]/50 pb-1">2. Antecedentes Remotos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField textarea label="Médicos y Quirúrgicos" disabled={isReadOnly} value={activeData.medicos || ''} onChange={e=>setDraft('general', 'medicos', e.target.value)} />
                                    <InputField textarea label="Fármacos y Alergias" disabled={isReadOnly} value={activeData.farmacosAlergias || ''} onChange={e=>setDraft('general', 'farmacosAlergias', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField textarea label="Hábitos (Tabaco, Bruxismo)" disabled={isReadOnly} value={activeData.habitos || ''} onChange={e=>setDraft('general', 'habitos', e.target.value)} />
                                    <InputField textarea label="Antecedentes Odontológicos" disabled={isReadOnly} value={activeData.odontologicos || ''} onChange={e=>setDraft('general', 'odontologicos', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-[#9A8F84] border-b border-[#DFD2C4]/50 pb-1">3. Examen Físico</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField textarea label="Examen Extraoral" disabled={isReadOnly} value={activeData.extraoral || ''} onChange={e=>setDraft('general', 'extraoral', e.target.value)} />
                                    <InputField textarea label="Examen Intraoral" disabled={isReadOnly} value={activeData.intraoral || ''} onChange={e=>setDraft('general', 'intraoral', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField textarea label="Examen de Oclusión" disabled={isReadOnly} value={activeData.oclusion || ''} onChange={e=>setDraft('general', 'oclusion', e.target.value)} />
                                    <InputField textarea label="Periodonto Inicial" disabled={isReadOnly} value={activeData.periodonto || ''} onChange={e=>setDraft('general', 'periodonto', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-4 bg-[#FDFBF7] p-5 rounded-[2rem] border border-[#DFD2C4]/50">
                                <h4 className="text-[10px] font-black uppercase text-[#5B6651] border-b border-[#DFD2C4]/50 pb-1">4. Conclusión</h4>
                                <InputField textarea label="Diagnóstico Clínico Integral" disabled={isReadOnly} value={activeData.diagnostico || ''} onChange={e=>setDraft('general', 'diagnostico', e.target.value)} />
                                <InputField textarea label="Plan de Tratamiento" disabled={isReadOnly} value={activeData.plan || ''} onChange={e=>setDraft('general', 'plan', e.target.value)} />
                            </div>
                        </>
                    )}

                    {(isReadOnly ? viewingForm.type === 'cirugia' : activeFormType === 'cirugia') && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-[#9A8F84] ml-1">ASA</label>
                                    <select className="w-full p-3.5 rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] font-bold outline-none text-sm" disabled={isReadOnly} value={activeData.asa || ''} onChange={e=>setDraft('cirugia', 'asa', e.target.value)}>
                                        <option value="">Seleccione...</option><option value="I">ASA I</option><option value="II">ASA II</option><option value="III">ASA III</option>
                                    </select>
                                </div>
                                <InputField label="Presión Art." placeholder="120/80" disabled={isReadOnly} value={activeData.pa || ''} onChange={e=>setDraft('cirugia', 'pa', e.target.value)} />
                                <InputField label="Frec. Card." placeholder="Lpm" disabled={isReadOnly} value={activeData.fc || ''} onChange={e=>setDraft('cirugia', 'fc', e.target.value)} />
                                <InputField label="HGT" placeholder="mg/dl" disabled={isReadOnly} value={activeData.hgt || ''} onChange={e=>setDraft('cirugia', 'hgt', e.target.value)} />
                            </div>
                            <InputField textarea label="Sistemática Radiográfica" disabled={isReadOnly} value={activeData.rx || ''} onChange={e=>setDraft('cirugia', 'rx', e.target.value)} />
                            <div className="space-y-4 bg-[#CBAAA2]/5 p-5 rounded-[2rem] border border-[#CBAAA2]/20">
                                <InputField textarea label="Diagnóstico Quirúrgico" disabled={isReadOnly} value={activeData.diagnostico || ''} onChange={e=>setDraft('cirugia', 'diagnostico', e.target.value)} />
                                <InputField textarea label="Paso a paso (Técnica)" disabled={isReadOnly} value={activeData.tecnica || ''} onChange={e=>setDraft('cirugia', 'tecnica', e.target.value)} />
                            </div>
                        </>
                    )}

                    {(isReadOnly ? viewingForm.type === 'endodoncia' : activeFormType === 'endodoncia') && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InputField label="Diente" type="number" placeholder="Ej: 36" disabled={isReadOnly} value={activeData.diente || ''} onChange={e=>setDraft('endodoncia', 'diente', e.target.value)} />
                                <div className="md:col-span-2"><InputField label="Semiología del Dolor" disabled={isReadOnly} value={activeData.dolor || ''} onChange={e=>setDraft('endodoncia', 'dolor', e.target.value)} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-[#9A8F84] ml-1">Sensibilidad (Frío)</label>
                                    <select className="w-full p-3.5 rounded-2xl border border-[#DFD2C4]/70 bg-[#FDFBF7] font-bold outline-none text-sm" disabled={isReadOnly} value={activeData.frio || ''} onChange={e=>setDraft('endodoncia', 'frio', e.target.value)}>
                                        <option value="">Seleccione...</option><option value="Normal">Normal</option><option value="Aumentada (+)">Aumentada (+)</option><option value="Disminuida (-)">Disminuida (-)</option><option value="Sin Respuesta">Sin Respuesta</option>
                                    </select>
                                </div>
                                <InputField label="Percusión / Palpación" disabled={isReadOnly} value={activeData.percusion || ''} onChange={e=>setDraft('endodoncia', 'percusion', e.target.value)} />
                            </div>
                            <InputField textarea label="Examen Radiográfico" disabled={isReadOnly} value={activeData.rx || ''} onChange={e=>setDraft('endodoncia', 'rx', e.target.value)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FDFBF7] p-5 rounded-[2rem] border border-[#DFD2C4]/50">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-[#5B6651] ml-1">Diagnóstico Pulpar</label>
                                    <select className="w-full p-3.5 rounded-2xl border border-[#DFD2C4]/70 bg-white font-bold outline-none text-sm" disabled={isReadOnly} value={activeData.dxPulpar || ''} onChange={e=>setDraft('endodoncia', 'dxPulpar', e.target.value)}>
                                        <option value="">Seleccione...</option><option value="Pulpa Normal">Pulpa Normal</option><option value="Pulpitis Reversible">Pulpitis Reversible</option><option value="Pulpitis Irreversible Sintomática">Pulpitis Irreversible Sintomática</option><option value="Pulpitis Irreversible Asintomática">Pulpitis Irreversible Asintomática</option><option value="Necrosis Pulpar">Necrosis Pulpar</option><option value="Diente Previamente Tratado">Diente Previamente Tratado</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-[#5B6651] ml-1">Diagnóstico Periapical</label>
                                    <select className="w-full p-3.5 rounded-2xl border border-[#DFD2C4]/70 bg-white font-bold outline-none text-sm" disabled={isReadOnly} value={activeData.dxPeriapical || ''} onChange={e=>setDraft('endodoncia', 'dxPeriapical', e.target.value)}>
                                        <option value="">Seleccione...</option><option value="Tejido Apical Normal">Tejido Apical Normal</option><option value="Periodontitis Apical Sintomática">Periodontitis Apical Sintomática</option><option value="Periodontitis Apical Asintomática">Periodontitis Apical Asintomática</option><option value="Absceso Apical Agudo">Absceso Apical Agudo</option><option value="Absceso Apical Crónico">Absceso Apical Crónico</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {!isReadOnly && !['general', 'cirugia', 'endodoncia'].includes(activeFormType) && (
                        <div className="text-center py-16 bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-[2.5rem]">
                            <FilePlus2 className="mx-auto text-[#DFD2C4] mb-4" size={48}/>
                            <h3 className="text-xl font-black text-[#312923]">Ficha de {currentFormDef.label}</h3>
                            <p className="text-xs font-bold text-[#9A8F84] mt-2 uppercase tracking-widest">Plantilla en desarrollo</p>
                        </div>
                    )}
                </div>

                {!isReadOnly && (
                    <div className="mt-10 flex justify-end border-t border-[#DFD2C4]/40 pt-8">
                        <Button variant="primary" onClick={() => saveFinalForm(activeFormType)} className="flex items-center gap-3 px-8 py-4 bg-[#5B6651] text-white hover:-translate-y-0.5 rounded-2xl font-black uppercase tracking-[0.15em] text-xs">
                            <Save size={18} /> CERRAR FICHA DEFINITIVA
                        </Button>
                    </div>
                )}
            </div>

            {/* LISTA HISTORIAL */}
            {!isReadOnly && (
                <div className="pt-8">
                    <div className="flex items-center gap-3 mb-6"><History className="text-[#9A8F84]" size={20}/><h4 className="font-black text-xl text-[#312923]">Archivo Clínico</h4></div>
                    {history.length === 0 ? (
                        <div className="bg-white border border-[#DFD2C4]/40 rounded-3xl p-10 text-center"><p className="text-sm font-bold text-[#9A8F84]">No hay fichas finalizadas.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {history.map(form => (
                                <div key={form.id} onClick={() => setViewingForm(form)} className="p-5 bg-white border border-[#DFD2C4]/50 rounded-[1.5rem] flex items-start gap-4 cursor-pointer hover:border-[#5B6651]">
                                    <div className="p-3 rounded-2xl bg-[#FDFBF7] text-[#5B6651]"><FileText size={20}/></div>
                                    <div className="flex-1"><p className="font-black text-sm text-[#312923]">{form.label}</p><p className="text-[10px] font-bold text-[#9A8F84] mt-1">{form.date}</p></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}