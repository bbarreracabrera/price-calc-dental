import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Mic, MicOff, Droplets, Image as ImageIcon, ZoomIn, Calendar } from 'lucide-react';
import { Card } from './UIComponents';
import { ToothSVG } from './ToothSystem';
import { PrivateImage } from './SystemModals'; 

export default function ToothModal({
    themeMode, toothModalData, setToothModalData, setModal, activeTab,
    perioData, setPerioData, handlePerioChange, calcNIC, isPerioVoiceActive,
    startPerioDictation, voiceFeedback, isListening, toggleVoice, catalog,
    getPatient, selectedPatientId, savePatientData, notify, goToAdjacentTooth
}) {
    const patient = getPatient(selectedPatientId);
    
    // Visor de radiografías
    const [localZoomImg, setLocalZoomImg] = useState(null);

    const relatedImages = patient.images?.filter(img => img.tooth === toothModalData.id.toString())
        .sort((a, b) => b.id - a.id) || []; 

    const handlePerioToggle = (face, field, index) => {
        setToothModalData(prev => {
            const currentPerio = prev.perio || {};
            const key = `${field}_${face}`; 
            const newArray = [...(currentPerio[key] || [false, false, false])];
            newArray[index] = !newArray[index]; 
            return { ...prev, perio: { ...currentPerio, [key]: newArray } };
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-[#312923]/40 backdrop-blur-sm" onClick={() => setModal(null)} />

            <Card className="w-full max-w-md h-full relative z-10 shadow-2xl border-l border-[#DFD2C4]/50 flex flex-col animate-in slide-in-from-right duration-300 rounded-none bg-white">
                
                {/* --- ENCABEZADO Y NAVEGACIÓN --- */}
                <div className="p-6 border-b border-[#DFD2C4]/40 flex justify-between items-center bg-[#FDFBF7] shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => goToAdjacentTooth(-1)} className="p-2 bg-white hover:bg-[#DFD2C4]/30 border border-[#DFD2C4]/50 text-[#9A8F84] rounded-xl transition-all"><ChevronLeft size={20} /></button>
                        <h3 className="text-3xl font-black tracking-tighter w-20 text-center text-[#312923]">{toothModalData.id}</h3>
                        <button onClick={() => goToAdjacentTooth(1)} className="p-2 bg-white hover:bg-[#DFD2C4]/30 border border-[#DFD2C4]/50 text-[#9A8F84] rounded-xl transition-all"><ChevronRight size={20} /></button>
                    </div>
                    <button onClick={() => setModal(null)} className="p-2 text-[#9A8F84] hover:bg-[#DFD2C4]/30 hover:text-[#312923] rounded-xl transition-all border border-transparent hover:border-[#DFD2C4]/50"><X size={24} /></button>
                </div>

                {/* --- CARRUSEL DE RADIOGRAFÍAS --- */}
                {relatedImages.length > 0 && (
                    <div className="px-6 pt-5 pb-2 bg-white border-b border-[#DFD2C4]/30 shrink-0">
                        <div className="flex justify-between items-end mb-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5B6651] flex items-center gap-2">
                                <ImageIcon size={14}/> Historial Radiográfico
                            </h4>
                            <span className="text-[9px] font-bold text-[#9A8F84] bg-[#FDFBF7] px-2 py-0.5 rounded-md border border-[#DFD2C4]/50">
                                {relatedImages.length} {relatedImages.length === 1 ? 'Archivo' : 'Archivos'}
                            </span>
                        </div>
                        
                        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-3 hide-scrollbar">
                            {relatedImages.map(img => {
                                const dateStr = img.created_at ? new Date(img.created_at).toLocaleDateString('es-CL') : 'Histórico';
                                return (
                                    <div 
                                        key={img.id} 
                                        className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-[#DFD2C4] bg-[#FDFBF7] shadow-sm group cursor-pointer hover:border-[#CBAAA2] transition-colors"
                                    >
                                        <div className="w-full h-full object-cover">
                                            <PrivateImage img={img} onClick={setLocalZoomImg} />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#312923]/80 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end pointer-events-none">
                                            <ZoomIn size={14} className="text-white mx-auto mb-1"/>
                                            <span className="text-[8px] font-black text-white text-center tracking-widest uppercase">{dateStr}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                    
                    {/* --- PERIODONTOGRAMA --- */}
                    {toothModalData.mode === 'perio' && (
                        <div className="p-5 border border-[#DFD2C4]/50 rounded-[2rem] bg-[#FDFBF7] shadow-inner animate-in fade-in">
                            <h3 className="text-xs font-black text-[#5B6651] uppercase tracking-widest mb-4 border-b border-[#DFD2C4]/50 pb-2 flex items-center justify-between">
                                <span>📏 Sondaje Periodontal</span>
                                <button onClick={() => toggleVoice()} className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30' : 'bg-white text-[#9A8F84] border border-[#DFD2C4]'}`} title="Dictado por Voz">
                                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                                </button>
                            </h3>

                            {['v', 'l'].map(face => (
                                <div key={face} className="mb-6 bg-white p-4 rounded-2xl border border-[#DFD2C4]/50 relative mt-5 shadow-sm">
                                    <h4 className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-wider mb-2 text-center absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FDFBF7] px-4 py-1 rounded-full border border-[#DFD2C4]/50">
                                        {face === 'v' ? 'Vestibular' : (parseInt(toothModalData.id) > 30 ? 'Lingual' : 'Palatino')}
                                    </h4>
                                    
                                    <div className="grid grid-cols-4 gap-1 mb-2 mt-4">
                                        <div></div>
                                        <span className="text-[9px] text-center font-black text-[#9A8F84] uppercase tracking-widest">Dist</span>
                                        <span className="text-[9px] text-center font-black text-[#9A8F84] uppercase tracking-widest">Cent</span>
                                        <span className="text-[9px] text-center font-black text-[#9A8F84] uppercase tracking-widest">Mesi</span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-4 gap-1 items-center mb-1">
                                            <span className="text-[9px] font-bold text-right pr-2 text-[#6B615A] leading-tight">BOP<br/><span className="text-[8px] opacity-50">/ PUS</span></span>
                                            {[0, 1, 2].map(idx => (
                                                <div key={`toggles-${face}-${idx}`} className="flex justify-center gap-1">
                                                    <button 
                                                        onClick={() => handlePerioToggle(face, 'bop', idx)}
                                                        className={`w-6 h-6 rounded flex items-center justify-center text-[11px] transition-all ${toothModalData.perio?.[`bop_${face}`]?.[idx] ? 'bg-red-100 border border-red-500 text-red-600 shadow-sm scale-110' : 'bg-[#FDFBF7] border border-[#DFD2C4] opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`}
                                                        title="Sangrado al Sondaje"
                                                    >🩸</button>
                                                    <button 
                                                        onClick={() => handlePerioToggle(face, 'pus', idx)}
                                                        className={`w-6 h-6 rounded flex items-center justify-center text-[11px] transition-all ${toothModalData.perio?.[`pus_${face}`]?.[idx] ? 'bg-amber-100 border border-amber-500 text-amber-600 shadow-sm scale-110' : 'bg-[#FDFBF7] border border-[#DFD2C4] opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`}
                                                        title="Supuración"
                                                    >🟡</button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-4 gap-1 items-center">
                                            <span className="text-[10px] font-bold text-right pr-2 text-[#6B615A]">Prof.</span>
                                            {[0, 1, 2].map(idx => (
                                                <input key={`pd-${face}-${idx}`} type="text" value={toothModalData.perio?.[`pd_${face}`]?.[idx] ?? ''} onChange={(e) => handlePerioChange(face, 'pd', idx, e.target.value)} className={`w-full h-9 text-center text-sm font-black rounded-xl border outline-none transition-colors ${toothModalData.perio?.[`pd_${face}`]?.[idx] >= 4 ? 'border-red-400 text-red-600 bg-red-50' : 'border-[#DFD2C4] bg-[#FDFBF7] focus:border-[#5B6651] text-[#312923]'}`} />
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-4 gap-1 items-center">
                                            <span className="text-[10px] font-bold text-right pr-2 text-[#6B615A]">Margen</span>
                                            {[0, 1, 2].map(idx => (
                                                <input key={`mg-${face}-${idx}`} type="text" value={toothModalData.perio?.[`mg_${face}`]?.[idx] ?? ''} onChange={(e) => handlePerioChange(face, 'mg', idx, e.target.value)} className="w-full h-9 text-center text-sm font-black rounded-xl bg-[#FDFBF7] border border-[#DFD2C4] focus:border-[#5B6651] outline-none text-[#5B6651]" />
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-4 gap-1 items-center mt-3 pt-3 border-t border-[#DFD2C4]/50">
                                            <span className="text-[11px] font-black text-right pr-2 text-[#312923]">N.I.C.</span>
                                            {[0, 1, 2].map(idx => {
                                                const nic = calcNIC(toothModalData.perio?.[`pd_${face}`]?.[idx], toothModalData.perio?.[`mg_${face}`]?.[idx]);
                                                return (
                                                    <div key={`nic-${face}-${idx}`} className={`w-full h-8 flex items-center justify-center text-sm font-black rounded-xl ${nic >= 4 || nic === '-' ? 'bg-[#CBAAA2]/20 text-[#CBAAA2]' : 'bg-[#5B6651]/10 text-[#5B6651]'}`}>{nic}</div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] ml-1">Movilidad</label>
                                    <select className="w-full p-3 rounded-xl bg-white border border-[#DFD2C4] text-xs font-black outline-none text-[#6B615A]" value={toothModalData.perio?.mobility || 0} onChange={(e) => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, mobility: parseInt(e.target.value) } }))}><option value={0}>Grado 0</option><option value={1}>Grado I</option><option value={2}>Grado II</option><option value={3}>Grado III</option></select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84] ml-1">Furca</label>
                                    <select className="w-full p-3 rounded-xl bg-white border border-[#DFD2C4] text-xs font-black outline-none text-[#6B615A]" value={toothModalData.perio?.furcation || 0} onChange={(e) => setToothModalData(prev => ({ ...prev, perio: { ...prev.perio, furcation: parseInt(e.target.value) } }))}><option value={0}>Grado 0</option><option value={1}>Grado I</option><option value={2}>Grado II</option><option value={3}>Grado III</option></select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ODONTOGRAMA Y DETALLE CLINICO --- */}
                    {toothModalData.mode !== 'perio' && (
                        <>
                            <div className="flex bg-[#FDFBF7] p-1.5 rounded-2xl border border-[#DFD2C4]/50 shadow-sm">
                                <button onClick={() => setToothModalData({...toothModalData, mode: 'hallazgos'})} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${toothModalData.mode === 'hallazgos' ? 'bg-[#5B6651] text-white shadow-md' : 'text-[#9A8F84] hover:text-[#312923]'}`}>Diagnóstico</button>
                                <button onClick={() => setToothModalData({...toothModalData, mode: 'tratamientos'})} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${toothModalData.mode === 'tratamientos' ? 'bg-[#CBAAA2] text-white shadow-md' : 'text-[#9A8F84] hover:text-[#312923]'}`}>Planificación</button>
                            </div>

                            {toothModalData.mode === 'hallazgos' ? (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className={`flex flex-col items-center py-8 rounded-[2rem] border border-[#DFD2C4]/50 bg-[#FDFBF7] shadow-sm`}>
                                        <ToothSVG number={toothModalData.id} faces={toothModalData.faces} status={toothModalData.status} size={100} interactive={true} activeFace={toothModalData.activeFace || 'o'} onFaceClick={(face) => setToothModalData({...toothModalData, activeFace: face})} />
                                        <div className="mt-6 bg-white px-6 py-2 rounded-full border border-[#DFD2C4] shadow-sm">
                                            <p className="text-[10px] font-black text-[#9A8F84] uppercase tracking-[0.2em]">Cara: <span className="text-[#5B6651] ml-2">{toothModalData.activeFace === 'v' ? 'Vestibular' : toothModalData.activeFace === 'l' ? 'Lingual/Palatino' : toothModalData.activeFace === 'm' ? 'Mesial' : toothModalData.activeFace === 'd' ? 'Distal' : 'Oclusal'}</span></p>
                                        </div>
                                    </div>
                                    
                                    {/* --- BOTONES ENTERPRISE --- */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2.5">
                                            <span className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest ml-1 border-b border-[#DFD2C4]/50 pb-1 block">En Cara</span>
                                            <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'caries'}})} className="w-full p-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 rounded-xl text-[10px] font-black transition-all shadow-sm">🔴 CARIES</button>
                                            <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'filled'}})} className="w-full p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white border border-blue-200 rounded-xl text-[10px] font-black transition-all shadow-sm">🔵 RESINA</button>
                                            <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'sealant'}})} className="w-full p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 rounded-xl text-[10px] font-black transition-all shadow-sm">SELLANTE</button>
                                            <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: 'veneer'}})} className="w-full p-2.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-400 hover:text-white border border-yellow-200 rounded-xl text-[10px] font-black transition-all shadow-sm">CARILLA</button>
                                            <button onClick={() => setToothModalData({...toothModalData, faces: {...toothModalData.faces, [toothModalData.activeFace || 'o']: null}})} className="w-full p-2.5 bg-[#FDFBF7] text-[#6B615A] hover:bg-white hover:text-[#312923] border border-[#DFD2C4] rounded-xl text-[10px] font-black transition-all shadow-sm">⚪ LIMPIAR CARA</button>
                                        </div>
                                        <div className="space-y-2.5">
                                            <span className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest ml-1 border-b border-[#DFD2C4]/50 pb-1 block">En Pieza Entera</span>
                                            <button onClick={() => setToothModalData(prev => ({...prev, status: prev.status?.includes('endo') ? prev.status.filter(s=>s!=='endo') : [...(prev.status||[]), 'endo']}))} className="w-full p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 rounded-xl text-[10px] font-black transition-all shadow-sm">ENDODONCIA</button>
                                            <button onClick={() => setToothModalData(prev => ({...prev, status: prev.status?.includes('implant') ? prev.status.filter(s=>s!=='implant') : [...(prev.status||[]), 'implant']}))} className="w-full p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-500 hover:text-white border border-slate-300 rounded-xl text-[10px] font-black transition-all shadow-sm">🔩 IMPLANTE</button>
                                            <button onClick={() => setToothModalData(prev => ({...prev, status: prev.status?.includes('crown') ? prev.status.filter(s=>s!=='crown') : [...(prev.status||[]), 'crown']}))} className="w-full p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-400 hover:text-white border border-amber-200 rounded-xl text-[10px] font-black transition-all shadow-sm">🟡 CORONA</button>
                                            <button onClick={() => setToothModalData({...toothModalData, status: ['extract'], faces: {}})} className="w-full p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-200 rounded-xl text-[10px] font-black transition-all shadow-sm">✂️ EXT. INDICADA</button>
                                            <button onClick={() => setToothModalData({...toothModalData, status: ['missing'], faces: {}})} className="w-full p-2.5 bg-[#FDFBF7] text-[#9A8F84] hover:bg-[#9A8F84] hover:text-white border border-[#DFD2C4] rounded-xl text-[10px] font-black transition-all shadow-sm">❌ AUSENTE</button>
                                            <button onClick={() => setToothModalData({...toothModalData, faces: {v:null,l:null,m:null,d:null,o:null}, status: []})} className="w-full p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 rounded-xl text-[10px] font-black transition-all shadow-sm">✅ SANO / LIMPIAR</button>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <label className="text-[10px] font-black text-[#9A8F84] uppercase tracking-widest mb-2 block border-b border-[#DFD2C4]/50 pb-1">Observaciones</label>
                                        <textarea rows="3" className={`w-full p-5 rounded-[1.5rem] border border-[#DFD2C4]/70 bg-[#FDFBF7] outline-none focus:border-[#5B6651] font-medium text-sm resize-none`} value={toothModalData.notes || ''} onChange={e => setToothModalData({...toothModalData, notes: e.target.value})} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="w-full bg-[#FDFBF7] p-5 rounded-[2rem] border border-[#DFD2C4]/50">
                                        <label className="text-[10px] font-black uppercase tracking-widest mb-2 block ml-1 text-[#9A8F84]">Tratamiento Planificado</label>
                                        <input list="catalog-tooth-options" className={`w-full outline-none font-bold text-[#312923] text-sm p-4 rounded-xl border border-[#DFD2C4] bg-white focus:border-[#CBAAA2] transition-all`} placeholder="Busca en tu arancel..." value={toothModalData.treatment?.name || ''} onChange={e => setToothModalData({...toothModalData, treatment: {...(toothModalData.treatment || {}), name: e.target.value, status: toothModalData.treatment?.status || 'planned'}})} />
                                        <datalist id="catalog-tooth-options">{catalog.map(c => <option key={c.id} value={c.name} />)}</datalist>
                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <button onClick={() => setToothModalData({...toothModalData, treatment: {...toothModalData.treatment, status: 'planned'}})} className={`p-3.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${toothModalData.treatment?.status === 'planned' ? 'bg-[#CBAAA2] border-[#CBAAA2] text-white shadow-md' : 'bg-white text-[#9A8F84] border-[#DFD2C4]'}`}>Pendiente</button>
                                            <button onClick={() => setToothModalData({...toothModalData, treatment: {...toothModalData.treatment, status: 'completed'}})} className={`p-3.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${toothModalData.treatment?.status === 'completed' ? 'bg-[#5B6651] border-[#5B6651] text-white shadow-md' : 'bg-white text-[#9A8F84] border-[#DFD2C4]'}`}>Realizado</button>
                                        </div>
                                    </div>
                                    <button onClick={() => setToothModalData({...toothModalData, treatment: null})} className="w-full p-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">Eliminar Tratamiento</button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* --- BOTÓN DE GUARDADO --- */}
                <div className="p-6 border-t border-[#DFD2C4]/40 bg-[#FDFBF7] shrink-0">
                    <button 
                        onClick={() => {
                            const p = getPatient(selectedPatientId); 
                            
                            const updatedTeeth = {...p.clinical?.teeth, [toothModalData.id]: {
                                id: toothModalData.id,
                                status: toothModalData.status, 
                                faces: toothModalData.faces, 
                                notes: toothModalData.notes, 
                                treatment: toothModalData.treatment 
                            }}; 
                            
                            const updatedPerio = {
                                ...p.clinical?.perio, 
                                [toothModalData.id]: toothModalData.perio || {}
                            };
                            
                            savePatientData(selectedPatientId, {
                                ...p, 
                                clinical: {
                                    ...p.clinical, 
                                    teeth: updatedTeeth,
                                    perio: updatedPerio
                                }
                            }); 
                            
                            setModal(null); 
                            notify("Datos clínicos guardados con éxito");
                        }}
                        className="w-full py-4 bg-[#312923] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#1a1512] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        Guardar Clínica
                    </button>
                </div>
            </Card>

            {/* --- VISOR ZOOM DE RADIOGRAFÍAS --- */}
            {localZoomImg && (
                <div className="fixed inset-0 z-[200] bg-[#2A2421]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer animate-in fade-in" onClick={()=>setLocalZoomImg(null)}>
                    <img src={localZoomImg} className="max-w-full max-h-[85%] rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95" alt="Radiografía Ampliada" />
                    <span className="mt-6 px-6 py-2 rounded-full bg-white/10 text-white font-bold text-xs uppercase tracking-widest backdrop-blur-sm border border-white/20">
                        Cerrar Radiografía
                    </span>
                </div>
            )}

        </div>
    );
}