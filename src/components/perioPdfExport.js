import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { formatRUT } from '../constants';

// ============================================================================
// EXPORTAR PERIODONTOGRAMA A PDF — v2
// ============================================================================
// Mismo orden de filas y misma estructura de datos que PerioChart.jsx (para
// que lo que ves en pantalla sea exactamente lo que sale impreso): filas de
// sitio (Margen gingival, Prof. sondaje, Sangrado, Supuración) con 3
// sub-columnas Distal/Centro/Mesial por diente, y filas de una sola celda
// por diente (Implante, Movilidad, Furca, Nota) usando colSpan.
//
// Instalación (una sola vez en el proyecto):
//   npm install jspdf jspdf-autotable
//
// Uso desde PerioTab.jsx:
//   generatePerioPDF({
//     patient: p, stats: getPerioStats(), perioDentition,
//     teethUpper: TEETH_UPPER, teethLower: TEETH_LOWER,
//     teethUpperPed: TEETH_UPPER_PED, teethLowerPed: TEETH_LOWER_PED,
//   });
//
// NOTA: no incluye los dibujos anatómicos de los dientes (PerioChart.jsx sí
// los tiene, vía getDetailedAnatomy) — replicar esos SVG dentro de un PDF de
// autoTable es harto más trabajo por poco valor real en un documento
// impreso/clínico, así que el PDF se queda con el formato tabular puro
// (que es, de hecho, el formato estándar de un periodontograma para
// archivo/historial — el dibujo es más para la pantalla). Si de verdad lo
// necesitas, avísame y lo agrego aparte con html2canvas (ya está instalado
// en tu proyecto).
// ============================================================================

// Mismo orden exacto que SUPERIOR_TOP/BOTTOM e INFERIOR_TOP/BOTTOM en PerioTab.jsx
const SUPERIOR_TOP = ['implante', 'movilidad', 'furca', 'sangrado', 'supuracion', 'mg', 'pd'];
const SUPERIOR_BOTTOM = ['pd', 'mg', 'sangrado', 'supuracion', 'furca', 'nota'];
const INFERIOR_TOP = ['nota', 'furca', 'sangrado', 'supuracion', 'mg', 'pd'];
const INFERIOR_BOTTOM = ['pd', 'mg', 'sangrado', 'supuracion', 'furca', 'movilidad', 'implante'];

const SITE_ROWS = ['mg', 'pd', 'sangrado', 'supuracion'];
const isSiteRow = (rt) => SITE_ROWS.includes(rt);

const ROW_LABELS = {
    implante: 'Implante', movilidad: 'Movilidad', furca: 'Furca',
    sangrado: 'Sangrado', supuracion: 'Supuración',
    mg: 'Margen ging.', pd: 'Prof. sondaje', nota: 'Nota',
};

function fdiLabel(n) { return `${Math.floor(n / 10)}.${n % 10}`; }

function isMissing(patient, n) {
    const st = patient.clinical.teeth?.[n]?.status;
    return Array.isArray(st) ? st.includes('missing') : st === 'missing';
}
function hasImplantStatus(patient, n) {
    const st = patient.clinical.teeth?.[n]?.status;
    return Array.isArray(st) ? st.includes('implant') : st === 'implant';
}

// Mismos umbrales de severidad que ya usa la app en pantalla (≥4 ámbar, ≥6 rojo)
function pdColor(raw) {
    if (raw === '' || raw === undefined || raw === null) return null;
    const n = parseFloat(raw);
    if (n >= 6) return [220, 38, 38];
    if (n >= 4) return [180, 130, 20];
    return null;
}

function siteCellObj(rowType, patient, n, face, idx) {
    const perio = patient.clinical.perio?.[n] || {};
    if (rowType === 'pd') {
        const raw = (perio[`pd_${face}`] || ['', '', ''])[idx];
        const color = pdColor(raw);
        return color ? { content: raw ?? '', styles: { textColor: color, fontStyle: 'bold' } } : { content: raw ?? '' };
    }
    if (rowType === 'mg') {
        const raw = (perio[`mg_${face}`] || ['', '', ''])[idx];
        return { content: raw ?? '' };
    }
    if (rowType === 'sangrado') {
        const v = (perio[`bop_${face}`] || [false, false, false])[idx];
        return v ? { content: '•', styles: { textColor: [220, 38, 38], fontStyle: 'bold' } } : { content: '' };
    }
    if (rowType === 'supuracion') {
        const v = (perio[`pus_${face}`] || [false, false, false])[idx];
        return v ? { content: 'P', styles: { textColor: [180, 130, 20], fontStyle: 'bold' } } : { content: '' };
    }
    return { content: '' };
}

function soloCellObj(rowType, patient, n) {
    if (rowType === 'implante') return { content: hasImplantStatus(patient, n) ? '●' : '', styles: { textColor: [59, 130, 246] } };
    if (rowType === 'movilidad') return { content: String(patient.clinical.perio?.[n]?.mobility || 0) };
    if (rowType === 'furca') { const v = patient.clinical.perio?.[n]?.furcation || 0; return { content: v > 0 ? String(v) : '' }; }
    return { content: '' }; // 'nota': sin campo de datos todavía
}

