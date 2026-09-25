import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Card } from './UIComponents';
import { HygieneCell } from './ToothSystem';
import { TEETH_UPPER, TEETH_LOWER, TEETH_UPPER_PED, TEETH_LOWER_PED } from '../constants';
import { Save, History, Download, Loader2 } from 'lucide-react';
import { generatePerioPDF } from './perioPdfExport';
import { PerioArchGrid } from './PerioChart';

// ============================================================================
// ORDEN DE FILAS POR TABLA (tomado directo de las capturas de referencia,
// quitando "Pronóstico individual" y "Anchura de encía" — sin campo de datos
// por ahora, layout visual solamente).
// ============================================================================
// SUPERIOR: tabla de arriba = Vestibular (completa), tabla de abajo = Palatino (simple)
const SUPERIOR_TOP = ['implante', 'movilidad', 'furca', 'sangrado', 'supuracion', 'mg', 'pd'];
const SUPERIOR_BOTTOM = ['pd', 'mg', 'sangrado', 'supuracion', 'furca', 'nota'];
// INFERIOR: tabla de arriba = Lingual (simple), tabla de abajo = Vestibular (completa)
const INFERIOR_TOP = ['nota', 'furca', 'sangrado', 'supuracion', 'mg', 'pd'];
const INFERIOR_BOTTOM = ['pd', 'mg', 'sangrado', 'supuracion', 'furca', 'movilidad', 'implante'];

