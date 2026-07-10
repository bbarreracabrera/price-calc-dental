import React, { useState } from 'react';
import { Card } from './UIComponents';
import { Tooth, HygieneCell } from './ToothSystem';
import { TEETH_UPPER, TEETH_LOWER, TEETH_UPPER_PED, TEETH_LOWER_PED } from '../constants';
import { Save, History } from 'lucide-react';

export default function PerioTab({
    themeMode, getPatient, selectedPatientId, savePatientData,
    savePerioSnapshot, getPerioStats, setToothModalData, setPerioData, setModal
}) {
    const [perioDentition, setPerioDentition] = useState('adulto');
    const p = getPatient(selectedPatientId);

    // --- MOTOR DE TRAZADO CONTINUO ---
    const renderArcade = (teethArray, face) => {
        const widthPerTooth = 45;
        const totalWidth = teethArray.length * widthPerTooth;

        // Generar puntos para las líneas continuas
        const pointsMG = [];
        const pointsPD = [];

        teethArray.forEach((n, i) => {
            const data = p.clinical.perio?.[n] || {};
            const mg = data[`mg_${face}`] || [0, 0, 0];
            const pd = data[`pd_${face}`] || [0, 0, 0];
            
            // 3 puntos por diente (Distal, Centro, Mesial)
            // Calculamos Y: Base 35px + valor * factor
            [0, 1, 2].forEach(idx => {
                const x = (i * widthPerTooth) + (idx * (widthPerTooth / 2));
                const yMG = 35 + (parseFloat(mg[idx]) || 0) * 5;
                const yPD = yMG + (parseFloat(pd[idx]) || 0) * 5;
                pointsMG.push(`${x},${yMG}`);
                pointsPD.push(`${x},${yPD}`);
            });
        });

        const pathMG = `M ${pointsMG.join(' L ')}`;
        const pathPD = `M ${pointsPD.join(' L ')}`;
        const pathFill = `M ${pointsMG[0]} L ${pointsMG.join(' L ')} L ${pointsPD.reverse().join(' L ')} Z`;

        return (
            <div className="relative" style={{ width: totalWidth }}>
                {/* Capa de Dientes (Continuos) */}
                <div className="flex">
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
                                    perio: existingPerio
                                }); 
                                setPerioData(existingPerio); 
                                setModal('tooth'); 
                            }}
                        />
                    ))}
                </div>

                {/* Capa de Líneas (SVG Superpuesto) */}
                <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: totalWidth, height: '100%' }}>
                    {/* Rejilla de milimetraje */}
                    {[35, 45, 55, 65, 75, 85].map(y => (
                        <line key={y} x1="0" y1={y} x2={totalWidth} y2={y} stroke="#DFD2C4" strokeWidth="0.5" strokeDasharray="2" />
                    ))}
                    
                    {/* Relleno de bolsa */}
                    <path d={pathFill} fill="#ef4444" fillOpacity="0.15" />
                    {/* Margen Gingival (Azul) */}
                    <path d={pathMG} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Profundidad de Sondaje (Roja) */}
                    <path d={pathPD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* Etiquetas de Pieza */}
                <div className="flex border-t border-[#DFD2C4] mt-2">
                    {teethArray.map(n => (
                        <div key={`label-${n}`} className="w-[45px] text-center text-[9px] font-black py-1 bg-[#FDFBF7] border-x border-[#DFD2C4]/30">{n}</div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            <div className="flex justify-between items-center bg-[#FDFBF7] p-5 rounded-[2rem] border border-[#DFD2C4]/50 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-[#312923]">Periodontograma Profesional</h2>
                    <p className="text-[10px] text-[#9A8F84] uppercase font-bold">Arcada Continua Anatómica</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={savePerioSnapshot} className="px-6 py-3 bg-[#5B6651] text-white font-black text-[11px] uppercase rounded-2xl flex items-center gap-2">
                        <Save size={16}/> Guardar Estado
                    </button>
                </div>
            </div>

            <Card className="p-8 bg-white border-[#DFD2C4]/40 shadow-sm overflow-x-auto no-scrollbar">
                <div className="flex flex-col gap-12 min-w-max mx-auto">
                    {/* MAXILAR SUPERIOR */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <span className="w-20 text-[10px] font-black text-[#9A8F84] uppercase text-right">Vestibular</span>
                            {renderArcade(TEETH_UPPER, 'v')}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="w-20 text-[10px] font-black text-[#9A8F84] uppercase text-right">Palatino</span>
                            {renderArcade(TEETH_UPPER, 'l')}
                        </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-[#DFD2C4] to-transparent" />

                    {/* MAXILAR INFERIOR */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <span className="w-20 text-[10px] font-black text-[#9A8F84] uppercase text-right">Vestibular</span>
                            {renderArcade(TEETH_LOWER, 'v')}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="w-20 text-[10px] font-black text-[#9A8F84] uppercase text-right">Lingual</span>
                            {renderArcade(TEETH_LOWER, 'l')}
                        </div>
                    </div>
                </div>
            </Card>

            {/* O'LEARY */}
            <Card className="p-8 bg-white border-[#DFD2C4]/40 shadow-sm overflow-x-auto no-scrollbar">
                <h3 className="font-black text-xl mb-6">Índice de Placa (O'Leary)</h3>
                <div className="flex flex-col gap-8 min-w-max mx-auto">
                    <div className="flex justify-center gap-0.5">
                        {TEETH_UPPER.map(t => <HygieneCell key={t} tooth={t} data={p.clinical.hygiene?.[t]} onChange={(face) => {
                            const current = p.clinical.hygiene?.[t] || {};
                            const newData = { ...p.clinical.hygiene, [t]: { ...current, [face]: !current[face] } };
                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, hygiene: newData } });
                        }} />)}
                    </div>
                    <div className="flex justify-center gap-0.5">
                        {TEETH_LOWER.map(t => <HygieneCell key={t} tooth={t} data={p.clinical.hygiene?.[t]} onChange={(face) => {
                            const current = p.clinical.hygiene?.[t] || {};
                            const newData = { ...p.clinical.hygiene, [t]: { ...current, [face]: !current[face] } };
                            savePatientData(selectedPatientId, { ...p, clinical: { ...p.clinical, hygiene: newData } });
                        }} />)}
                    </div>
                </div>
            </Card>
        </div>
    );
}
