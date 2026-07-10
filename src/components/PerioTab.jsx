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

    // --- MOTOR DE TRAZADO CONTINUO (PRESERVA TODA LA LÓGICA) ---
    const renderPerioRow = (teethArray, face) => {
        const widthPerTooth = 45; // Ancho fijo para alineación perfecta
        const totalWidth = teethArray.length * widthPerTooth;

        // Generar puntos para las líneas continuas
        const pointsMG = [];
        const pointsPD = [];

        teethArray.forEach((n, i) => {
            const data = p.clinical.perio?.[n] || {};
            const mg = data[`mg_${face}`] || [0, 0, 0];
            const pd = data[`pd_${face}`] || [0, 0, 0];
            
            // 3 puntos por diente (Distal, Centro, Mesial)
            // Y: Base 35px + valor * factor (5.5 para visibilidad)
            [0, 1, 2].forEach(idx => {
                const x = (i * widthPerTooth) + (idx * (widthPerTooth / 2));
                const yMG = 35 + (parseFloat(mg[idx]) || 0) * 5.5;
                const yPD = yMG + (parseFloat(pd[idx]) || 0) * 5.5;
                pointsMG.push(`${x},${yMG}`);
                pointsPD.push(`${x},${yPD}`);
            });
        });

        const pathMG = `M ${pointsMG.join(' L ')}`;
        const pathPD = `M ${pointsPD.join(' L ')}`;
        const pathFill = `M ${pointsMG[0]} L ${pointsMG.join(' L ')} L ${[...pointsPD].reverse().join(' L ')} Z`;

        return (
            <div className="relative" style={{ width: totalWidth }}>
                {/* Capa de Dientes (Sin Gaps) */}
                <div className="flex gap-0">
                    {teethArray.map(n => (
                        <Tooth 
                            key={`${face}-${n}`} 
                            number={n} 
                            isPerioMode={true} 
                            perioFace={face} 
                            perioData={p.clinical.perio?.[n]} 
                            status={p.clinical.teeth[n]?.status} 
                            onClick={() => {
                                const existingPerio = p.clinical.perio?.[n] || {}; 
                                setToothModalData({
                                    id: n, mode: 'perio', ...p.clinical.teeth[n],
                                    faces: p.clinical.teeth[n]?.faces || { v: null, l: null, m: null, d: null, o: null },
                                    treatment: p.clinical.teeth[n]?.treatment || { name: '', status: 'planned' },
                                    perio: existingPerio
                                }); 
                                setPerioData(existingPerio); 
                                setModal('tooth'); 
                            }}
                            theme={themeMode}
                        />
                    ))}
                </div>

                {/* Capa de Líneas (SVG Superpuesto) */}
                <svg className="absolute inset-0 pointer-events-none overflow-visible z-20" style={{ width: totalWidth, height: '100%' }}>
                    {/* Rejilla de milimetraje profesional */}
                    {[35, 46, 57, 68, 79, 90].map(y => (
                        <line key={y} x1="0" y1={y} x2={totalWidth} y2={y} stroke="#DFD2C4" strokeWidth="0.5" strokeDasharray="2" opacity="0.5" />
                    ))}
                    
                    {/* Relleno de bolsa */}
                    <path d={pathFill} fill="#ef4444" fillOpacity="0.15" />
                    {/* Margen Gingival (Azul) */}
                    <path d={pathMG} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Profundidad de Sondaje (Roja) */}
                    <path d={pathPD} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        );
    };

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
            {/* --- CABECERA Y SELECTORES (RESTAURADO) --- */}
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

            {/* --- TARJETAS DE ESTADÍSTICAS (RESTAURADO) --- */}
            {(() => {
                const stats = getPerioStats();
                const bop = stats.bop;
                const bopColor = bop < 10
                    ? { card: 'bg-green-50 border-green-200', title: 'text-green-600', value: 'text-green-700', sub: 'text-green-500', label: 'Riesgo Bajo' }
                    : bop <= 25
                    ? { card: 'bg-amber-50 border-amber-200', title: 'text-amber-600', value: 'text-amber-500', sub: 'text-amber-400', label: 'Riesgo Moderado' }
                    : { card: 'bg-red-50 border-red-200', title: 'text-red-500', value: 'text-red-600', sub: 'text-red-400', label: 'Riesgo Alto' };
                return (
                    <div className="grid grid-cols-3 gap-4">
                        <Card className={`${bopColor.card} text-center py-6 shadow-sm`}>
                            <p className={`${bopColor.title} font-black text-[10px] uppercase tracking-[0.2em] mb-2`}>Sangrado (BOP)</p>
                            <h2 className={`text-5xl font-black ${bopColor.value}`}>{bop}%</h2>
                            <p className={`text-[10px] ${bopColor.sub} font-bold mt-2 uppercase tracking-widest`}>{bopColor.label}</p>
                        </Card>
                        <Card className="bg-amber-50 border-amber-200 text-center py-6 shadow-sm">
                            <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Índice de Higiene</p>
                            <h2 className="text-5xl font-black text-amber-500">{stats.plaque}%</h2>
                            <p className="text-[10px] text-amber-400 font-bold mt-2 uppercase tracking-widest">O'Leary</p>
                        </Card>
                        <Card className="bg-[#FDFBF7] border-[#DFD2C4]/60 text-center py-6 shadow-sm">
                            <p className="text-[#9A8F84] font-black text-[10px] uppercase tracking-[0.2em] mb-2">NIC Promedio</p>
                            <h2 className="text-5xl font-black text-[#5B6651]">{stats.nic}<span className="text-2xl font-bold text-[#A3968B] ml-1">mm</span></h2>
                            <p className="text-[10px] text-[#A3968B] font-bold mt-2 uppercase tracking-widest">Inserción Clínica</p>
                        </Card>
                    </div>
                );
            })()}

            {/* --- PERIODONTOGRAMA (SONDAJE CONTINUO) --- */}
            <Card className="w-full flex flex-col gap-10 overflow-x-auto p-4 md:p-8 bg-white border-[#DFD2C4]/40 shadow-sm relative no-scrollbar" style={hideScrollStyles}>
                <div className="flex flex-col gap-12 min-w-max mx-auto">
                    
                    {/* SUPERIOR */}
                    <div className="flex flex-col gap-10 w-full">
                        {(perioDentition === 'adulto' || perioDentition === 'mixto') && (
                            <div className="space-y-6 w-full">
                                <div className="flex items-center gap-4 w-full">
                                    <span className="w-20 shrink-0 text-[10px] font-black text-[#9A8F84] uppercase text-right tracking-widest">Vestibular</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_UPPER, 'v')}</div>
                                </div>
                                <div className="flex items-center gap-4 w-full">
                                    <span className="w-20 shrink-0 text-[10px] font-black text-[#9A8F84] uppercase text-right tracking-widest">Palatino</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_UPPER, 'l')}</div>
                                </div>
                            </div>
                        )}
                        {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && (
                            <div className="space-y-6 bg-[#CBAAA2]/5 p-6 rounded-[2rem] border border-[#CBAAA2]/20 shadow-inner w-full">
                                <div className="flex items-center gap-4 w-full">
                                    <span className="w-20 shrink-0 text-[10px] font-black text-[#CBAAA2] uppercase text-right tracking-widest">Vestibular</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_UPPER_PED, 'v')}</div>
                                </div>
                                <div className="flex items-center gap-4 w-full">
                                    <span className="w-20 shrink-0 text-[10px] font-black text-[#CBAAA2] uppercase text-right tracking-widest">Palatino</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_UPPER_PED, 'l')}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#DFD2C4] to-transparent"></div>

                    {/* INFERIOR */}
                    <div className="flex flex-col gap-10 w-full">
                        {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && (
                            <div className="space-y-6 bg-[#CBAAA2]/5 p-6 rounded-[2rem] border border-[#CBAAA2]/20 shadow-inner w-full">
                                <div className="flex items-center gap-4 w-full">
                                    <span className="w-20 shrink-0 text-[10px] font-black text-[#CBAAA2] uppercase text-right tracking-widest">Vestibular</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_LOWER_PED, 'v')}</div>
                                </div>
                                <div className="flex items-center gap-4 w-full">
                                    <span className="w-20 shrink-0 text-[10px] font-black text-[#CBAAA2] uppercase text-right tracking-widest">Lingual</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_LOWER_PED, 'l')}</div>
                                </div>
                            </div>
                        )}
                        {(perioDentition === 'adulto' || perioDentition === 'mixto') && (
                            <div className="space-y-6 w-full">
                                <div className="flex items-center gap-4 w-full">
                                    <span className="w-20 shrink-0 text-[10px] font-black text-[#9A8F84] uppercase text-right tracking-widest">Vestibular</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_LOWER, 'v')}</div>
                                </div>
                                <div className="flex items-center gap-4 w-full">
                                    <span className="w-20 shrink-0 text-[10px] font-black text-[#9A8F84] uppercase text-right tracking-widest">Lingual</span>
                                    <div className="flex-1">{renderPerioRow(TEETH_LOWER, 'l')}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* --- ÍNDICE DE O'LEARY (RESTAURADO) --- */}
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

            {/* --- HISTORIAL PERIO (RESTAURADO) --- */}
            <div className="pt-4">
                <div className="flex items-center gap-3 mb-6 border-b border-[#DFD2C4]/50 pb-4">
                    <History className="text-[#9A8F84]" size={20}/>
                    <div>
                        <h3 className="font-black text-xl text-[#312923] tracking-tight">Historial Clínico Perio</h3>
                        <p className="text-[10px] font-bold text-[#9A8F84] uppercase tracking-widest">Evoluciones Guardadas</p>
                    </div>
                </div>
                
                {(!p.clinical?.perioHistory || p.clinical.perioHistory.length === 0) ? (
                    <div className="text-center py-12 bg-[#FDFBF7] rounded-[2rem] border border-[#DFD2C4]/40">
                        <p className="text-[#9A8F84] font-bold text-xs uppercase tracking-widest">No hay registros históricos previos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {p.clinical.perioHistory.map((snap, idx) => (
                            <Card key={idx} className="p-5 hover:border-[#5B6651] transition-all cursor-pointer group" onClick={() => restoreSnapshot(snap)}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-[#FDFBF7] rounded-lg flex items-center justify-center border border-[#DFD2C4]/50 text-[#5B6651]">
                                            <History size={16}/>
                                        </div>
                                        <span className="text-[10px] font-black text-[#312923] uppercase tracking-widest">{new Date(snap.date).toLocaleDateString()}</span>
                                    </div>
                                    <span className="text-[9px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded-md border border-green-100">BOP: {snap.stats?.bop}%</span>
                                </div>
                                <p className="text-[11px] text-[#9A8F84] line-clamp-2 italic">"{snap.notes || 'Sin observaciones adicionales'}"</p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
