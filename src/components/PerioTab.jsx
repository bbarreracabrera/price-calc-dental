import React from 'react';
import { Card } from './UIComponents';
import { Tooth, HygieneCell } from './ToothSystem';
import { TEETH_UPPER, TEETH_LOWER } from '../constants';

export default function PerioTab({
    themeMode, t, getPatient, selectedPatientId, savePatientData,
    savePerioSnapshot, getPerioStats, setToothModalData, setPerioData, setModal, restoreSnapshot
}) {
    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                <div>
                    <h2 className="text-xl font-black text-cyan-500">Periodontograma Clínico</h2>
                    <p className="text-[10px] opacity-50 uppercase tracking-widest font-bold">Modo Evolutivo Integrado</p>
                </div>
                <button onClick={savePerioSnapshot} className="mt-3 md:mt-0 px-5 py-2.5 bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2">
                    <span className="text-sm">💾</span> Guardar Evolución
                </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <Card theme={themeMode} className="bg-red-500/10 border-red-500/20 text-center">
                    <p className="text-red-500 font-bold text-xs uppercase">Índice Sangrado (BOP)</p>
                    <h2 className="text-4xl font-black text-red-500">{getPerioStats().bop}%</h2>
                    <p className="text-[10px] opacity-50">Calculado sobre 6 puntos</p>
                </Card>
                <Card theme={themeMode} className="bg-yellow-500/10 border-yellow-500/20 text-center">
                    <p className="text-yellow-500 font-bold text-xs uppercase">Índice de Higiene</p>
                    <h2 className="text-4xl font-black text-yellow-500">{getPerioStats().plaque}%</h2>
                    <p className="text-[10px] opacity-50">O'Leary (4 caras)</p>
                </Card>
            </div>

            <Card theme={themeMode} className="flex flex-col gap-6 overflow-x-auto p-4 md:p-6 custom-scrollbar">
                {/* Superior */}
                <div className="flex items-stretch relative">
                    <div className="flex items-center justify-center border-r border-white/10 pr-2 mr-2 md:pr-4 md:mr-4">
                        <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-cyan-500 opacity-80" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Superior</span>
                    </div>
                    <div className="flex flex-col gap-4 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="w-14 text-[8px] md:text-[9px] font-black opacity-40 uppercase text-right tracking-widest">Vestibular</span>
                            <div className="flex gap-1 flex-nowrap md:flex-wrap">
                                {TEETH_UPPER.map(n => {
                                    const p = getPatient(selectedPatientId);
                                    return <Tooth key={`v-${n}`} number={n} isPerioMode={true} perioFace="v" perioData={p.clinical.perio?.[n]} status={p.clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = p.clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {}, mg: existing.mg || {}, bop: existing.bop || {}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-14 text-[8px] md:text-[9px] font-black opacity-40 uppercase text-right tracking-widest">Palatino</span>
                            <div className="flex gap-1 flex-nowrap md:flex-wrap">
                                {TEETH_UPPER.map(n => {
                                    const p = getPatient(selectedPatientId);
                                    return <Tooth key={`p-${n}`} number={n} isPerioMode={true} perioFace="l" perioData={p.clinical.perio?.[n]} status={p.clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = p.clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {}, mg: existing.mg || {}, bop: existing.bop || {}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-white/5 my-2"></div>

                {/* Inferior */}
                <div className="flex items-stretch relative">
                    <div className="flex items-center justify-center border-r border-white/10 pr-2 mr-2 md:pr-4 md:mr-4">
                        <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-cyan-500 opacity-80" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Inferior</span>
                    </div>
                    <div className="flex flex-col gap-4 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="w-14 text-[8px] md:text-[9px] font-black opacity-40 uppercase text-right tracking-widest">Vestibular</span>
                            <div className="flex gap-1 flex-nowrap md:flex-wrap">
                                {TEETH_LOWER.map(n => {
                                    const p = getPatient(selectedPatientId);
                                    return <Tooth key={`v-${n}`} number={n} isPerioMode={true} perioFace="v" perioData={p.clinical.perio?.[n]} status={p.clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = p.clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {}, mg: existing.mg || {}, bop: existing.bop || {}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-14 text-[8px] md:text-[9px] font-black opacity-40 uppercase text-right tracking-widest">Lingual</span>
                            <div className="flex gap-1 flex-nowrap md:flex-wrap">
                                {TEETH_LOWER.map(n => {
                                    const p = getPatient(selectedPatientId);
                                    return <Tooth key={`l-${n}`} number={n} isPerioMode={true} perioFace="l" perioData={p.clinical.perio?.[n]} status={p.clinical.teeth[n]?.status} onClick={()=>{setToothModalData({id:n}); const existing = p.clinical.perio?.[n] || {}; setPerioData({ pd: existing.pd || {}, mg: existing.mg || {}, bop: existing.bop || {}, pus: existing.pus || false, mobility: existing.mobility || 0, furcation: existing.furcation || 0 }); setModal('perio');}} theme={themeMode}/>
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card theme={themeMode} className="space-y-6 p-4 md:p-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <div>
                        <h3 className="font-black text-lg text-cyan-500">Índice de Placa (O'Leary)</h3>
                        <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">Control de Higiene</p>
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full border border-white/5">
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"/> Placa</span>
                        <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-white/10 border border-white/20 rounded-full"/> Limpio</span>
                    </div>
                </div>

                <div className="flex flex-col gap-6 items-center">
                    <div className="w-full bg-black/5 p-4 rounded-3xl border border-white/5">
                        <span className="block text-[9px] font-black opacity-30 uppercase tracking-widest mb-2 text-center">Maxilar Superior</span>
                        <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
                            {TEETH_UPPER.map(t => { 
                                const p = getPatient(selectedPatientId); 
                                // SOLUCIÓN: Verifica tanto string como array
                                const st = p.clinical.teeth[t]?.status;
                                const isMissing = Array.isArray(st) ? st.includes('missing') : st === 'missing';
                                
                                if(isMissing) return null; 
                                return ( 
                                    <HygieneCell 
                                        key={t} tooth={t} data={p.clinical.hygiene?.[t]} 
                                        onChange={(face) => { 
                                            const current = p.clinical.hygiene?.[t] || {}; 
                                            const newData = { ...p.clinical.hygiene, [t]: { ...current, [face]: !current[face] } }; 
                                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, hygiene: newData } }); 
                                        }} 
                                    /> 
                                ); 
                            })}
                        </div>
                    </div>

                    <div className="w-full bg-black/5 p-4 rounded-3xl border border-white/5">
                        <span className="block text-[9px] font-black opacity-30 uppercase tracking-widest mb-2 text-center">Maxilar Inferior</span>
                        <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
                            {TEETH_LOWER.map(t => { 
                                const p = getPatient(selectedPatientId); 
                                // SOLUCIÓN: Verifica tanto string como array
                                const st = p.clinical.teeth[t]?.status;
                                const isMissing = Array.isArray(st) ? st.includes('missing') : st === 'missing';
                                
                                if(isMissing) return null; 
                                return ( 
                                    <HygieneCell 
                                        key={t} tooth={t} data={p.clinical.hygiene?.[t]} 
                                        onChange={(face) => { 
                                            const current = p.clinical.hygiene?.[t] || {}; 
                                            const newData = { ...p.clinical.hygiene, [t]: { ...current, [face]: !current[face] } }; 
                                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, hygiene: newData } }); 
                                        }} 
                                    /> 
                                ); 
                            })}
                        </div>
                    </div>
                </div>
            </Card>

            <Card theme={themeMode} className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <h3 className="font-bold text-cyan-500">Historial Clínico de Evoluciones</h3>
                    <span className="text-[10px] uppercase tracking-widest opacity-50 font-black">Snapshots</span>
                </div>
                
                {(!getPatient(selectedPatientId).clinical.perioHistory || getPatient(selectedPatientId).clinical.perioHistory.length === 0) ? (
                    <div className="text-center py-8 bg-black/10 rounded-2xl border border-white/5 border-dashed">
                        <p className="text-xs opacity-50 font-bold uppercase tracking-widest">No hay evoluciones guardadas aún</p>
                        <p className="text-[10px] opacity-30 mt-1">Llena el periodontograma y haz clic en "Guardar Evolución" arriba.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...getPatient(selectedPatientId).clinical.perioHistory].reverse().map((snap, idx, arr) => (
                            <div key={snap.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col gap-3 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Evolución #{arr.length - idx}</span>
                                        <span className="text-[9px] font-bold opacity-50 mt-0.5">{snap.date}</span>
                                    </div>
                                    <button onClick={() => restoreSnapshot(snap)} className="p-1.5 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 hover:bg-cyan-500/20 text-[10px] font-black uppercase text-cyan-500">
                                        Ver Detalle
                                    </button>
                                </div>
                                <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg">
                                    <div className="flex flex-col items-center flex-1 border-r border-white/5">
                                        <span className="text-[8px] uppercase tracking-widest opacity-50 font-black mb-1">BOP</span>
                                        <span className="text-[11px] font-black text-red-400">{snap.stats?.bop || 0}%</span>
                                    </div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[8px] uppercase tracking-widest opacity-50 font-black mb-1">Higiene</span>
                                        <span className="text-[11px] font-black text-yellow-400">{snap.stats?.plaque || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}