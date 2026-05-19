import React, { useState, useMemo } from 'react';
import { Save, Printer, AlertCircle } from 'lucide-react';
import { CARIOGRAM_FACTORS, calculateCariogram, RISK_LABELS, getCariogramRecommendations } from '../../utils/cariogramScoring';

export default function CariogramCalculator({ mode = 'public', patientData, onSave, onClose }) {
    const [values, setValues] = useState(() => {
        const init = {};
        CARIOGRAM_FACTORS.forEach(f => { init[f.key] = patientData?.[f.key] ?? 1; });
        return init;
    });

    const result          = useMemo(() => calculateCariogram(values), [values]);
    const riskInfo        = RISK_LABELS[result.riskLevel];
    const recommendations = useMemo(() => getCariogramRecommendations(values, result, mode), [values, result, mode]);

    const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
        if (mode !== 'public') return true;
        try { return sessionStorage.getItem('cariogram_disclaimer_accepted') === 'true'; } catch { return false; }
    });

    const updateFactor = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

    const handleSave = () => {
        if (onSave) onSave({ date: new Date().toISOString(), inputs: { ...values }, computed: { ...result } });
    };

    const handlePrint = () => window.print();

    return (
        <div className="print-area bg-white rounded-3xl border border-[#DFD2C4] p-6 md:p-8">
            {/* Modal de disclaimer — solo en modo público */}
            {mode === 'public' && !disclaimerAccepted && (
                <div className="fixed inset-0 bg-[#312923]/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#B92323]/10 flex items-center justify-center shrink-0">
                                <AlertCircle size={24} className="text-[#B92323]" />
                            </div>
                            <h2 className="text-xl font-black text-[#312923]">Información importante</h2>
                        </div>
                        <p className="text-sm text-[#312923] mb-3 leading-relaxed">
                            Esta es una <strong>herramienta orientativa</strong> de evaluación del riesgo
                            de caries basada en el modelo Cariogram de Bratthall (Universidad de Malmö).
                        </p>
                        <p className="text-sm text-[#312923] mb-3 leading-relaxed">
                            Los resultados <strong>no constituyen un diagnóstico médico</strong> ni reemplazan
                            la evaluación de un odontólogo. Las recomendaciones preventivas requieren
                            consulta profesional.
                        </p>
                        <p className="text-sm text-[#9A8F84] mb-6 leading-relaxed">
                            Al continuar, aceptas usar esta herramienta solo con fines educativos e informativos.
                        </p>
                        <button
                            onClick={() => {
                                setDisclaimerAccepted(true);
                                try { sessionStorage.setItem('cariogram_disclaimer_accepted', 'true'); } catch {}
                            }}
                            className="w-full py-3 bg-[#312923] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity"
                        >
                            Entiendo y continúo
                        </button>
                    </div>
                </div>
            )}
            {/* Header de impresión (solo visible al imprimir) */}
            {patientData?.legalName && (
                <div className="hidden print:block mb-6 pb-4 border-b border-[#DFD2C4]">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] font-bold">Paciente</p>
                            <p className="text-lg font-black text-[#312923]">{patientData.legalName}</p>
                            {patientData.rut && <p className="text-sm text-[#9A8F84]">RUT: {patientData.rut}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] font-bold">Fecha</p>
                            <p className="text-sm text-[#312923]">{new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-black text-[#312923] mb-1">
                Cariogram — Evaluación de riesgo de caries
            </h2>
            <p className="text-sm text-[#9A8F84] mb-6">
                Modelo multifactorial (Bratthall, Universidad de Malmö)
            </p>

            <div className="grid md:grid-cols-2 gap-8 items-start">

                {/* Pie chart + leyenda + resultado */}
                <div className="flex flex-col items-center gap-4">
                    <PieChart result={result} />

                    <div className="w-full grid grid-cols-1 gap-1.5">
                        <LegendItem color="#5B6651" label="Oportunidad de evitar caries" value={result.chance} />
                        <LegendItem color="#9B7E7A" label="Bacterias"                    value={result.bacteria} />
                        <LegendItem color="#D9A86C" label="Dieta"                        value={result.diet} />
                        <LegendItem color="#A3968B" label="Susceptibilidad"              value={result.susceptibility} />
                        <LegendItem color="#7A8B7F" label="Circunstancias"               value={result.circumstances} />
                    </div>

                    <div className="w-full bg-[#FDFBF7] rounded-2xl p-4 border border-[#DFD2C4] text-center">
                        <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] mb-2 font-bold">
                            Clasificación
                        </p>
                        <div
                            className="inline-block px-4 py-2 rounded-full text-sm font-black mb-2"
                            style={{ backgroundColor: `${riskInfo.color}20`, color: riskInfo.color }}
                        >
                            {riskInfo.label}
                        </div>
                        <p className="text-xs text-[#312923] font-bold">{riskInfo.recommendation}</p>
                    </div>

                </div>

                {/* 10 factores */}
                <div className="space-y-2">
                    {CARIOGRAM_FACTORS.map(factor => (
                        <FactorRow
                            key={factor.key}
                            factor={factor}
                            value={values[factor.key]}
                            onChange={v => updateFactor(factor.key, v)}
                        />
                    ))}
                </div>
            </div>

            {/* Recomendaciones — ancho completo */}
            {recommendations.length > 0 && (
                <div className="mt-6 space-y-4">
                    {mode === 'public' && (
                        <div className="w-full bg-[#FFF8F8] border-l-4 border-[#B92323] rounded-r-2xl p-3">
                            <p className="text-xs font-bold text-[#B92323] mb-1">Aviso importante</p>
                            <p className="text-xs text-[#312923] leading-relaxed">
                                Las recomendaciones son orientativas. Algunas intervenciones terapéuticas
                                deben ser evaluadas y prescritas por un profesional de la salud dental.
                                No reemplaza la consulta clínica.
                            </p>
                        </div>
                    )}
                    <div className="w-full bg-white border border-[#DFD2C4] rounded-2xl p-4">
                        <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] mb-3 font-bold">
                            Recomendaciones clínicas
                        </p>
                        <div className="space-y-2.5">
                            {recommendations.map((rec, i) => {
                                const color = { critical: '#B92323', high: '#D9A86C', medium: '#5B6651', low: '#9A8F84' }[rec.priority];
                                return (
                                    <div key={i} className="border-l-4 pl-3 py-0.5" style={{ borderLeftColor: color }}>
                                        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color }}>{rec.category}</p>
                                        <p className="text-xs text-[#312923] leading-relaxed">{rec.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col md:flex-row gap-3 mt-6 pt-6 border-t border-[#DFD2C4] no-print">
                {mode === 'private' && onSave && (
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-[#312923] text-white font-bold rounded-2xl hover:opacity-90 flex items-center justify-center gap-2 text-sm"
                    >
                        <Save size={16} /> Guardar en ficha
                    </button>
                )}
                <button
                    onClick={handlePrint}
                    className="flex-1 py-3 border-2 border-[#312923] text-[#312923] font-bold rounded-2xl hover:bg-[#312923] hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Printer size={16} /> Imprimir / PDF
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-[#DFD2C4] text-[#312923] font-bold rounded-2xl hover:bg-[#FDFBF7] text-sm"
                    >
                        Cerrar
                    </button>
                )}
            </div>

            <div className="mt-5 bg-[#FDFBF7] border-l-4 border-[#A3968B] rounded-r-2xl p-3">
                <p className="text-xs text-[#9A8F84]">
                    <strong>Nota:</strong> Esta calculadora implementa el modelo Cariogram según la
                    literatura validada (Bratthall 2005). Es una herramienta orientativa que debe
                    complementarse con el juicio clínico del profesional, no reemplazarlo.
                </p>
            </div>
        </div>
    );
}

// ---- sub-componentes ----

function PieChart({ result }) {
    const CX = 150, CY = 150, R = 110;
    const sectors = [
        { value: result.chance,         color: '#5B6651', label: 'Oportunidad', emphasized: true },
        { value: result.bacteria,       color: '#9B7E7A', label: 'Bacterias' },
        { value: result.diet,           color: '#D9A86C', label: 'Dieta' },
        { value: result.susceptibility, color: '#A3968B', label: 'Susceptibilidad' },
        { value: result.circumstances,  color: '#7A8B7F', label: 'Circunstancias' },
    ];

    let cumulative = 0;
    const total = sectors.reduce((s, sec) => s + sec.value, 0) || 1;

    return (
        <svg viewBox="0 0 300 300" style={{ width: '100%', maxWidth: 320 }} aria-label="Cariogram — sectores de riesgo">
            {sectors.map((s, i) => {
                if (s.value === 0) return null;
                const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
                cumulative += s.value;
                const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;

                const x1 = CX + R * Math.cos(startAngle);
                const y1 = CY + R * Math.sin(startAngle);
                const x2 = CX + R * Math.cos(endAngle);
                const y2 = CY + R * Math.sin(endAngle);
                const largeArc = (s.value / total) > 0.5 ? 1 : 0;

                return (
                    <path
                        key={i}
                        d={`M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={s.color}
                        stroke="#FDFBF7"
                        strokeWidth={s.emphasized ? "4" : "2"}
                    />
                );
            })}

            {/* Círculo central */}
            <circle cx={CX} cy={CY} r="58" fill="#FDFBF7" stroke="#DFD2C4" strokeWidth="2" />
            <text x={CX} y={CY - 10} textAnchor="middle" fontSize="34" fontWeight="900" fill="#5B6651">
                {result.chance}%
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" fontSize="9" fill="#9A8F84" fontWeight="600" letterSpacing="1.5">
                OPORTUNIDAD
            </text>
        </svg>
    );
}

function LegendItem({ color, label, value }) {
    return (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#FDFBF7] rounded-xl">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-[#312923]">{label}</span>
            </div>
            <span className="text-xs font-bold text-[#312923]">{value}%</span>
        </div>
    );
}

function FactorRow({ factor, value, onChange }) {
    return (
        <div className="bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl p-3">
            <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#312923] leading-tight">
                        {factor.label}
                    </p>
                    <p className="text-[10px] text-[#9A8F84] mt-0.5 leading-snug">
                        {factor.description}
                    </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => onChange(Math.max(0, value - 1))}
                        disabled={value <= 0}
                        className="w-7 h-7 rounded-lg bg-white border border-[#DFD2C4] text-[#312923] font-bold text-sm disabled:opacity-30 hover:bg-[#DFD2C4]/40 transition-colors"
                    >
                        −
                    </button>
                    <span className="w-8 text-center font-black text-[#312923] text-sm">{value}</span>
                    <button
                        onClick={() => onChange(Math.min(factor.max, value + 1))}
                        disabled={value >= factor.max}
                        className="w-7 h-7 rounded-lg bg-white border border-[#DFD2C4] text-[#312923] font-bold text-sm disabled:opacity-30 hover:bg-[#DFD2C4]/40 transition-colors"
                    >
                        +
                    </button>
                </div>
            </div>
            <p className="text-[10px] text-[#5B6651] font-bold">
                {factor.options.find(o => o.value === value)?.label}
            </p>
        </div>
    );
}
