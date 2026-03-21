import React from 'react';
import { Card } from './UIComponents';
import { Tooth } from './ToothSystem';
import { TEETH_UPPER, TEETH_LOWER, TEETH_UPPER_PED, TEETH_LOWER_PED } from '../constants';

export default function OdontogramTab({
    themeMode, t, odontogramMode, setOdontogramMode, odontogramType, setOdontogramType,
    getPatient, selectedPatientId, setToothModalData, setModal, userRole, catalog,
    setQuoteItems, notify, setActiveTab, sessionData, setSessionData
}) {
    return (
        <Card theme={themeMode} className="flex flex-col items-center gap-8 animate-in fade-in">
            <div className="flex bg-white/5 p-1 rounded-xl w-full max-w-md mx-auto mb-2">
                <button onClick={()=>setOdontogramMode('hallazgos')} className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all ${odontogramMode==='hallazgos'?t.accentBg:'opacity-50'}`}>🔍 Hallazgos (Diagnóstico)</button>
                <button onClick={()=>setOdontogramMode('tratamientos')} className={`flex-1 p-2 rounded-lg text-xs font-bold transition-all ${odontogramMode==='tratamientos'?'bg-emerald-500 text-white':'opacity-50'}`}>🛠️ Plan de Tratamiento</button>
            </div>

            {/* SELECTOR DE DENTICIÓN */}
            <div className="flex justify-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5 w-fit mx-auto mb-4">
                <button onClick={() => setOdontogramType('adulto')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${odontogramType === 'adulto' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Adulto</button>
                <button onClick={() => setOdontogramType('pediatrico')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${odontogramType === 'pediatrico' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Pediátrico</button>
                <button onClick={() => setOdontogramType('mixto')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${odontogramType === 'mixto' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Mixto</button>
            </div>
            
            {/* ÁREA DE DIBUJO DE DIENTES */}
            <div className="flex flex-col items-center gap-4">
                {/* Superior Adulto */}
                {(odontogramType === 'adulto' || odontogramType === 'mixto') && (
                    <div className="flex gap-2 flex-wrap justify-center">
                        {TEETH_UPPER.map(n=><Tooth key={n} number={n} mode={odontogramMode} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} data={getPatient(selectedPatientId).clinical.teeth[n]} onClick={()=>{setToothModalData({id:n, mode: odontogramMode, ...getPatient(selectedPatientId).clinical.teeth[n], faces: getPatient(selectedPatientId).clinical.teeth[n]?.faces || {v:null, l:null, m:null, d:null, o:null}, treatment: getPatient(selectedPatientId).clinical.teeth[n]?.treatment || {name:'', status:'planned'}}); setModal('tooth');}} theme={themeMode}/>)}
                    </div>
                )}
                {/* Superior Pediátrico */}
                {(odontogramType === 'pediatrico' || odontogramType === 'mixto') && (
                    <div className="flex gap-2 flex-wrap justify-center bg-amber-500/5 p-2 rounded-xl border border-amber-500/20">
                        {TEETH_UPPER_PED.map(n=><Tooth key={n} number={n} mode={odontogramMode} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} data={getPatient(selectedPatientId).clinical.teeth[n]} onClick={()=>{setToothModalData({id:n, mode: odontogramMode, ...getPatient(selectedPatientId).clinical.teeth[n], faces: getPatient(selectedPatientId).clinical.teeth[n]?.faces || {v:null, l:null, m:null, d:null, o:null}, treatment: getPatient(selectedPatientId).clinical.teeth[n]?.treatment || {name:'', status:'planned'}}); setModal('tooth');}} theme={themeMode}/>)}
                    </div>
                )}
                <div className="w-full h-px bg-white/10 my-2"></div>
                {/* Inferior Pediátrico */}
                {(odontogramType === 'pediatrico' || odontogramType === 'mixto') && (
                    <div className="flex gap-2 flex-wrap justify-center bg-amber-500/5 p-2 rounded-xl border border-amber-500/20">
                        {TEETH_LOWER_PED.map(n=><Tooth key={n} number={n} mode={odontogramMode} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} data={getPatient(selectedPatientId).clinical.teeth[n]} onClick={()=>{setToothModalData({id:n, mode: odontogramMode, ...getPatient(selectedPatientId).clinical.teeth[n], faces: getPatient(selectedPatientId).clinical.teeth[n]?.faces || {v:null, l:null, m:null, d:null, o:null}, treatment: getPatient(selectedPatientId).clinical.teeth[n]?.treatment || {name:'', status:'planned'}}); setModal('tooth');}} theme={themeMode}/>)}
                    </div>
                )}
                {/* Inferior Adulto */}
                {(odontogramType === 'adulto' || odontogramType === 'mixto') && (
                    <div className="flex gap-2 flex-wrap justify-center">
                        {TEETH_LOWER.map(n=><Tooth key={n} number={n} mode={odontogramMode} status={getPatient(selectedPatientId).clinical.teeth[n]?.status} data={getPatient(selectedPatientId).clinical.teeth[n]} onClick={()=>{setToothModalData({id:n, mode: odontogramMode, ...getPatient(selectedPatientId).clinical.teeth[n], faces: getPatient(selectedPatientId).clinical.teeth[n]?.faces || {v:null, l:null, m:null, d:null, o:null}, treatment: getPatient(selectedPatientId).clinical.teeth[n]?.treatment || {name:'', status:'planned'}}); setModal('tooth');}} theme={themeMode}/>)}
                    </div>
                )}
            </div>

            {/* --- LISTA DE RESUMEN Y ATAJO AL COTIZADOR --- */}
            <div className="w-full mt-6 space-y-4">
                <h3 className="font-bold border-b border-white/10 pb-3 flex justify-between items-center">
                    <span>📋 Resumen del Odontograma</span>
                    {(userRole === 'admin' || userRole === 'dentist') && (
                        <button onClick={() => {
                            const pData = getPatient(selectedPatientId);
                            const teeth = pData.clinical?.teeth || {};
                            const newQuoteItems = [];
                            
                            [...TEETH_UPPER, ...TEETH_LOWER, ...TEETH_UPPER_PED, ...TEETH_LOWER_PED].forEach(n => {
                                const tData = teeth[n];
                                if (tData && tData.treatment && tData.treatment.name && tData.treatment.status !== 'completed') {
                                    const catalogItem = catalog.find(c => c.name === tData.treatment.name);
                                    newQuoteItems.push({
                                        id: Date.now() + Math.random(),
                                        name: tData.treatment.name,
                                        tooth: n.toString(),
                                        price: catalogItem ? Number(catalogItem.price) : 0
                                    });
                                }
                            });

                            if (newQuoteItems.length > 0) {
                                setQuoteItems(newQuoteItems);
                                notify(`¡Magia! Se importaron ${newQuoteItems.length} tratamientos al cotizador.`);
                            }

                            setActiveTab('quote');
                            setSessionData({...sessionData, patientName: pData.personal?.legalName || pData.name, patientId: selectedPatientId});
                        }} className="text-[10px] bg-emerald-500 text-white px-4 py-2 rounded-xl uppercase tracking-widest font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
                            Generar Presupuesto 💰
                        </button>
                    )}
                </h3>
                
                <div className="max-h-64 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {[...TEETH_UPPER, ...TEETH_LOWER, ...TEETH_UPPER_PED, ...TEETH_LOWER_PED].map(n => {
                        const toothData = getPatient(selectedPatientId).clinical.teeth[n];
                        if (!toothData) return null;
                        
                        const hasFaces = toothData.faces && Object.values(toothData.faces).some(v => v);
                        const hasNotes = toothData.notes && toothData.notes.trim() !== '';
                        const hasTreatment = toothData.treatment && toothData.treatment.name;
                        
                        if (toothData.status || hasFaces || hasNotes || hasTreatment) {
                            return (
                                <div key={n} onClick={()=>{setToothModalData({id:n, mode: odontogramMode, ...toothData, faces: toothData.faces || {v:null, l:null, m:null, d:null, o:null}, treatment: toothData.treatment || {name:'', status:'planned'}}); setModal('tooth');}} className="flex flex-col md:flex-row gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className={`w-10 h-10 shrink-0 rounded-full bg-black/40 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform ${n > 50 ? 'text-amber-400' : 'text-cyan-400'}`}>{n}</div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <span className="font-bold text-stone-400 uppercase text-[9px] block mb-0.5">Diagnóstico</span>
                                            <span className="font-bold">{toothData.status === 'missing' ? 'Ausente' : toothData.status === 'caries' ? 'Caries' : toothData.status === 'filled' ? 'Restauración' : toothData.status === 'crown' ? 'Corona' : 'Sano'}</span>
                                            {hasFaces && <span className="ml-1 opacity-70">({Object.entries(toothData.faces).filter(([k,v])=>v).map(([k,v])=>k.toUpperCase()).join(', ')})</span>}
                                        </div>
                                        <div>
                                            <span className="font-bold text-stone-400 uppercase text-[9px] block mb-0.5">Observaciones</span>
                                            <span className="opacity-80">{toothData.notes || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-stone-400 uppercase text-[9px] block mb-0.5">Tratamiento Planificado</span>
                                            {hasTreatment ? (
                                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${toothData.treatment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {toothData.treatment.name} {toothData.treatment.status === 'completed' ? '(Listo)' : '(Por Hacer)'}
                                                </span>
                                            ) : <span className="opacity-50">-</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                    
                    {![...TEETH_UPPER, ...TEETH_LOWER, ...TEETH_UPPER_PED, ...TEETH_LOWER_PED].some(n => {
                        const d = getPatient(selectedPatientId).clinical.teeth[n];
                        return d && (d.status || (d.faces && Object.values(d.faces).some(v=>v)) || d.notes || d.treatment?.name);
                    }) && (
                        <div className="text-center py-8 opacity-40 border border-dashed border-white/10 rounded-xl">
                            <p>No hay hallazgos registrados aún.</p>
                            <p className="text-[10px]">Haz clic en un diente para comenzar.</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}