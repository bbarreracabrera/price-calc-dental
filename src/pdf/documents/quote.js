// src/pdf/documents/quote.js
import autoTable from 'jspdf-autotable';
import { C, T, FUENTE } from '../theme.js';
import { crearDocumento, dibujarMembrete, cajaPaciente, dibujarFirmas, texto, pesos, fecha } from '../layout.js';

/**
 * Presupuesto clínico.
 *
 * El presupuesto no es una boleta. No lo reemplaza ni se emite ante el SII:
 * es el documento que deja constancia de lo que se propuso, a qué precio y
 * bajo qué condiciones. La boleta electrónica se emite aparte al cobrar, y el
 * pie lo dice explícitamente para que ningún paciente lo confunda.
 */
export function construirPresupuesto({ doc, g, paciente, items = [], config, folio, opciones = {} }) {
  const { validezDias = 30, descuento = 0, abono = 0, notas } = opciones;

  let y = dibujarMembrete(doc, g, config, { titulo: 'Presupuesto', folio });
  y = cajaPaciente(doc, g, paciente, y);

  const bruto = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0);
  const total = Math.max(0, bruto - Number(descuento || 0));
  const saldo = Math.max(0, total - Number(abono || 0));

  autoTable(doc, {
    startY: y,
    margin: { left: g.izq, right: g.izq },
    head: [['Tratamiento', 'Pieza', 'Cant.', 'Valor unitario', 'Subtotal']],
    body: items.map(it => [
      it.name || '',
      it.tooth ? String(it.tooth) : '—',
      String(it.qty || 1),
      pesos(it.price),
      pesos(Number(it.price || 0) * Number(it.qty || 1)),
    ]),
    theme: 'grid',
    styles: {
      font: FUENTE, fontSize: T.dato, cellPadding: 2.6,
      lineColor: C.line, lineWidth: 0.2, textColor: C.ink, valign: 'middle',
    },
    headStyles: { fillColor: C.accent, textColor: C.white, fontStyle: 'bold', fontSize: T.etiqueta, halign: 'left' },
    alternateRowStyles: { fillColor: C.canvas },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 16 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
    // La tabla se parte sola entre páginas y repite el encabezado. El problema
    // viejo era que las firmas se dibujaban con una coordenada calculada a ojo.
    rowPageBreak: 'avoid',
    didDrawPage: () => {},
  });

  y = doc.lastAutoTable.finalY + 6;

  // --- Totales ---
  const anchoTot = 78;
  const xTot = g.der - anchoTot;
  const filas = [
    ['Subtotal', pesos(bruto)],
    ...(descuento ? [['Descuento', `- ${pesos(descuento)}`]] : []),
    ...(abono ? [['Abonado', `- ${pesos(abono)}`]] : []),
  ];

  if (y + 12 + filas.length * 5.5 > g.pieY - 45) { doc.addPage(); y = g.margen.arriba + 18; }

  filas.forEach(([et, val], i) => {
    const yy = y + i * 5.5;
    texto(doc, et, xTot, yy, { size: T.dato, color: C.muted });
    texto(doc, val, g.der, yy, { size: T.dato, align: 'right' });
  });

  const yTotal = y + filas.length * 5.5 + 1;
  doc.setFillColor(...C.accentSoft);
  doc.roundedRect(xTot - 4, yTotal - 1, anchoTot + 4, 11, 1.5, 1.5, 'F');
  texto(doc, abono ? 'SALDO POR PAGAR' : 'TOTAL', xTot, yTotal + 6, { size: T.seccion, estilo: 'bold' });
  texto(doc, pesos(abono ? saldo : total), g.der, yTotal + 6, { size: T.subtitulo, estilo: 'bold', align: 'right' });

  y = yTotal + 18;

  // --- Condiciones ---
  const vence = new Date(Date.now() + validezDias * 86400000);
  const condiciones = [
    `Este presupuesto tiene una validez de ${validezDias} días corridos. Vence el ${fecha(vence)}.`,
    'Los valores pueden variar si durante el tratamiento aparecen hallazgos clínicos no visibles al momento del diagnóstico. Todo cambio será informado y presupuestado antes de ejecutarse.',
    'El presupuesto no constituye un documento tributario. La boleta electrónica se emite al momento del pago.',
    ...(notas ? [notas] : []),
  ];

  const altoCaja = 8 + condiciones.length * 7;
  if (y + altoCaja > g.pieY - 40) { doc.addPage(); y = g.margen.arriba + 18; }

  doc.setFillColor(...C.canvas);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(g.izq, y, g.util, altoCaja, 2, 2, 'FD');

  texto(doc, 'Condiciones', g.izq + 5, y + 6, { size: T.etiqueta, estilo: 'bold' });
  condiciones.forEach((c, i) => {
    texto(doc, `${i + 1}. ${c}`, g.izq + 5, y + 12 + i * 7, {
      size: T.etiqueta, color: C.muted, maxWidth: g.util - 10,
    });
  });

  y += altoCaja + 10;

  y = dibujarFirmas(doc, g, y, [
    { titulo: 'Firma del profesional', esProfesional: true },
    { titulo: 'Firma del paciente o apoderado' },
  ], { config });

  return y;
}

export function presupuesto(payload) {
  const { doc, g } = crearDocumento({ formato: payload.formato });
  construirPresupuesto({ doc, g, ...payload });
  return { doc, g };
}
