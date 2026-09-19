// src/pdf/documents/prescription.js
import autoTable from 'jspdf-autotable';
import { C, T, FUENTE } from '../theme.js';
import { crearDocumento, dibujarMembrete, cajaPaciente, dibujarFirmas, texto, fecha } from '../layout.js';

/**
 * Receta odontológica.
 *
 * Marco vigente a septiembre de 2026:
 *  - Código Sanitario art. 100 y 101: la receta profesional puede extenderse en
 *    documento gráfico o electrónico. La receta en papel sigue plenamente válida.
 *  - Sistema Nacional de Receta Electrónica (SNRE): para quien prescribe su uso
 *    es voluntario en esta etapa; la obligatoriedad gradual apunta a la
 *    dispensación en farmacias. Los sistemas privados acreditados pueden
 *    interoperar con el SNRE por HL7 FHIR, que es el camino natural si más
 *    adelante se quiere foliar dentro del repositorio central.
 *  - Estupefacientes y psicotrópicos (D.S. 404 y 405 de 1984) exigen receta
 *    retenida o cheque en formularios controlados. Este documento NO sirve para
 *    esos productos y lo advierte en el pie, para que nadie lo use por error.
 */
export function construirReceta({ doc, g, paciente, medicamentos = [], config, folio, opciones = {} }) {
  const { indicacionesGenerales, diagnostico } = opciones;

  let y = dibujarMembrete(doc, g, config, { titulo: 'Receta', folio });
  y = cajaPaciente(doc, g, paciente, y, { compacta: true });

  if (diagnostico) {
    texto(doc, 'Diagnóstico', g.izq, y + 1, { size: T.etiqueta, estilo: 'bold', color: C.muted });
    texto(doc, diagnostico, g.izq, y + 6, { size: T.cuerpo, maxWidth: g.util });
    y += 13;
  }

  // Símbolo Rx
  doc.setFont('times', 'italic');
  doc.setFontSize(22);
  doc.setTextColor(...C.accent);
  doc.text('Rx', g.izq, y + 8);

  autoTable(doc, {
    startY: y + 12,
    margin: { left: g.izq, right: g.izq },
    head: [['Producto y presentación', 'Cantidad', 'Indicaciones y posología']],
    body: medicamentos.map(m => [
      (m.name || '').toUpperCase(),
      m.quantity || m.cantidad || '—',
      m.dosage || m.indicaciones || '',
    ]),
    theme: 'grid',
    styles: { font: FUENTE, fontSize: T.cuerpo, cellPadding: 3.4, lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
    headStyles: { fillColor: C.accent, textColor: C.white, fontStyle: 'bold', fontSize: T.etiqueta, halign: 'left' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 62 },
      1: { halign: 'center', cellWidth: 22 },
      2: { cellWidth: 'auto' },
    },
    rowPageBreak: 'avoid',
  });

  y = doc.lastAutoTable.finalY + 8;

  if (indicacionesGenerales) {
    doc.setFillColor(...C.skySoft);
    doc.setDrawColor(...C.line);
    const alto = 10 + Math.ceil(indicacionesGenerales.length / 110) * 5;
    if (y + alto > g.pieY - 45) { doc.addPage(); y = g.margen.arriba + 18; }
    doc.roundedRect(g.izq, y, g.util, alto, 2, 2, 'FD');
    texto(doc, 'Indicaciones generales', g.izq + 5, y + 5.5, { size: T.etiqueta, estilo: 'bold' });
    texto(doc, indicacionesGenerales, g.izq + 5, y + 10.5, { size: T.etiqueta, color: C.muted, maxWidth: g.util - 10 });
    y += alto + 8;
  }

  y = dibujarFirmas(doc, g, Math.max(y, g.pieY - 55), [
    { titulo: 'Firma y timbre del profesional', esProfesional: true },
  ], { config, alto: 34 });

  texto(doc, `Fecha de emisión: ${fecha()}`, g.izq, y, { size: T.etiqueta, color: C.muted });
  texto(
    doc,
    'Esta receta no es válida para estupefacientes ni psicotrópicos, que requieren receta retenida o cheque en formulario controlado.',
    g.izq, y + 5,
    { size: T.pie, color: C.muted, maxWidth: g.util },
  );

  return y + 12;
}

export function receta(payload) {
  const { doc, g } = crearDocumento({ formato: payload.formato });
  construirReceta({ doc, g, ...payload });
  return { doc, g };
}