export default function PerioTab({
    config, logAction, session, notify,
    themeMode, getPatient, selectedPatientId, savePatientData,
    savePerioSnapshot, getPerioStats, setToothModalData, setPerioData, setModal, restoreSnapshot
}) {
    const [perioDentition, setPerioDentition] = useState('adulto');
    const [exportando, setExportando] = useState(false);
    const p = getPatient(selectedPatientId);

    // Un ref por arcada posible. Solo se llenan los que están montados según
    // perioDentition — html2canvas captura exactamente lo que el dentista ve
    // en pantalla en ese momento, incluida la etiqueta "Superior"/"Inferior".
    const archRefs = useRef({});

    const capturarArcadas = async () => {
        // Si html2canvas mide el texto antes de que la fuente web termine de
        // cargar, usa las métricas de una fuente de reemplazo. En filas de
        // 17px de alto, cualquier diferencia de un par de píxeles alcanza
        // para recortar el número — esto es lo que se veía cortado.
        if (document.fonts?.ready) {
            try { await document.fonts.ready; } catch { /* noop */ }
        }

        const claves = [
            ['superior', TEETH_UPPER],
            ['superiorPed', TEETH_UPPER_PED],
            ['inferiorPed', TEETH_LOWER_PED],
            ['inferior', TEETH_LOWER],
        ];
        const capturas = [];
        for (const [key] of claves) {
            const el = archRefs.current[key];
            if (!el) continue; // no montado con la denticion actual
            // scale 2.5: suficiente nitidez para imprimir sin generar un PNG
            // gigante. backgroundColor explicito porque el fondo real es
            // transparente y sin esto sale negro en el PDF.
            const canvas = await html2canvas(el, {
                scale: 2.5,
                backgroundColor: '#FFFFFF',
                useCORS: true,
                onclone: (_doc, clonedEl) => {
                    // Afecta solo a esta copia descartable, nunca a la ficha
                    // real: se le da a cada celda un poco más de alto y de
                    // interlineado, porque html2canvas calcula el suyo propio
                    // y las filas de 17px no dejan margen de error.
                    clonedEl.querySelectorAll('td').forEach((td) => {
                        td.style.height = 'auto';
                        td.style.minHeight = '20px';
                        td.style.lineHeight = '1.6';
                        td.style.paddingTop = '1px';
                        td.style.paddingBottom = '1px';
                    });
                },
            });
            capturas.push({ dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height });
        }
        return capturas;
    };

    const handleDescargarPDF = async () => {
        if (exportando) return;
        setExportando(true);
        try {
            const capturas = await capturarArcadas();
            await generatePerioPDF({
                patient: p,
                stats: getPerioStats(),
                perioDentition,
                capturas,
                config, session, logAction, notify,
                teethUpper: TEETH_UPPER, teethLower: TEETH_LOWER,
                teethUpperPed: TEETH_UPPER_PED, teethLowerPed: TEETH_LOWER_PED,
            });
        } catch (e) {
            console.error('[perio-pdf]', e);
            notify?.('No se pudo generar el PDF del periodontograma.');
        } finally {
            setExportando(false);
        }
    };

    const openToothModal = (n) => {
        const existingPerio = p.clinical.perio?.[n] || {};
        setToothModalData({
            id: n, mode: 'perio', ...p.clinical.teeth[n],
            faces: p.clinical.teeth[n]?.faces || { v: null, l: null, m: null, d: null, o: null },
            treatment: p.clinical.teeth[n]?.treatment || { name: '', status: 'planned' },
            perio: existingPerio
        });
        setPerioData(existingPerio);
        setModal('tooth');
    };

    const renderHygieneRow = (teethArray) => (
        <div className="flex gap-1.5 lg:gap-2 justify-center w-full" style={{ flexWrap: 'nowrap' }}>
            {teethArray.map(t => {
                const st = p.clinical.teeth[t]?.status;
                const isMissing = Array.isArray(st) ? st.includes('missing') : st === 'missing';
                if (isMissing) return null;
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FBFAF8] p-5 rounded-[2rem] border border-[#D9D2C7]/50 shadow-sm relative z-10">
                <div>
                    <h2 className="text-2xl font-black text-[#241F1B] tracking-tight">Periodontograma Clínico</h2>
                    <p className="text-[11px] text-[#5E554E] uppercase tracking-widest font-bold mt-1">Control de Tejidos Blandos</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-[#D9D2C7]/60 shadow-sm">
                        {['adulto', 'pediatrico', 'mixto'].map((type) => (
                            <button key={type} onClick={() => setPerioDentition(type)} className={`flex-1 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${perioDentition === type ? 'bg-[#FBFAF8] text-[#241F1B] border border-[#D9D2C7] shadow-sm' : 'text-[#5E554E] hover:text-[#241F1B]'}`}>{type}</button>
                        ))}
                    </div>
                    <button onClick={savePerioSnapshot} className="px-6 py-3.5 bg-[#46523C] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-[#46523C]/20 flex items-center gap-2 hover:-translate-y-0.5 transition-all">
                        <Save size={16} /> Guardar Ficha
                    </button>
                    <button
                        onClick={handleDescargarPDF}
                        disabled={exportando}
                        className="px-6 py-3.5 bg-white text-[#241F1B] font-black text-[11px] uppercase tracking-widest rounded-2xl border border-[#D9D2C7] shadow-sm flex items-center gap-2 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:pointer-events-none"
                    >
                        {exportando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {exportando ? 'Generando…' : 'Descargar PDF'}
                    </button>
                </div>
            </div>

            {/* --- TARJETAS DE ESTADÍSTICAS --- */}
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
                            <p className={`${bopColor.title} font-black text-[11px] uppercase tracking-[0.2em] mb-2`}>Sangrado (BOP)</p>
                            <h2 className={`text-5xl font-black ${bopColor.value}`}>{bop}%</h2>
                            <p className={`text-[11px] ${bopColor.sub} font-bold mt-2 uppercase tracking-widest`}>{bopColor.label}</p>
                        </Card>
                        <Card className="bg-amber-50 border-amber-200 text-center py-6 shadow-sm">
                            <p className="text-amber-600 font-black text-[11px] uppercase tracking-[0.2em] mb-2">Índice de Higiene</p>
                            <h2 className="text-5xl font-black text-amber-500">{stats.plaque}%</h2>
                            <p className="text-[11px] text-amber-400 font-bold mt-2 uppercase tracking-widest">O'Leary</p>
                        </Card>
                        <Card className="bg-[#FBFAF8] border-[#D9D2C7]/60 text-center py-6 shadow-sm">
                            <p className="text-[#5E554E] font-black text-[11px] uppercase tracking-[0.2em] mb-2">NIC Promedio</p>
                            <h2 className="text-5xl font-black text-[#46523C]">{stats.nic}<span className="text-2xl font-bold text-[#8A7F74] ml-1">mm</span></h2>
                            <p className="text-[11px] text-[#8A7F74] font-bold mt-2 uppercase tracking-widest">Inserción Clínica</p>
                        </Card>
                    </div>
                );
            })()}

            {/* --- PERIODONTOGRAMA (ESTILO SEPA: TABLAS POR SITIO + DIENTES) --- */}
            <Card className="w-full flex flex-col gap-6 overflow-x-auto p-4 md:p-6 bg-white border-[#D9D2C7]/40 shadow-sm relative no-scrollbar" style={hideScrollStyles}>
                <div className="flex flex-col gap-6 w-full">
                    {(perioDentition === 'adulto' || perioDentition === 'mixto') && (
                        <div ref={(el) => (archRefs.current.superior = el)}>
                            <p className="text-center text-[11px] font-black text-[#46523C] uppercase tracking-[0.2em] mb-3">Superior</p>
                            <PerioArchGrid
                                teeth={TEETH_UPPER} patient={p} onToothClick={openToothModal} savePatientData={savePatientData} selectedPatientId={selectedPatientId}
                                topFace="v" topRows={SUPERIOR_TOP} topLabel="Vestibular"
                                bottomFace="l" bottomRows={SUPERIOR_BOTTOM} bottomLabel="Palatino"
                            />
                        </div>
                    )}
                    {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && (
                        <div ref={(el) => (archRefs.current.superiorPed = el)} className="bg-[#D3A9A0]/5 p-6 rounded-[2rem] border border-[#D3A9A0]/20 shadow-inner">
                            <p className="text-center text-[11px] font-black text-[#D3A9A0] uppercase tracking-[0.2em] mb-3">Superior (temporal)</p>
                            <PerioArchGrid
                                teeth={TEETH_UPPER_PED} patient={p} onToothClick={openToothModal} savePatientData={savePatientData} selectedPatientId={selectedPatientId}
                                topFace="v" topRows={SUPERIOR_TOP} topLabel="Vestibular"
                                bottomFace="l" bottomRows={SUPERIOR_BOTTOM} bottomLabel="Palatino"
                            />
                        </div>
                    )}

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D9D2C7] to-transparent" />

                    {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && (
                        <div ref={(el) => (archRefs.current.inferiorPed = el)} className="bg-[#D3A9A0]/5 p-6 rounded-[2rem] border border-[#D3A9A0]/20 shadow-inner">
                            <p className="text-center text-[11px] font-black text-[#D3A9A0] uppercase tracking-[0.2em] mb-3">Inferior (temporal)</p>
                            <PerioArchGrid
                                teeth={TEETH_LOWER_PED} patient={p} onToothClick={openToothModal} savePatientData={savePatientData} selectedPatientId={selectedPatientId}
                                topFace="l" topRows={INFERIOR_TOP} topLabel="Lingual"
                                bottomFace="v" bottomRows={INFERIOR_BOTTOM} bottomLabel="Vestibular"
                            />
                        </div>
                    )}
                    {(perioDentition === 'adulto' || perioDentition === 'mixto') && (
                        <div ref={(el) => (archRefs.current.inferior = el)}>
                            <p className="text-center text-[11px] font-black text-[#46523C] uppercase tracking-[0.2em] mb-3">Inferior</p>
                            <PerioArchGrid
                                teeth={TEETH_LOWER} patient={p} onToothClick={openToothModal} savePatientData={savePatientData} selectedPatientId={selectedPatientId}
                                topFace="l" topRows={INFERIOR_TOP} topLabel="Lingual"
                                bottomFace="v" bottomRows={INFERIOR_BOTTOM} bottomLabel="Vestibular"
                            />
                        </div>
                    )}
                </div>
            </Card>

            {/* --- ÍNDICE DE O'LEARY --- */}
            <Card className="p-4 md:p-8 bg-white border-[#D9D2C7]/40 shadow-sm relative no-scrollbar overflow-x-auto" style={hideScrollStyles}>
                <div className="flex justify-between items-end border-b border-[#D9D2C7]/50 pb-4 sticky left-0 min-w-[300px]">
                    <div>
                        <h3 className="font-black text-2xl text-[#241F1B] tracking-tight">Índice de Placa (O'Leary)</h3>
                        <p className="text-[11px] text-[#5E554E] font-bold uppercase tracking-widest mt-1">Control de Higiene</p>
                    </div>
                    <div className="flex gap-4 text-[11px] font-bold uppercase tracking-widest bg-[#FBFAF8] px-5 py-2.5 rounded-xl border border-[#D9D2C7]/50 shadow-sm">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-md animate-pulse shadow-sm" /> Placa</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-[#D9D2C7] rounded-md" /> Limpio</span>
                    </div>
                </div>

                <div className="flex flex-col gap-8 w-max mx-auto mt-8">
                    <div className="w-full bg-[#FBFAF8] p-6 rounded-[2rem] border border-[#D9D2C7]/50 shadow-inner flex flex-col items-center">
                        <span className="block text-[11px] font-black text-[#5E554E] uppercase tracking-widest mb-4">Maxilar Superior</span>
                        <div className="w-full flex flex-col items-center">
                            {(perioDentition === 'adulto' || perioDentition === 'mixto') && <div className="flex justify-center w-full">{renderHygieneRow(TEETH_UPPER)}</div>}
                            {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && <div className="mt-4 flex justify-center w-full">{renderHygieneRow(TEETH_UPPER_PED)}</div>}
                        </div>
                    </div>
                    <div className="w-full bg-[#FBFAF8] p-6 rounded-[2rem] border border-[#D9D2C7]/50 shadow-inner flex flex-col items-center">
                        <span className="block text-[11px] font-black text-[#5E554E] uppercase tracking-widest mb-4">Maxilar Inferior</span>
                        <div className="w-full flex flex-col items-center">
                            {(perioDentition === 'pediatrico' || perioDentition === 'mixto') && <div className="mb-4 flex justify-center w-full">{renderHygieneRow(TEETH_LOWER_PED)}</div>}
                            {(perioDentition === 'adulto' || perioDentition === 'mixto') && <div className="flex justify-center w-full">{renderHygieneRow(TEETH_LOWER)}</div>}
                        </div>
                    </div>
                </div>
            </Card>

            {/* --- HISTORIAL PERIO --- */}
            <div className="pt-4">
                <div className="flex items-center gap-3 mb-6 border-b border-[#D9D2C7]/50 pb-4">
                    <History className="text-[#5E554E]" size={20} />
                    <div>
                        <h3 className="font-black text-xl text-[#241F1B] tracking-tight">Historial Clínico Perio</h3>
                        <p className="text-[11px] font-bold text-[#5E554E] uppercase tracking-widest">Evoluciones Guardadas</p>
                    </div>
                </div>

                {(!p.clinical?.perioHistory || p.clinical.perioHistory.length === 0) ? (
                    <div className="text-center py-12 bg-[#FBFAF8] rounded-[2rem] border border-[#D9D2C7]/40">
                        <p className="text-[#5E554E] font-bold text-xs uppercase tracking-widest">No hay registros históricos previos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {p.clinical.perioHistory.map((snap, idx) => (
                            <Card key={idx} className="p-5 hover:border-[#46523C] transition-all cursor-pointer group" onClick={() => restoreSnapshot(snap)}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-[#FBFAF8] rounded-lg flex items-center justify-center border border-[#D9D2C7]/50 text-[#46523C]">
                                            <History size={16} />
                                        </div>
                                        <span className="text-[11px] font-black text-[#241F1B] uppercase tracking-widest">{snap.date}</span>
                                    </div>
                                    <span className="text-[11px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded-md border border-green-100">BOP: {snap.stats?.bop}%</span>
                                </div>
                                <p className="text-[11px] text-[#5E554E] line-clamp-2 italic">"{snap.notes || 'Sin observaciones adicionales'}"</p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
