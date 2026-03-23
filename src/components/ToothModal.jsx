import React from 'react';
import { ChevronLeft, ChevronRight, X, Mic, MicOff } from 'lucide-react';
import { Card } from './UIComponents';
import { ToothSVG } from './ToothSystem';

export default function ToothModal({
    themeMode, t, toothModalData, setToothModalData, setModal, activeTab,
    perioData, setPerioData, handlePerioChange, calcNIC, isPerioVoiceActive,
    startPerioDictation, voiceFeedback, isListening, toggleVoice, catalog,
    getPatient, selectedPatientId, savePatientData, notify, goToAdjacentTooth
}) {
    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Fondo sutil */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setModal(null)} />

            <Card theme={themeMode} className="w-full max-w-sm h-full relative z-10 shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300 rounded-none">
                
                {/* ENCABEZADO CON NAVEGACIÓN RÁPIDA (NUEVO) */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <button onClick={() => goToAdjacentTooth(-1)} className="p-1.5 bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 rounded-lg transition-all"><ChevronLeft size={20} /></button>
                        <h3 className="text-2xl font-black italic tracking-tighter w-20 text-center text-cyan-500">{toothModalData.id}</h3>
                        <button onClick={() => goToAdjacentTooth(1)} className="p-1.5 bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 rounded-lg transition-all"><ChevronRight size={20} /></button>
                    </div>
                    <button onClick={() => setModal(null)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* --- SECCIÓN: PERIODONTOGRAMA TIPO DENTALINK (SOLO EN MODO PERIO) --- */}
                    {activeTab === 'perio' && (
                        <div className="p-4 border border-white/10 rounded-3xl bg-black/5 dark:bg-white/5 shadow-inner animate-in fade-in">
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                <h3 className="text-sm font-black text-cyan-600 dark:text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                                    📏 Periodontograma
                                </h3>
                            </div>

                            {/* TABLAS VESTIBULAR Y LINGUAL/PALATINO */}
                            {['v', 'l'].map(face => (
                                <div key={face} className="mb-5 bg-white/5 p-3 rounded-2xl border border-white/5 relative mt-4">
                                    <h4 className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-2 text-center absolute -top-3 left-1/2 -translate-x-1/2 bg-[#121212] px-3 py-0.5 rounded-full border border-white/10">
                                        {face === 'v' ? 'Vestibular' : (parseInt(toothModalData.id) > 30 ? 'Lingual' : 'Palatino')}
                                    </h4>
                                    
                                    <div className="grid grid-cols-4 gap-1 mb-1 mt-2">
                                        <div></div>
                                        <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Dist</span>
                                        <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Cent</span>
                                        <span className="text-[8px] text-center font-black opacity-40 uppercase tracking-widest">Mesi</span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="grid grid-cols-4 gap-1 items-center">
                                            <span className="text-[9px] font-bold text-right pr-1 opacity-70">Prof.</span>
                                            {[0, 1, 2].map(idx => (
                                                <input key={`pd-${face}-${idx}`} type="text" value={toothModalData.perio?.[`pd_${face}`]?.[idx] ?? ''} onChange={(e) => handlePerioChange(face, 'pd', idx, e.target.value)} className={`w-full h-8 text-center text-xs font-bold rounded-lg bg-black/20 border outline-none ${toothModalData.perio?.[`pd_${face}`]?.[idx] >= 4 ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-white/10 focus:border-cyan-500'}`} />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-4 gap-1 items-center">
                                            <span className="text-[9px] font-bold text-right pr-1 opacity-70">Margen</span>
                                            {[0, 1, 2].map(idx => (
                                                <input key={`mg-${face}-${idx}`} type="text" value={toothModalData.perio?.[`mg_${face}`]?.[idx] ?? ''} onChange={(e) => handlePerioChange(face, 'mg', idx, e.target.value)} className="w-full h-8 text-center text-xs font-bold rounded-lg bg-black/20 border border-white/10 focus:border-blue-400 outline-none text-blue-400" />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-4 gap-1 items-center mt-2 pt-2 border-t border-white/5">
                                            <span className="text-[10px] font-black text-right pr-1 text-cyan-600">NIC</span>
                                            {[0, 1, 2].map(idx => {
                                                const nic = calcNIC(toothModalData.perio?.[`pd_${face}`]?.[idx], toothModalData.perio?.[`mg_${face}`]?.[idx]);
                                                return (
                                                    <div key={`nic-${face}-${idx}`} className={`w-full h-7 flex items-center justify-center text-xs font-black rounded-lg bg-black/10 ${nic >= 4 || nic === '-' ? 'text-orange-500' : 'text-emerald-500'}`}>{nic}</div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* ALERTAS PERIO */}
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                <button onClick={() => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, bop: !prev.perio?.bop } }))} className={`p-2 rounded-xl border text-[10px] font-black transition-all ${toothModalData.perio?.bop ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-transparent border-white/10 opacity-50'}`}>🩸 BOP</button>
                                <button onClick={() => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, pus: !prev.perio?.pus } }))} className={`p-2 rounded-xl border text-[10px] font-black transition-all ${toothModalData.perio?.pus ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-transparent border-white/10 opacity-50'}`}>🟡 PUS</button>
                                <select className="p-2 rounded-xl bg-transparent border border-white/10 text-[10px] font-black outline-none text-center appearance-none" value={toothModalData.perio?.mobility || 0} onChange={(e) => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, mobility: parseInt(e.target.value) } }))}><option value={0} className="bg-[#121212]">Mov 0</option><option value={1} className="bg-[#121212]">Mov I</option><option value={2} className="bg-[#121212]">Mov II</option><option value={3} className="bg-[#121212]">Mov III</option></select>
                                <select className="p-2 rounded-xl bg-transparent border border-white/10 text-[10px] font-black outline-none text-center appearance-none" value={toothModalData.perio?.furcation || 0} onChange={(e) => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, furcation: parseInt(e.target.value) } }))}><option value={0} className="bg-[#121212]">Furca 0</option><option value={1} className="bg-[#121212]">Furca I</option><option value={2} className="bg-[#121212]">Furca II</option><option value={3} className="bg-[#121212]">Furca III</option></select>
                            </div>
                        </div>
                    )}

                    {/* Selector de Modo (Hallazgos vs Tratamientos) */}
                    <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl">
                        <button onClick={() => setToothModalData({...toothModalData, mode: 'hallazgos'})} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${toothModalData.mode === 'hallazgos' ? 'bg-white dark:bg-white/10 shadow-sm text-cyan-500' : 'opacity-50'}`}>Hallazgos</button>
                        <button onClick={() => setToothModalData({...toothModalData, mode: 'tratamientos'})} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${toothModalData.mode === 'tratamientos' ? 'bg-white dark:bg-white/10 shadow-sm text-cyan-500' : 'opacity-50'}`}>Tratamientos</button>
                    </div>

                    {toothModalData.mode === 'hallazgos' ? (
                        /* --- MODO HALLAZGOS --- */
                        <div className="space-y-6 animate-in fade-in">
                            <div className={`flex flex-col items-center p-6 rounded-3xl border transition-colors ${t.border} bg-black/5 dark:bg-white/5 shadow-inner`}>
                                <ToothSVG number={toothModalData.id} faces={toothModalData.faces} status={toothModalData.status} size={100} interactive={true} activeFace={toothModalData.activeFace || 'o'} onFaceClick={(face) => setToothModalData({...toothModalData, activeFace: face})} />
                                <p className="text-[10px] font-black opacity-50 mt-4 uppercase tracking-[0.2em]">
                                    Cara: <span className="text-cyan-500">{toothModalData.activeFace === 'v' ? 'Vestibular' : toothModalData.activeFace === 'l' ? 'Lingual/Palatino' : toothModalData.activeFace === 'm' ? 'Mesial' : toothModalData.activeFace === 'd' ? 'Distal' : 'Oclusal'}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">En Cara</span>
                                    <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'caries'}, status: null})} className="w-full p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-2xl text-[11px] font-black transition-all">🔴 CARIES</button>
                                    <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'filled'}, status: null})} className="w-full p-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 rounded-2xl text-[11px] font-black transition-all">🔵 RESINA</button>
                                    <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: null}})} className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black transition-all opacity-70 hover:opacity-100">⚪ LIMPIAR CARA</button>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">En Pieza</span>
                                    <button onClick={() => setToothModalData({...toothModalData, status: 'crown'})} className="w-full p-3 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-black border border-yellow-500/20 rounded-2xl text-[11px] font-black transition-all">🟡 CORONA</button>
                                    <button onClick={() => setToothModalData({...toothModalData, status: 'missing'})} className="w-full p-3 bg-stone-500/10 text-stone-500 hover:bg-stone-500 hover:text-white border border-stone-500/20 rounded-2xl text-[11px] font-black transition-all">❌ AUSENTE</button>
                                    <button onClick={() => setToothModalData({...toothModalData, faces: {v:null,l:null,m:null,d:null,o:null}, status:null})} className="w-full p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-2xl text-[11px] font-black transition-all">✅ DIENTE SANO</button>
                                </div>
                            </div>
                            
                            <div className="pt-4">
                                <label className="text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40">Evolución Clínica</label>
                                <div className="relative group">
                                    <textarea rows="4" placeholder="Dicta hallazgos..." className={`w-full p-5 rounded-3xl border ${t.border} ${t.inputBg} outline-none focus:border-cyan-500 font-bold text-sm resize-none transition-all shadow-inner`} value={toothModalData.notes || ''} onChange={e => setToothModalData({...toothModalData, notes: e.target.value})} />
                                    <button onClick={() => toggleVoice()} className={`absolute bottom-4 right-4 p-4 rounded-2xl transition-all shadow-lg ${isListening ? 'bg-red-500 animate-pulse text-white scale-110' : 'bg-cyan-500 text-white shadow-cyan-500/20'}`}>
                                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* --- MODO TRATAMIENTOS --- */
                        <div className="space-y-6 animate-in fade-in">
                            <div className="w-full">
                                <label className="text-[10px] font-black uppercase tracking-widest mb-1 block ml-1 text-stone-400">Tratamiento Planificado</label>
                                <input list="catalog-tooth-options" className={`w-full outline-none font-bold text-sm p-4 rounded-2xl border ${t.border} ${t.inputBg} focus:border-cyan-400 transition-all shadow-inner`} placeholder="Busca en tu arancel..." value={toothModalData.treatment?.name || ''} onChange={e => setToothModalData({...toothModalData, treatment: {...(toothModalData.treatment || {}), name: e.target.value, status: toothModalData.treatment?.status || 'planned'}})} />
                                <datalist id="catalog-tooth-options">{catalog.map(c => <option key={c.id} value={c.name} />)}</datalist>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button onClick={() => setToothModalData({...toothModalData, treatment: {...toothModalData.treatment, status: 'planned'}})} className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${toothModalData.treatment?.status === 'planned' ? 'bg-red-500/20 border-red-500 text-red-500 shadow-lg shadow-red-500/10' : 'border-white/10 opacity-50'}`}>Por Hacer</button>
                                <button onClick={() => setToothModalData({...toothModalData, treatment: {...toothModalData.treatment, status: 'completed'}})} className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${toothModalData.treatment?.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-white/10 opacity-50'}`}>Realizado</button>
                            </div>
                            <button onClick={() => setToothModalData({...toothModalData, treatment: null})} className="w-full p-2 text-[10px] font-bold text-red-400 opacity-50 hover:opacity-100 uppercase tracking-widest transition-opacity">Eliminar Tratamiento</button>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 bg-black/5">
                    <button 
                        onClick={() => {
                            const p = getPatient(selectedPatientId); 
                            const ut = {...p.clinical.teeth, [toothModalData.id]: {
                                status: toothModalData.status, 
                                faces: toothModalData.faces, 
                                notes: toothModalData.notes, 
                                treatment: toothModalData.treatment,
                                perio: toothModalData.perio 
                            }}; 
                            savePatientData(selectedPatientId, {...p, clinical: {...p.clinical, teeth: ut}}); 
                            setModal(null); 
                            notify("Diente Guardado con éxito");
                        }}
                        className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-cyan-400 transition-all shadow-xl active:scale-95"
                    >
                        GUARDAR DATOS
                    </button>
                </div>
            </Card>
        </div>
    );
}