import React, { useState } from 'react';
import { Card } from './UIComponents';
import { Tooth, HygieneCell } from './ToothSystem';
import { TEETH_UPPER, TEETH_LOWER, TEETH_UPPER_PED, TEETH_LOWER_PED } from '../constants';
import { Save, History } from 'lucide-react';

export default function PerioTab({
    themeMode, getPatient, selectedPatientId, savePatientData,
    savePerioSnapshot, getPerioStats, setToothModalData, setPerioData, setModal, restoreSnapshot
}) {
    const [perioDentition, setPerioDentition] = useState('adulto');
    const p = getPatient(selectedPatientId);

    // --- RENDERIZADORES OPTIMIZADOS ---
    const renderPerioRow = (teethArray, face) => (
        <div className="flex gap-1 lg:gap-1.5 justify-center w-full" style={{ flexWrap: 'nowrap' }}>
            {teethArray.map(n => (
                <Tooth key={`${face}-${n}`} number={n} isPerioMode={true} perioFace={face} perioData={p.clinical.perio?.[n]} status={p.clinical.teeth[n]?.status} 
                    onClick={()=>{
                        // ¡AQUÍ ESTABA EL BUG! Ahora sí extraemos los datos de Perio previos
                        const existingPerio = p.clinical.perio?.[n] || {}; 

                        setToothModalData({
                            id: n, 
                            mode: 'perio', 
                            ...p.clinical.teeth[n],
                            faces: p.clinical.teeth[n]?.faces || { v: null, l: null, m: null, d: null, o: null },
                            treatment: p.clinical.teeth[n]?.treatment || { name: '', status: 'planned' },
                            perio: existingPerio // <-- ¡ESTA LÍNEA ES VITAL PARA QUE NO SE BORRE NADA!
                        }); 
                        
                        // Sincronizamos el dibujo central
                        setPerioData(existingPerio); 
                        setModal('tooth'); 
                    }} theme={themeMode}/>
            ))}
        </div>
    );

    const renderHygieneRow = (teethArray) => (
        <div className="flex gap-1.5 lg:gap-2 justify-center w-full" style={{ flexWrap: 'nowrap' }}>
            {teethArray.map(t => { 
                const st = p.clinical.teeth[t]?.status;
                const isMissing = Array.isArray(st) ? st.includes('missing') : st === 'missing';
                if(isMissing) return null; 
                return ( 
                    <HygieneCell key={t} tooth={t} data={p.clinical.hygiene?.[t]} 
                        onChange={(face) => { 
                            const current = p.clinical.hygiene?.[t] || {}; 
                            const newData = { ...p.clinical.hygiene, [t]: { ...current, [face]: !current[face] } }; 
                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, hygiene: newData } }); 
                        }} 
                    /> 
                ); 
            })}
        </div>
    );

    const hideScrollStyles = { msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitScrollbarDisplay: 'none' };

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            {/* --- CABECERA Y SELECTORES --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FDFBF7] p-5 rounded-[2rem] border border-[#DFD2C4]/50 shadow-sm relative z-10">
                <div>
                    <h2 className="text-2xl font-black text-[#312923] tracking-tight">Periodontograma Clínico</h2>
                    <p className="text-[10px] text-[#9A8F84] uppercase tracking-widest font-bold mt-1">Control de Tejidos Blandos</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-[#DFD2C4]/60 shadow-sm">
                        {['adulto', 'pediatrico', 'mixto'].map((type) => (
                            <button key={type} onClick={() => setPerioDentition(type)} className={`flex-1 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${perioDentition === type ? 'bg-[#FDFBF7] text-[#312923] border border-[#DFD2C4] shadow-sm' : 'text-[#9A8F84] hover:text-[#312923]'}`}>{type}</button>
                        ))}
                    </div>
                    <button onClick={savePerioSnapshot} className="px-6 py-3.5 bg-[#5B6651] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-[#5B6651]/20 flex items-center gap-2 hover:-translate-y-0.5 transition-all">
                        <Save size={16}/> Guardar Ficha
                    </button>
                </div>
            </div>

            {/* --- TARJETAS DE ESTADÍSTICAS --- */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-red-50 border-red-200 text-center py-6 shadow-sm">
                    <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Índice Sangrado (BOP)</p>
                    <h2 className="text-5xl font-black text-red-600">{getPerioStats().bop}%</h2>
                    <p className="text-[10px] text-red-400 font-bold mt-2 uppercase tracking-widest">Global</p>
                </Card>
                <Card className="bg-amber-50 border-amber-200 text-center py-6 shadow-sm">
                    <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Índice de Higiene</p>
                    <h2 className="text-5xl font-black text-amber-500">{getPerioStats().plaque}%</h2>
                    <p className="text-[10px] text-amber-400 font-bold mt-2 uppercase tracking-widest">O'Leary</p>
                </Card>
            </div>

            {/* --- PERIODONTOGRAMA (SONDAJE) --- */}
            <Card className="w-full flex flex-col gap-10 overflow-x-auto p-4 md:p-8 bg-white border-[#DFD2C4]/40 shadow-sm relative no-scrollbar" style={hideScrollStyles}>
                <div className="flex flex-col gap-8 w-max mx-auto">
                    
                    {/* SUPERIOR */}
                    <div className="flex flex-col gap-6 w-full">
                        {(perioDentition === 'adulto' || perioDentition === 'mixto') && (
                            <div className="space-y-4 w-full">
                                <div className="flex items-center gap-2 w-full">
                                    <span className="w-16 shrink-0 text-[9px] font-black text-[#DFD2C4] uppercase text-right tracking-widest">Vestibular</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_UPPER, 'v')}</div>
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <span className="w-16 shrink-0 text-[9px] font-black text-[#DFD2C4] uppercase text-right tracking-widest">Palatino</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_UPPER, 'l')}</div>
                                </div>
                            </div>
                        )}
                        {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && (
                            <div className="space-y-4 bg-[#CBAAA2]/5 p-4 rounded-[2rem] border border-[#CBAAA2]/20 shadow-inner w-full">
                                <div className="flex items-center gap-2 w-full">
                                    <span className="w-16 shrink-0 text-[9px] font-black text-[#CBAAA2] uppercase text-right tracking-widest">Vestibular</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_UPPER_PED, 'v')}</div>
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <span className="w-16 shrink-0 text-[9px] font-black text-[#CBAAA2] uppercase text-right tracking-widest">Palatino</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_UPPER_PED, 'l')}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#DFD2C4] to-transparent"></div>

                    {/* INFERIOR */}
                    <div className="flex flex-col gap-6 w-full">
                        {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && (
                            <div className="space-y-4 bg-[#CBAAA2]/5 p-4 rounded-[2rem] border border-[#CBAAA2]/20 shadow-inner w-full">
                                <div className="flex items-center gap-2 w-full">
                                    <span className="w-16 shrink-0 text-[9px] font-black text-[#CBAAA2] uppercase text-right tracking-widest">Vestibular</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_LOWER_PED, 'v')}</div>
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <span className="w-16 shrink-0 text-[9px] font-black text-[#CBAAA2] uppercase text-right tracking-widest">Lingual</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_LOWER_PED, 'l')}</div>
                                </div>
                            </div>
                        )}
                        {(perioDentition === 'adulto' || perioDentition === 'mixto') && (
                            <div className="space-y-4 w-full">
                                <div className="flex items-center gap-2 w-full">
                                    <span className="w-16 shrink-0 text-[9px] font-black text-[#DFD2C4] uppercase text-right tracking-widest">Vestibular</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_LOWER, 'v')}</div>
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <span className="w-16 shrink-0 text-[9px] font-black text-[#DFD2C4] uppercase text-right tracking-widest">Lingual</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_LOWER, 'l')}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* --- ÍNDICE DE O'LEARY --- */}
            <Card className="p-4 md:p-8 bg-white border-[#DFD2C4]/40 shadow-sm relative no-scrollbar overflow-x-auto" style={hideScrollStyles}>
                <div className="flex justify-between items-end border-b border-[#DFD2C4]/50 pb-4 sticky left-0 min-w-[300px]">
                    <div>
                        <h3 className="font-black text-2xl text-[#312923] tracking-tight">Índice de Placa (O'Leary)</h3>
                        <p className="text-[10px] text-[#9A8F84] font-bold uppercase tracking-widest mt-1">Control de Higiene</p>
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest bg-[#FDFBF7] px-5 py-2.5 rounded-xl border border-[#DFD2C4]/50 shadow-sm">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-md animate-pulse shadow-sm"/> Placa</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-[#DFD2C4] rounded-md"/> Limpio</span>
                    </div>
                </div>

                <div className="flex flex-col gap-8 w-max mx-auto mt-8">
                    <div className="w-full bg-[#FDFBF7] p-6 rounded-[2rem] border border-[#DFD2C4]/50 shadow-inner flex flex-col items-center">
                        <span className="block text-[10px] font-black text-[#9A8F84] uppercase tracking-widest mb-4">Maxilar Superior</span>
                        <div className="w-full flex flex-col items-center">
                            {(perioDentition === 'adulto' || perioDentition === 'mixto') && <div className="flex justify-center w-full">{renderHygieneRow(TEETH_UPPER)}</div>}
                            {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && <div className="mt-4 flex justify-center w-full">{renderHygieneRow(TEETH_UPPER_PED)}</div>}
                        </div>
                    </div>
                    <div className="w-full bg-[#FDFBF7] p-6 rounded-[2rem] border border-[#DFD2C4]/50 shadow-inner flex flex-col items-center">
                        <span className="block text-[10px] font-black text-[#9A8F84] uppercase tracking-widest mb-4">Maxilar Inferior</span>
                        <div className="w-full flex flex-col items-center">
                            {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && <div className="mb-4 flex justify-center w-full">{renderHygieneRow(TEETH_LOWER_PED)}</div>}
                            {(perioDentition === 'adulto' || perioDentition === 'mixto') && <div className="flex justify-center w-full">{renderHygieneRow(TEETH_LOWER)}</div>}
                        </div>
                    </div>
                </div>
            </Card>

            {/* --- HISTORIAL PERIO --- */}
            <div className="pt-4">
                <div className="flex items-center gap-3 mb-6 border-b border-[#DFD2C4]/50 pb-4">
                    <History className="text-[#9A8F84]" size={20}/>
                    <div>
                        <h3 className="font-black text-xl text-[#312923] tracking-tight">Historial Clínico Perio</h3>
                        <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">Evoluciones Guardadas</p>
                    </div>
                </div>
                
                {(!p.clinical.perioHistory || p.clinical.perioHistory.length === 0) ? (
                    <div className="text-center py-12 bg-[#FDFBF7] border-2 border-dashed border-[#DFD2C4] rounded-3xl">
                        <p className="text-sm font-bold text-[#9A8F84]">No hay evoluciones guardadas aún</p>
                        <p className="text-[10px] font-black text-[#DFD2C4] uppercase tracking-widest mt-1">Llena el periodontograma y guarda arriba.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...p.clinical.perioHistory].reverse().map((snap, idx, arr) => (
                            <div key={snap.id} className="bg-white p-5 rounded-3xl border border-[#DFD2C4]/60 flex flex-col gap-4 hover:border-[#5B6651] hover:shadow-md transition-all cursor-pointer group">
                                <div className="flex justify-between items-start border-b border-[#DFD2C4]/40 pb-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-[#5B6651] tracking-widest">Evolución #{arr.length - idx}</span>
                                        <span className="text-[11px] font-bold text-[#312923] mt-1">{snap.date}</span>
                                    </div>
                                    <button onClick={() => restoreSnapshot(snap)} className="px-3 py-1.5 bg-[#FDFBF7] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-[#DFD2C4] hover:bg-[#5B6651] hover:text-white text-[10px] font-black uppercase text-[#6B615A] shadow-sm">
                                        Restaurar
                                    </button>
                                </div>
                                <div className="flex justify-between items-center bg-[#FDFBF7] p-3 rounded-2xl border border-[#DFD2C4]/30">
                                    <div className="flex flex-col items-center flex-1 border-r border-[#DFD2C4]">
                                        <span className="text-[9px] uppercase tracking-widest text-[#9A8F84] font-black mb-1">BOP</span>
                                        <span className="text-sm font-black text-red-500">{snap.stats?.bop || 0}%</span>
                                    </div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[9px] uppercase tracking-widest text-[#9A8F84] font-black mb-1">O'Leary</span>
                                        <span className="text-sm font-black text-amber-500">{snap.stats?.plaque || 0}%</span>
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