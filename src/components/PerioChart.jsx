import React from 'react';
import { getDetailedAnatomy } from './ToothSystem';

// ============================================================================
// NÚMERO FDI CON PUNTO (1.8, 2.6, etc.)
// ============================================================================
export function fdiLabel(n) {
    return `${Math.floor(n / 10)}.${n % 10}`;
}

// ============================================================================
// DIENTE — reusa getDetailedAnatomy() de ToothSystem.jsx (mismas curvas y
// raíces múltiples que ya usa el resto de la app) en vez de un motor propio.
// No dibuja sangrado/pus/movilidad/furca encima: esos datos viven en las
// filas de la tabla, así el gráfico se mantiene limpio.
// ============================================================================
function ImplantPost({ isUpper }) {
    const cervY = isUpper ? 25 : 75;
    const dir = isUpper ? -1 : 1;
    const collarEndY = cervY + dir * 8;
    const apexY = cervY + dir * 58;
    const threadCount = 7;
    const span = Math.abs(apexY - collarEndY) - 6;
    return (
        <g>
            <rect x={42} y={Math.min(cervY, collarEndY)} width={16} height={8} rx={2} fill="#A9AFB6" stroke="#8A9098" strokeWidth={0.8} />
            <path
                d={`M 40,${collarEndY} L 60,${collarEndY} L 53,${apexY} Q 50,${apexY + dir * 4} 47,${apexY} Z`}
                fill="#B8BEC4" stroke="#8A9098" strokeWidth={0.8}
            />
            {Array.from({ length: threadCount }).map((_, i) => {
                const y1 = collarEndY + dir * (5 + (span / threadCount) * i);
                return <line key={i} x1={41} y1={y1} x2={59} y2={y1 + dir * 3} stroke="#8A9098" strokeWidth={0.8} />;
            })}
        </g>
    );
}