// Una tabla (la de arriba o la de abajo de un arco): filas de sitio con 3
// sub-columnas por diente, filas "solo" con colSpan 3.
function addPerioTable(doc, { teeth, patient, face, rows, startY }) {
    const head = [['', ...teeth.map(n => ({ content: fdiLabel(n), colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7 } }))]];

    const body = rows.map(rt => {
        const rowCells = isSiteRow(rt)
            ? teeth.flatMap(n => [0, 1, 2].map(idx => siteCellObj(rt, patient, n, face, idx)))
            : teeth.map(n => ({ ...soloCellObj(rt, patient, n), colSpan: 3 }));
        return [{ content: ROW_LABELS[rt], styles: { halign: 'left', fontStyle: 'bold', fontSize: 6.5, textColor: [130, 120, 110] } }, ...rowCells];
    });

    autoTable(doc, {
        startY,
        head,
        body,
        theme: 'grid',
        styles: { fontSize: 6.5, cellPadding: 0.8, halign: 'center', valign: 'middle' },
        headStyles: { fillColor: [91, 102, 81], textColor: 255 },
        columnStyles: { 0: { cellWidth: 20 } },
        margin: { left: 14, right: 14 },
    });

    return doc.lastAutoTable.finalY;
}

function addArch(doc, { title, teeth, patient, topFace, topRows, bottomFace, bottomRows, startY }) {
    let y = startY;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, y);
    doc.setFont(undefined, 'normal');
    y += 3;

    y = addPerioTable(doc, { teeth, patient, face: topFace, rows: topRows, startY: y }) + 4;
    y = addPerioTable(doc, { teeth, patient, face: bottomFace, rows: bottomRows, startY: y }) + 6;
    return y;
}

export function generatePerioPDF({
    patient,
    stats,
    perioDentition = 'adulto',
    teethUpper = [],
    teethLower = [],
    teethUpperPed = [],
    teethLowerPed = [],
}) {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Encabezado ---------------------------------------------------------
    // "rut" usa tu propio formatRUT() de constants.js. Solo queda sin confirmar
    // el campo "name" — si tu objeto paciente lo llama distinto, ajusta esta línea.
    const patientName = patient?.name || 'Paciente';
    const patientId = patient?.rut ? formatRUT(patient.rut) : '';
    const today = new Date().toLocaleDateString('es-CL');

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Periodontograma Clínico', 14, 15);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Paciente: ${patientName}${patientId ? '  ·  ID: ' + patientId : ''}`, 14, 21);
    doc.text(`Fecha: ${today}`, pageWidth - 14, 21, { align: 'right' });

    // --- Resumen de índices --------------------------------------------------
    autoTable(doc, {
        startY: 26,
        head: [['Sangrado (BOP)', "Índice de Placa (O'Leary)", 'NIC Promedio']],
        body: [[`${stats?.bop ?? '-'}%`, `${stats?.plaque ?? '-'}%`, `${stats?.nic ?? '-'} mm`]],
        theme: 'grid',
        styles: { fontSize: 9, halign: 'center', cellPadding: 2 },
        headStyles: { fillColor: [49, 41, 35], textColor: 255 },
        margin: { left: 14, right: 14 },
    });

    let y = doc.lastAutoTable.finalY + 8;

    const includeAdult = perioDentition === 'adulto' || perioDentition === 'mixto';
    const includePed = perioDentition === 'pediatrico' || perioDentition === 'mixto';
    const filterMissing = (arr) => arr.filter(n => !isMissing(patient, n));

    // --- Superior ------------------------------------------------------------
    if (includeAdult && teethUpper.length) {
        const teeth = filterMissing(teethUpper);
        y = addArch(doc, {
            title: 'Superior', teeth, patient,
            topFace: 'v', topRows: SUPERIOR_TOP,
            bottomFace: 'l', bottomRows: SUPERIOR_BOTTOM,
            startY: y,
        });
    }
    if (includePed && teethUpperPed.length) {
        if (y > 140) { doc.addPage(); y = 15; }
        const teeth = filterMissing(teethUpperPed);
        y = addArch(doc, {
            title: 'Superior (temporal)', teeth, patient,
            topFace: 'v', topRows: SUPERIOR_TOP,
            bottomFace: 'l', bottomRows: SUPERIOR_BOTTOM,
            startY: y,
        });
    }

    // --- Inferior --------------------------------------------------------
    doc.addPage();
    y = 15;
    if (includePed && teethLowerPed.length) {
        const teeth = filterMissing(teethLowerPed);
        y = addArch(doc, {
            title: 'Inferior (temporal)', teeth, patient,
            topFace: 'l', topRows: INFERIOR_TOP,
            bottomFace: 'v', bottomRows: INFERIOR_BOTTOM,
            startY: y,
        });
    }
    if (includeAdult && teethLower.length) {
        if (y > 140) { doc.addPage(); y = 15; }
        const teeth = filterMissing(teethLower);
        y = addArch(doc, {
            title: 'Inferior', teeth, patient,
            topFace: 'l', topRows: INFERIOR_TOP,
            bottomFace: 'v', bottomRows: INFERIOR_BOTTOM,
            startY: y,
        });
    }

    // --- Historial (si existe) ----------------------------------------------
    if (patient.clinical?.perioHistory?.length) {
        doc.addPage();
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('Historial Clínico Perio', 14, 15);
        doc.setFont(undefined, 'normal');
        autoTable(doc, {
            startY: 20,
            head: [['Fecha', 'BOP', 'Notas']],
            body: patient.clinical.perioHistory.map(snap => [
                snap.date || '-',
                `${snap.stats?.bop ?? '-'}%`,
                snap.notes || 'Sin observaciones adicionales',
            ]),
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [91, 102, 81], textColor: 255 },
            columnStyles: { 2: { cellWidth: 200 } },
            margin: { left: 14, right: 14 },
        });
    }

    // --- Pie de página con numeración ---------------------------------------
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    const safeName = patientName.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    doc.save(`periodontograma_${safeName}_${today.replace(/\//g, '-')}.pdf`);
}
