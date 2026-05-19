import React, { useState, useMemo } from 'react';
import { Save, Printer } from 'lucide-react';
import {
    scoreBOP, scorePPD, scoreDP, scoreBL,
    calculateBopPct, calculateBlRatio,
    classifyRisk, RISK_LABELS,
} from '../../utils/praScoring';

export default function PRACalculator({ mode = 'public', patientData, onSave, onClose }) {
    const [edad,           setEdad]           = useState(patientData?.age          || 62);
    const [numTeeth,       setNumTeeth]       = useState(patientData?.teethCount   || 16);
    const [sitesPerTooth,  setSitesPerTooth]  = useState(6);
    const [bopPositive,    setBopPositive]    = useState(patientData?.bopPositive  || 33);
    const [ppdSites,       setPpdSites]       = useState(patientData?.ppdSites     || 0);
    const [teethLost,      setTeethLost]      = useState(patientData?.teethLost    || 14);
    const [bonelossPercent,setBonelossPercent]= useState(patientData?.boneloss     || 34);
    const [sistemico,      setSistemico]      = useState(patientData?.sistemico    || 1);
    const [tabaquismo,     setTabaquismo]     = useState(patientData?.tabaquismo   || 1);
    const [dataColor,      setDataColor]      = useState(() => {
        try { return localStorage.getItem('pra_chart_color') || '#5B6651'; } catch { return '#5B6651'; }
    });

    const computed = useMemo(() => {
        const totalSites = numTeeth * sitesPerTooth;
        const bopPct     = calculateBopPct(bopPositive, totalSites);
        const blRatio    = calculateBlRatio(bonelossPercent, edad);
        const scores     = [
            scoreBOP(bopPct),
            scorePPD(ppdSites),
            scoreDP(teethLost),
            scoreBL(bonelossPercent, edad),
            sistemico,
            tabaquismo,
        ];
        const risk     = classifyRisk(scores);
        const riskInfo = RISK_LABELS[risk];
        return { totalSites, bopPct, blRatio, scores, risk, riskInfo };
    }, [edad, numTeeth, sitesPerTooth, bopPositive, ppdSites, teethLost, bonelossPercent, sistemico, tabaquismo]);

    const handleSave = () => {
        if (!onSave) return;
        onSave({
            date: new Date().toISOString(),
            inputs: { edad, numTeeth, sitesPerTooth, bopPositive, ppdSites, teethLost, bonelossPercent, sistemico, tabaquismo },
            computed: { bopPct: computed.bopPct, blRatio: computed.blRatio, scores: computed.scores, risk: computed.risk },
        });
    };

    const handlePrint = () => window.print();

    return (
        <div className="print-area bg-white rounded-3xl border border-[#DFD2C4] p-6 md:p-8">
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
                Evaluación de Riesgo Periodontal (PRA)
            </h2>
            <p className="text-sm text-[#9A8F84] mb-6">Diagrama funcional de Lang &amp; Tonetti</p>

            <div className="grid md:grid-cols-2 gap-8 items-start">

                {/* Hexágono + resultado */}
                <div className="flex flex-col items-center gap-4">
                    <HexagonChart scores={computed.scores} dataColor={dataColor} />

                    {/* Selector de color */}
                    <div className="no-print flex items-center gap-2 flex-wrap justify-center">
                        <span className="text-[10px] uppercase tracking-widest text-[#9A8F84] font-bold">Color:</span>
                        {COLOR_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setDataColor(opt.value);
                                    try { localStorage.setItem('pra_chart_color', opt.value); } catch (e) { console.warn('localStorage unavailable', e); }
                                }}
                                className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${
                                    dataColor === opt.value ? 'ring-2 ring-offset-2 ring-[#312923] scale-110' : ''
                                }`}
                                style={{ backgroundColor: opt.value }}
                                title={opt.label}
                                aria-label={`Color ${opt.label}`}
                            />
                        ))}
                    </div>

                    <div className="w-full bg-[#FDFBF7] rounded-2xl p-4 border border-[#DFD2C4] text-center">
                        <p className="text-[10px] uppercase tracking-widest text-[#9A8F84] mb-2 font-bold">
                            Clasificación de riesgo
                        </p>
                        <div
                            className="inline-block px-4 py-2 rounded-full text-sm font-black mb-2"
                            style={{
                                backgroundColor: `${computed.riskInfo.color}20`,
                                color: computed.riskInfo.color,
                            }}
                        >
                            {computed.riskInfo.label}
                        </div>
                        <p className="text-xs text-[#312923] font-bold">{computed.riskInfo.interval}</p>
                    </div>

                    {/* Score breakdown */}
                    <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                            { key: 'BOP%',      val: `${computed.bopPct.toFixed(0)}%`, score: computed.scores[0] },
                            { key: 'PPD≥5mm',   val: ppdSites,                          score: computed.scores[1] },
                            { key: 'D. perd.',  val: teethLost,                          score: computed.scores[2] },
                            { key: 'BL/Edad',   val: computed.blRatio.toFixed(2),       score: computed.scores[3] },
                            { key: 'Sistémico', val: ['–','Ninguno','1 menor','DM ctrl','DM noctr'][sistemico], score: computed.scores[4] },
                            { key: 'Tabaq.',    val: ['–','No/Ex>5a','Ex<5a','10-19','≥20'][tabaquismo],       score: computed.scores[5] },
                        ].map(({ key, val, score }) => (
                            <div
                                key={key}
                                className="flex flex-col items-center p-2 rounded-xl border text-center"
                                style={{
                                    borderColor: scoreBadgeColor(score) + '40',
                                    backgroundColor: scoreBadgeColor(score) + '10',
                                }}
                            >
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#9A8F84]">{key}</span>
                                <span className="text-xs font-bold text-[#312923] mt-0.5">{val}</span>
                                <span
                                    className="text-[9px] font-black mt-0.5"
                                    style={{ color: scoreBadgeColor(score) }}
                                >
                                    Z{score}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Formulario */}
                <div className="space-y-4">
                    <Field label="Edad del paciente (años)">
                        <input
                            type="number" value={edad} min="1" max="120"
                            onChange={e => setEdad(parseInt(e.target.value) || 0)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Dientes e implantes presentes" hint="(1-32)">
                        <input
                            type="number" value={numTeeth} min="1" max="32"
                            onChange={e => setNumTeeth(parseInt(e.target.value) || 0)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Sitios por diente">
                        <RadioGroup
                            name="spp" value={sitesPerTooth} onChange={setSitesPerTooth}
                            options={[{ value: 2, label: '2' }, { value: 4, label: '4' }, { value: 6, label: '6' }]}
                        />
                    </Field>

                    <Field label="Sitios con sangrado al sondaje" hint={`/ ${computed.totalSites} totales`}>
                        <div className="flex items-center gap-3">
                            <input
                                type="number" value={bopPositive} min="0"
                                onChange={e => setBopPositive(parseInt(e.target.value) || 0)}
                                className={inputCls}
                            />
                            <span className="text-sm font-bold text-[#5B6651]">
                                BOP = {computed.bopPct.toFixed(0)}%
                            </span>
                        </div>
                    </Field>

                    <Field label="Sitios con PPD ≥ 5 mm">
                        <input
                            type="number" value={ppdSites} min="0"
                            onChange={e => setPpdSites(parseInt(e.target.value) || 0)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Dientes perdidos" hint="(de 28, excl. 3°M)">
                        <input
                            type="number" value={teethLost} min="0" max="28"
                            onChange={e => setTeethLost(parseInt(e.target.value) || 0)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Pérdida ósea alveolar (%)">
                        <div className="flex items-center gap-3">
                            <input
                                type="number" value={bonelossPercent} min="0" max="100"
                                onChange={e => setBonelossPercent(parseFloat(e.target.value) || 0)}
                                className={inputCls}
                            />
                            <span className="text-sm font-bold text-[#5B6651]">
                                BL/Edad = {computed.blRatio.toFixed(2)}
                            </span>
                        </div>
                    </Field>

                    <Field label="Factores sistémicos / genéticos">
                        <RadioGroup
                            name="sistemico" value={sistemico} onChange={setSistemico} vertical
                            options={[
                                { value: 1, label: 'Ninguno' },
                                { value: 2, label: '1 factor menor' },
                                { value: 3, label: 'DM ctrl / IL-1+' },
                                { value: 4, label: 'DM no controlada' },
                            ]}
                        />
                    </Field>

                    <Field label="Tabaquismo">
                        <RadioGroup
                            name="tabaquismo" value={tabaquismo} onChange={setTabaquismo} vertical
                            options={[
                                { value: 1, label: 'No fuma / Ex >5 años' },
                                { value: 2, label: 'Ex-fumador <5 años / <10 cig' },
                                { value: 3, label: '10-19 cigarrillos/día' },
                                { value: 4, label: '≥20 cigarrillos/día' },
                            ]}
                        />
                    </Field>
                </div>
            </div>

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
        </div>
    );
}

// ---- constantes ----

const COLOR_OPTIONS = [
    { value: '#5B6651', label: 'Verde sage' },
    { value: '#CBAAA2', label: 'Rosa polvo' },
    { value: '#A3968B', label: 'Taupe' },
    { value: '#D9A86C', label: 'Ámbar' },
    { value: '#312923', label: 'Espresso' },
    { value: '#7A8B7F', label: 'Verde sage osc.' },
    { value: '#9B7E7A', label: 'Marrón rosa' },
    { value: '#B92323', label: 'Rojo' },
];

// ---- sub-componentes ----

const inputCls = "w-24 px-3 py-2 border border-[#DFD2C4] rounded-xl bg-[#FDFBF7] text-[#312923] font-bold text-sm outline-none focus:border-[#5B6651] transition-colors";

function Field({ label, hint, children }) {
    return (
        <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-1.5">
                {label}
                {hint && <span className="ml-1 font-normal normal-case text-[#A3968B]">{hint}</span>}
            </label>
            {children}
        </div>
    );
}

function RadioGroup({ name, value, onChange, options, vertical = false }) {
    return (
        <div className={`flex gap-2 flex-wrap ${vertical ? 'flex-col md:flex-row' : ''}`}>
            {options.map(opt => (
                <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${
                        value === opt.value
                            ? 'border-[#5B6651] bg-[#5B6651]/10 text-[#312923]'
                            : 'border-[#DFD2C4] bg-[#FDFBF7] text-[#9A8F84] hover:border-[#A3968B]'
                    }`}
                >
                    <input
                        type="radio" name={name} value={opt.value}
                        checked={value === opt.value}
                        onChange={() => onChange(opt.value)}
                        className="sr-only"
                    />
                    {opt.label}
                </label>
            ))}
        </div>
    );
}