export function ToothGraphic({ n, hasImplant, missing }) {
    const { crown, roots, isUpper } = getDetailedAnatomy(n);

    if (missing) {
        return (
            <svg viewBox="0 0 100 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" className="overflow-visible">
                <path d={crown} fill="none" stroke="#DFD2C4" strokeWidth={2} strokeDasharray="4 4" opacity={0.6} />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 100 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" className="overflow-visible drop-shadow-sm">
            {hasImplant
                ? <ImplantPost isUpper={isUpper} />
                : roots.map((r, i) => <path key={i} d={r} fill="#F7F4EF" stroke="#E4D9CB" strokeWidth={1.5} />)}
            <path d={crown} fill="#FFFFFF" stroke="#3D332B" strokeWidth={2} />
        </svg>
    );
}

// ============================================================================
// GRÁFICO DE LÍNEAS CONTINUO — PD (rojo) y Margen (azul), con relleno de
// bolsa y marcadores de profundidad anómala (≥4mm ámbar, ≥6mm rojo). Mismo
// cálculo que el renderPerioRow original (yMG/yPD según isUpper), adaptado al
// layout de tabla nuevo: un gráfico por cara — Vestibular el suyo, Palatino/
// Lingual el suyo — igual que hacía la app antes del rediseño.
// ============================================================================
function severityMarkerColor(pdVal) {
    if (pdVal >= 6) return '#dc2626';
    if (pdVal >= 4) return '#f59e0b';
    return null;
}

function PerioLineOverlay({ teeth, patient, face }) {
    // FIX: la versión anterior estiraba un viewBox angosto-y-alto hasta llenar
    // una fila ancha-y-baja (preserveAspectRatio="none"), lo que aplastaba los
    // círculos de severidad en elipses horizontales (las "rayitas" raras) y,
    // como no distinguía "sin dato" de "vale 0", dibujaba picos artificiales
    // conectando un diente con valor real con el vecino vacío. Ahora se mide
    // el ancho Y el alto reales en píxeles (sin estirar nada, se adapta solo
    // si la fila cambia de altura) y la línea se corta en cada tramo sin
    // datos, en vez de inventar un cero ahí.
    const wrapRef = React.useRef(null);
    const [dims, setDims] = React.useState({ w: 0, h: 0 });

    React.useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const update = () => setDims({ w: el.clientWidth, h: el.clientHeight });
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { w: width, h: H } = dims;
    const BASELINE = H * 0.5;
    const SCALE = 2.6; // px por mm — con más alto disponible, algo más de margen que antes

    const runs = [];
    let current = [];
    if (width > 0 && H > 0) {
        const slot = width / teeth.length;
        teeth.forEach((n, i) => {
            const perio = patient.clinical.perio?.[n] || {};
            const mgArr = perio[`mg_${face}`] || ['', '', ''];
            const pdArr = perio[`pd_${face}`] || ['', '', ''];
            const { isUpper } = getDetailedAnatomy(n);
            [0, 1, 2].forEach(idx => {
                const mgRaw = mgArr[idx];
                const pdRaw = pdArr[idx];
                const hasData = (mgRaw !== '' && mgRaw !== undefined) || (pdRaw !== '' && pdRaw !== undefined);
                if (!hasData) {
                    if (current.length) { runs.push(current); current = []; }
                    return;
                }
                const x = i * slot + (idx + 0.5) * (slot / 3);
                const mgVal = parseFloat(mgRaw) || 0;
                const pdVal = parseFloat(pdRaw) || 0;
                const yMG = isUpper ? BASELINE + mgVal * SCALE : BASELINE - mgVal * SCALE;
                const yPD = isUpper ? yMG - pdVal * SCALE : yMG + pdVal * SCALE;
                current.push({ x, yMG, yPD, pd: pdVal });
            });
        });
        if (current.length) runs.push(current);
    }

    return (
        <div ref={wrapRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            {width > 0 && H > 0 && (
                <svg width={width} height={H} className="overflow-visible">
                    {runs.map((pts, ri) => {
                        if (pts.length < 2) return null; // un solo punto suelto: no hay línea que trazar, solo el marcador (abajo)
                        const pathMG = `M ${pts.map(p => `${p.x},${p.yMG}`).join(' L ')}`;
                        const pathPD = `M ${pts.map(p => `${p.x},${p.yPD}`).join(' L ')}`;
                        const pathFill = `M ${pts.map(p => `${p.x},${p.yMG}`).join(' L ')} L ${[...pts].reverse().map(p => `${p.x},${p.yPD}`).join(' L ')} Z`;
                        return (
                            <g key={ri}>
                                <path d={pathFill} fill="#ef4444" fillOpacity="0.10" />
                                <path d={pathMG} fill="none" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d={pathPD} fill="none" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                        );
                    })}
                    {runs.flat().map((pt, idx) => {
                        const color = severityMarkerColor(pt.pd);
                        if (!color) return null;
                        return <circle key={idx} cx={pt.x} cy={pt.yPD} r="2.5" fill={color} stroke="#FFFFFF" strokeWidth="1" />;
                    })}
                </svg>
            )}
        </div>
    );
}

// ============================================================================
// FILAS: sitio (3 sub-celdas Distal/Centro/Mesial) vs. solo (1 celda x diente)
// ============================================================================
const SITE_ROWS = ['mg', 'pd', 'sangrado', 'supuracion'];
const isSiteRow = (rt) => SITE_ROWS.includes(rt);

const ROW_LABELS = {
    implante: 'Implante', movilidad: 'Movilidad', furca: 'Furca',
    sangrado: 'Sangrado', supuracion: 'Supuración',
    mg: 'Margen ging.', pd: 'Prof. sondaje', nota: 'Nota',
};

function severityClass(v) {
    if (v === null || v === undefined || v === '') return 'text-[#312923]';
    const n = parseFloat(v);
    if (n >= 6) return 'text-red-600 font-extrabold';
    if (n >= 4) return 'text-amber-600 font-bold';
    return 'text-emerald-700';
}

function isMissing(patient, n) {
    const st = patient.clinical.teeth?.[n]?.status;
    return Array.isArray(st) ? st.includes('missing') : st === 'missing';
}
function hasImplantStatus(patient, n) {
    const st = patient.clinical.teeth?.[n]?.status;
    return Array.isArray(st) ? st.includes('implant') : st === 'implant';
}

// ============================================================================
// ESCRITURA DE DATOS — mismo shape que useVoiceAssistant.js (pd_v/pd_l,
// mg_v/mg_l, bop_v/bop_l, pus_v/pus_l, mobility, furcation) para que la
// edición manual y el dictado por voz sean 100% compatibles y nunca se pisen.
// ============================================================================
function updatePerio(patient, savePatientData, selectedPatientId, n, updateFn) {
    const existing = patient.clinical.perio?.[n] || {};
    const base = {
        pd_v: [...(existing.pd_v || ['', '', ''])], pd_l: [...(existing.pd_l || ['', '', ''])],
        mg_v: [...(existing.mg_v || ['', '', ''])], mg_l: [...(existing.mg_l || ['', '', ''])],
        bop_v: [...(existing.bop_v || [false, false, false])], bop_l: [...(existing.bop_l || [false, false, false])],
        pus_v: [...(existing.pus_v || [false, false, false])], pus_l: [...(existing.pus_l || [false, false, false])],
        mobility: existing.mobility || 0, furcation: existing.furcation || 0,
    };
    const updated = updateFn(base);
    const newPerio = { ...patient.clinical.perio, [n]: updated };
    savePatientData(selectedPatientId, { ...patient, clinical: { ...patient.clinical, perio: newPerio } });
}

function toggleImplant(patient, savePatientData, selectedPatientId, n) {
    const existingTooth = patient.clinical.teeth?.[n] || {};
    const statusArr = Array.isArray(existingTooth.status) ? existingTooth.status : (existingTooth.status ? [existingTooth.status] : []);
    const newStatus = statusArr.includes('implant') ? statusArr.filter(s => s !== 'implant') : [...statusArr, 'implant'];
    const newTeeth = { ...patient.clinical.teeth, [n]: { ...existingTooth, status: newStatus.length ? newStatus : null } };
    savePatientData(selectedPatientId, { ...patient, clinical: { ...patient.clinical, teeth: newTeeth } });
}

// --- Celda numérica editable (PD / MG) ---
function SiteNumberCell({ value, colorClass, onCommit }) {
    const [local, setLocal] = React.useState(value ?? '');
    React.useEffect(() => { setLocal(value ?? ''); }, [value]);
    const commit = () => {
        if (local === (value ?? '')) return;
        if (local !== '' && !/^-?\d+$/.test(local)) { setLocal(value ?? ''); return; }
        onCommit(local);
    };
    return (
        <input
            type="text" inputMode="numeric"
            value={local}
            onChange={e => setLocal(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setLocal(value ?? ''); e.target.blur(); } }}
            className={`block w-full text-center text-[8px] leading-[16px] font-bold bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-[#5B6651] rounded-sm ${colorClass}`}
            style={{ minWidth: 0 }}
        />
    );
}

function SiteToggleCell({ active, shape, onToggle, title }) {
    return (
        <button onClick={onToggle} title={title} className="w-full h-full flex items-center justify-center">
            {active
                ? <span className={`w-[6px] h-[6px] inline-block ${shape === 'circle' ? 'rounded-full bg-red-600' : 'rounded-sm bg-amber-600'}`} />
                : <span className="w-[6px] h-[6px] inline-block rounded-sm border border-[#DFD2C4] opacity-50" />}
        </button>
    );
}

function siteCell(rowType, patient, n, face, idx, keyPrefix, onUpdateTooth) {
    const perio = patient.clinical.perio?.[n] || {};
    if (rowType === 'pd') {
        const raw = (perio[`pd_${face}`] || ['', '', ''])[idx];
        return (
            <SiteNumberCell key={keyPrefix} value={raw} colorClass={severityClass(raw)}
                onCommit={(v) => onUpdateTooth(n, d => { const arr = [...(d[`pd_${face}`] || ['', '', ''])]; arr[idx] = v; return { ...d, [`pd_${face}`]: arr }; })}
            />
        );
    }
    if (rowType === 'mg') {
        const raw = (perio[`mg_${face}`] || ['', '', ''])[idx];
        return (
            <SiteNumberCell key={keyPrefix} value={raw} colorClass="text-[#312923]"
                onCommit={(v) => onUpdateTooth(n, d => { const arr = [...(d[`mg_${face}`] || ['', '', ''])]; arr[idx] = v; return { ...d, [`mg_${face}`]: arr }; })}
            />
        );
    }
    if (rowType === 'sangrado') {
        const v = (perio[`bop_${face}`] || [false, false, false])[idx];
        return (
            <SiteToggleCell key={keyPrefix} active={v} shape="circle" title="Sangrado al sondaje"
                onToggle={() => onUpdateTooth(n, d => { const arr = [...(d[`bop_${face}`] || [false, false, false])]; arr[idx] = !arr[idx]; return { ...d, [`bop_${face}`]: arr }; })}
            />
        );
    }
    if (rowType === 'supuracion') {
        const v = (perio[`pus_${face}`] || [false, false, false])[idx];
        return (
            <SiteToggleCell key={keyPrefix} active={v} shape="square" title="Supuración"
                onToggle={() => onUpdateTooth(n, d => { const arr = [...(d[`pus_${face}`] || [false, false, false])]; arr[idx] = !arr[idx]; return { ...d, [`pus_${face}`]: arr }; })}
            />
        );
    }
    return null;
}

function soloCell(rowType, patient, n, onUpdateTooth, onToggleImplant) {
    if (rowType === 'implante') {
        const active = hasImplantStatus(patient, n);
        return (
            <button onClick={() => onToggleImplant(n)} title="Implante" className="w-full h-full flex items-center justify-center">
                {active
                    ? <span className="w-[6px] h-[6px] rounded-full bg-blue-500 inline-block" />
                    : <span className="w-[6px] h-[6px] rounded-full border border-[#DFD2C4] opacity-50 inline-block" />}
            </button>
        );
    }
    if (rowType === 'movilidad') {
        const v = patient.clinical.perio?.[n]?.mobility || 0;
        return (
            <button onClick={() => onUpdateTooth(n, d => ({ ...d, mobility: v >= 3 ? 0 : v + 1 }))} title="Click para cambiar grado (0-3)" className="w-full h-full flex items-center justify-center text-[#312923]">
                {v}
            </button>
        );
    }
    if (rowType === 'furca') {
        const v = patient.clinical.perio?.[n]?.furcation || 0;
        return (
            <button onClick={() => onUpdateTooth(n, d => ({ ...d, furcation: v >= 3 ? 0 : v + 1 }))} title={`Furca grado ${v} — click para cambiar`} className="w-full h-full flex items-center justify-center">
                <span style={{
                    width: 0, height: 0, display: 'inline-block',
                    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                    borderBottom: `8px solid ${v > 0 ? '#8b7aa8' : '#D9D1E6'}`,
                }} />
            </button>
        );
    }
    return null; // 'nota': sin campo de datos todavía — solo layout
}

// ============================================================================
// UN ARCO COMPLETO — UNA sola <table> con table-layout:fixed. Todo (números,
// filas de datos, dientes) vive en la misma tabla/colgroup para que las
// columnas SIEMPRE calcen entre sí, y para que el ancho nunca se dispare por
// el contenido (a diferencia de CSS grid con "1fr", una tabla fixed reparte
// el ancho de forma predecible sin importar qué haya adentro de cada celda).
// ============================================================================
export function PerioArchGrid({ teeth, patient, onToothClick, savePatientData, selectedPatientId, topFace, topRows, topLabel, bottomFace, bottomRows, bottomLabel }) {
    const onUpdateTooth = (n, updateFn) => updatePerio(patient, savePatientData, selectedPatientId, n, updateFn);
    const onToggleImplant = (n) => toggleImplant(patient, savePatientData, selectedPatientId, n);

    const dataRow = (rt, face) => (
        <tr key={rt}>
            <td className="h-[17px] text-right pr-1.5 text-[8px] font-bold text-[#9A8F84] whitespace-nowrap align-middle bg-white sticky left-0">
                {ROW_LABELS[rt]}
            </td>
            {isSiteRow(rt)
                ? teeth.map(n => [0, 1, 2].map(idx => (
                    <td
                        key={`${rt}-${n}-${idx}`}
                        className={`h-[17px] p-0 text-center bg-[#EEF6EE] border-b border-[#EDE6DB] ${idx === 2 ? 'border-r border-r-[#C7BBA8]' : 'border-r border-r-[#EDE6DB]'}`}
                    >
                        {siteCell(rt, patient, n, face, idx, `${rt}-${n}-${idx}`, onUpdateTooth)}
                    </td>
                )))
                : teeth.map(n => (
                    <td
                        key={`${rt}-${n}`}
                        colSpan={3}
                        className="h-[17px] p-0 text-center bg-[#FDFBF7] border-b border-[#EDE6DB] border-r border-r-[#C7BBA8] text-[8px] font-bold"
                    >
                        {soloCell(rt, patient, n, onUpdateTooth, onToggleImplant)}
                    </td>
                ))}
        </tr>
    );

    const totalCols = 1 + teeth.length * 3;

    const toothPictureRow = (archLabel, teethList, face) => (
        <tr>
            <td colSpan={totalCols} className="p-0">
                <div className="flex items-end py-1">
                    <div className="text-right pr-1.5 text-[9px] font-black text-[#8b7d6f] self-center" style={{ width: '7%', flexShrink: 0 }}>{archLabel}</div>
                    <div className="flex-1 relative" style={{ height: 78 }}>
                        <PerioLineOverlay teeth={teethList} patient={patient} face={face} />
                        <div className="absolute inset-0 flex justify-between">
                            {teethList.map(n => (
                                <div
                                    key={n}
                                    className="cursor-pointer hover:opacity-70 transition-opacity relative flex justify-center items-end"
                                    style={{ width: `${100 / teethList.length}%`, height: '100%', zIndex: 10 }}
                                    onClick={() => onToothClick(n)}
                                >
                                    <div style={{ width: 34, height: 68 }}>
                                        <ToothGraphic n={n} hasImplant={hasImplantStatus(patient, n)} missing={isMissing(patient, n)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    );

    return (
        <table className="border-collapse" style={{ tableLayout: 'fixed', width: '100%', minWidth: 780 }}>
            <colgroup>
                <col style={{ width: '7%' }} />
                {teeth.map(n => [0, 1, 2].map(i => <col key={`${n}-${i}`} style={{ width: `${93 / (teeth.length * 3)}%` }} />))}
            </colgroup>
            <tbody>
                <tr>
                    <td className="bg-white sticky left-0" />
                    {teeth.map(n => (
                        <td key={n} colSpan={3} className="h-4 text-center text-[9px] font-black text-[#5B6651] border-r border-r-[#C7BBA8]">
                            {fdiLabel(n)}
                        </td>
                    ))}
                </tr>
                {topRows.map(rt => dataRow(rt, topFace))}
                {toothPictureRow(topLabel, teeth, topFace)}
                <tr>
                    <td className="p-0 bg-white sticky left-0" />
                    <td colSpan={teeth.length * 3} className="p-0"><div className="h-[2px] bg-[#D4536E] opacity-40" /></td>
                </tr>
                {toothPictureRow(bottomLabel, teeth, bottomFace)}
                {bottomRows.map(rt => dataRow(rt, bottomFace))}
            </tbody>
        </table>
    );
}