function scoreBadgeColor(score) {
    if (score === 1) return '#5B6651';
    if (score === 2) return '#D9A86C';
    if (score === 3) return '#B87C50';
    return '#B92323';
}

const HexagonChart = React.memo(function HexagonChart({ scores, dataColor }) {
    const CX = 175, CY = 170, RU = 36;

    const ZONE_FILLS   = ['rgba(91,102,81,0.10)', 'rgba(217,168,108,0.12)', 'rgba(184,124,80,0.14)', 'rgba(185,35,35,0.12)'];
    const ZONE_STROKES = ['#5B6651', '#D9A86C', '#B87C50', '#B92323'];
    const LABELS       = ['BOP%', 'PD≥5mm', 'D. perd.', 'BL/Edad', 'Sistémico', 'Amb.'];
    const LR           = 4 * RU + 22;

    const hexPt = (r, i) => {
        const a = -Math.PI / 2 + i * (Math.PI / 3);
        return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    };

    const hexPts = (r) =>
        Array.from({ length: 6 }, (_, i) => hexPt(r, i).join(',')).join(' ');

    return (
        <svg viewBox="-115 -30 510 405" style={{ width: '100%', maxWidth: 400 }} aria-label="Hexágono de riesgo periodontal">
            {/* zonas de fondo */}
            {[3, 2, 1, 0].map(z => (
                <polygon key={`fill-${z}`} points={hexPts((z + 1) * RU)} fill={ZONE_FILLS[z]} />
            ))}
            {[0, 1, 2, 3].map(z => (
                <polygon key={`stroke-${z}`} points={hexPts((z + 1) * RU)} fill="none" stroke={ZONE_STROKES[z]} strokeWidth="0.9" strokeOpacity="0.4" />
            ))}

            {/* ejes */}
            {Array.from({ length: 6 }, (_, i) => {
                const [x, y] = hexPt(4 * RU, i);
                return <line key={`axis-${i}`} x1={CX} y1={CY} x2={x} y2={y} stroke="#A3968B" strokeWidth="0.8" />;
            })}

            {/* polígono de datos */}
            <polygon
                points={scores.map((s, i) => hexPt(s * RU, i).join(',')).join(' ')}
                fill={`${dataColor}40`}
                stroke={dataColor}
                strokeWidth="2.5"
                strokeLinejoin="round"
            />

            {/* puntos */}
            {scores.map((s, i) => {
                const [x, y] = hexPt(s * RU, i);
                return (
                    <circle
                        key={`dot-${i}`}
                        cx={x} cy={y} r="5"
                        fill={dataColor}
                        stroke="#FDFBF7"
                        strokeWidth="2"
                    />
                );
            })}

            {/* etiquetas */}
            {LABELS.map((label, i) => {
                const [x, y] = hexPt(LR, i);
                const anchor  = i === 0 || i === 3 ? 'middle' : i < 3 ? 'start' : 'end';
                const xOff    = i === 0 || i === 3 ? 0 : i < 3 ? 5 : -5;
                const yOff    = i === 0 ? -5 : i === 3 ? 9 : 0;
                return (
                    <text
                        key={`label-${i}`}
                        x={x + xOff} y={y + yOff}
                        textAnchor={anchor}
                        dominantBaseline="middle"
                        fontSize="12"
                        fontWeight="600"
                        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
                        fill="#312923"
                    >
                        {label}
                    </text>
                );
            })}
        </svg>
    );
});
