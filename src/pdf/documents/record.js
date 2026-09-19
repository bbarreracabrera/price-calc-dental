// src/pdf/documents/record.js
import autoTable from 'jspdf-autotable';
import { C, T, FUENTE } from '../theme.js';
import { crearDocumento, dibujarMembrete, cajaPaciente, texto, fecha, fechaHora } from '../layout.js';
import { CONDICIONES_MEDICAS, formatRUT } from '../../constants.js';

/**
 * FICHA CLÍNICA IMPRIMIBLE
 *
 * Este documento no existía. Es el que el paciente tiene derecho a pedir y el
 * prestador está obligado a entregar.
 *
 * Fuente normativa — Decreto 41 de 2012 del Ministerio de Salud, que aprueba el
 * Reglamento sobre Fichas Clínicas:
 *
 *   Art. 5   La ficha debe ser clara y legible, con estructura ordenada y
 *            secuencial. De ahí el orden fijo de las secciones de abajo.
 *
 *   Art. 6 a) Identificación actualizada: nombre completo, tipo y número de
 *            documento, sexo, fecha de nacimiento, domicilio, teléfonos y/o
 *            correo, ocupación, representante legal y sistema de salud.
 *
 *   Art. 6 b) Número identificador de la ficha, fecha de creación, nombre
 *            completo del prestador y su RUT o cédula de identidad.
 *
 *   Art. 6 c) Registro cronológico y fechado de TODAS las atenciones:
 *            anamnesis, evoluciones, indicaciones, procedimientos, resultados
 *            de exámenes, interconsultas y derivaciones.
 *
 *   Art. 6 c) inciso 2: cada documento agregado a la ficha debe llevar el
 *            número de la ficha. Por eso el número va impreso en cada página.
 *
 *   Art. 6 d) Decisiones del paciente: consentimientos, rechazos de tratamiento.
 *
 *   Art. 11  Conservación mínima de quince años desde el último ingreso de
 *            información.
 *
 * Art. 2: el contenido de la ficha es dato sensible. La entrega está limitada
 * al titular, su representante legal o herederos, a terceros con poder notarial
 * simple, a los tribunales y al Ministerio Público con autorización judicial
 * (art. 10). El pie del documento lo deja escrito.
 */

const ENTREGA_LEGAL =
  'Documento con datos sensibles. Conforme al artículo 10 del Decreto 41 de 2012 del Ministerio de Salud, ' +
  'solo puede entregarse al titular, a su representante legal o a sus herederos, a terceros con poder notarial ' +
  'simple del titular, a los tribunales de justicia en causas que estén conociendo, y a los fiscales del ' +
  'Ministerio Público o abogados defensores con autorización del juez competente.';

// Los estados se guardan en inglés en la base. Un documento que el paciente
// puede pedir y llevarse tiene que estar en castellano.
const ESTADO_PIEZA = {
  missing: 'Ausente', implant: 'Implante', caries: 'Caries', restored: 'Restaurada',
  crown: 'Corona', endo: 'Tratada endodónticamente', extract: 'Indicada para extracción',
  sealant: 'Sellante', fracture: 'Fractura', bridge: 'Pilar de puente',
  retained: 'Retenida', erupting: 'En erupción', healthy: 'Sana',
};
const traducirEstado = (st) => (Array.isArray(st) ? st : [st])
  .filter(Boolean)
  .map(x => ESTADO_PIEZA[x] || String(x))
  .join(', ');

function seccion(doc, g, y, titulo) {
  if (y > g.pieY - 30) { doc.addPage(); y = g.margen.arriba + 16; }
  doc.setFillColor(...C.accentSoft);
  doc.roundedRect(g.izq, y, g.util, 7.5, 1.5, 1.5, 'F');
  texto(doc, titulo.toUpperCase(), g.izq + 4, y + 5.2, { size: T.etiqueta, estilo: 'bold' });
  return y + 12;
}

export function construirFichaClinica({ doc, g, paciente, config, folio, opciones = {} }) {
  const { incluirEvoluciones = true, incluirConsentimientos = true, incluirPresupuestos = true } = opciones;
  const p = paciente || {};
  const numeroFicha = p.id || folio;

  let y = dibujarMembrete(doc, g, config, { titulo: 'Ficha clínica', folio });

  // El número de ficha va en el encabezado de cada página (art. 6 c), así que
  // aquí solo se informa la fecha de creación (art. 6 b).
  if (p.createdAt || p.created_at) {
    texto(doc, `Ficha creada el ${fecha(p.createdAt || p.created_at)}`, g.izq, y - 1, {
      size: T.etiqueta, color: C.muted,
    });
    y += 3;
  }

  // --- Art. 6 a) Identificación -------------------------------------------
  y = cajaPaciente(doc, g, p, y);

  const per = p.personal || {};
  const extra = [
    ['Ocupación', per.occupation || per.ocupacion || '—'],
    ['Representante legal', per.guardian || per.apoderado || '—'],
    ['Contacto de emergencia', per.emergencyContact || '—'],
  ];
  autoTable(doc, {
    startY: y - 2,
    margin: { left: g.izq, right: g.izq },
    body: extra,
    theme: 'plain',
    styles: { font: FUENTE, fontSize: T.etiqueta, cellPadding: 1.4, textColor: C.muted },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 44, textColor: C.ink }, 1: { cellWidth: 'auto' } },
  });
  y = doc.lastAutoTable.finalY + 6;

  // --- Antecedentes médicos ------------------------------------------------
  y = seccion(doc, g, y, 'Antecedentes médicos');

  const cond = p.anamnesis?.conditions || {};
  const detalles = p.anamnesis?.details || {};
  const activas = CONDICIONES_MEDICAS.filter(c => cond[c.id]);

  if (activas.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: g.izq, right: g.izq },
      head: [['Condición', 'Nivel', 'Detalle registrado']],
      body: activas.map(c => [
        c.label,
        c.nivel === 'critica' ? 'Crítico' : c.nivel === 'alta' ? 'Precaución' : 'Contexto',
        detalles[c.id] || (c.pideDetalle ? 'SIN DETALLE REGISTRADO' : '—'),
      ]),
      theme: 'grid',
      styles: { font: FUENTE, fontSize: T.dato, cellPadding: 2.2, lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
      headStyles: { fillColor: C.muted, textColor: C.white, fontSize: T.etiqueta, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 46, fontStyle: 'bold' }, 1: { cellWidth: 26, halign: 'center' }, 2: { cellWidth: 'auto' } },
      didParseCell: (d) => {
        if (d.section === 'body' && d.column.index === 1) {
          const nivel = activas[d.row.index]?.nivel;
          if (nivel === 'critica') { d.cell.styles.textColor = C.danger; d.cell.styles.fontStyle = 'bold'; }
          if (nivel === 'alta') { d.cell.styles.textColor = C.warn; d.cell.styles.fontStyle = 'bold'; }
        }
        if (d.section === 'body' && d.column.index === 2 && String(d.cell.raw).startsWith('SIN DETALLE')) {
          d.cell.styles.textColor = C.danger;
        }
      },
    });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    texto(doc, 'Sin antecedentes médicos declarados.', g.izq + 2, y, { size: T.dato, color: C.muted });
    y += 8;
  }

  if (p.anamnesis?.notes) {
    texto(doc, p.anamnesis.notes, g.izq + 2, y, { size: T.dato, color: C.ink, maxWidth: g.util - 4 });
    y += 10;
  }

  // --- Odontograma: hallazgos por pieza ------------------------------------
  const dientes = p.clinical?.teeth || {};
  const conHallazgo = Object.entries(dientes).filter(([, v]) => {
    const st = v?.status;
    return Array.isArray(st) ? st.length : !!st;
  });

  if (conHallazgo.length) {
    y = seccion(doc, g, y, 'Odontograma — hallazgos registrados');
    autoTable(doc, {
      startY: y,
      margin: { left: g.izq, right: g.izq },
      head: [['Pieza', 'Estado', 'Caras', 'Observación']],
      body: conHallazgo
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([n, v]) => [
          n,
          traducirEstado(v.status),
          Array.isArray(v.faces) ? v.faces.join(', ') : (v.faces || '—'),
          v.note || v.observacion || '—',
        ]),
      theme: 'grid',
      styles: { font: FUENTE, fontSize: T.dato, cellPadding: 2, lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
      headStyles: { fillColor: C.muted, textColor: C.white, fontSize: T.etiqueta, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 46 }, 2: { cellWidth: 30 } },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // --- Art. 6 c) Registro cronológico --------------------------------------
  if (incluirEvoluciones) {
    const evos = [...(p.clinical?.evolutions || p.evolutions || [])]
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    y = seccion(doc, g, y, 'Registro cronológico de atenciones');

    if (evos.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: g.izq, right: g.izq },
        head: [['Fecha', 'Profesional', 'Registro']],
        body: evos.map(e => [
          e.date ? fecha(e.date) : '—',
          e.author || e.professional || e.created_by || '—',
          e.text || e.content || '',
        ]),
        theme: 'grid',
        styles: {
          font: FUENTE, fontSize: T.dato, cellPadding: 2.4,
          lineColor: C.line, lineWidth: 0.2, textColor: C.ink, valign: 'top',
        },
        headStyles: { fillColor: C.accent, textColor: C.white, fontSize: T.etiqueta, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: C.canvas },
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 40 }, 2: { cellWidth: 'auto' } },
        rowPageBreak: 'auto',
      });
      y = doc.lastAutoTable.finalY + 6;
    } else {
      texto(doc, 'Sin evoluciones registradas.', g.izq + 2, y, { size: T.dato, color: C.muted });
      y += 8;
    }
  }

  // --- Art. 6 d) Decisiones del paciente -----------------------------------
  if (incluirConsentimientos) {
    const consents = p.consents || [];
    y = seccion(doc, g, y, 'Decisiones del paciente');
    if (consents.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: g.izq, right: g.izq },
        head: [['Documento', 'Firmado', 'Firmante', 'Hash']],
        body: consents.map(c => [
          c.type || c.title || 'Consentimiento',
          c.signed_at ? fechaHora(c.signed_at) : 'Pendiente',
          c.signed_by || '—',
          c.hash ? String(c.hash).slice(0, 16) + '…' : '—',
        ]),
        theme: 'grid',
        styles: { font: FUENTE, fontSize: T.dato, cellPadding: 2, lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
        headStyles: { fillColor: C.muted, textColor: C.white, fontSize: T.etiqueta, fontStyle: 'bold' },
        columnStyles: { 3: { font: 'courier', fontSize: T.pie } },
      });
      y = doc.lastAutoTable.finalY + 6;
    } else {
      texto(doc, 'Sin consentimientos registrados.', g.izq + 2, y, { size: T.dato, color: C.muted });
      y += 8;
    }
  }

  // --- Presupuestos --------------------------------------------------------
  if (incluirPresupuestos && (p.clinical?.quotes || []).length) {
    y = seccion(doc, g, y, 'Planes de tratamiento presupuestados');
    autoTable(doc, {
      startY: y,
      margin: { left: g.izq, right: g.izq },
      head: [['Fecha', 'Estado', 'Prestaciones', 'Total']],
      body: p.clinical.quotes.map(q => [
        q.date ? fecha(q.date) : '—',
        q.status || '—',
        String((q.items || []).length),
        `$${Number(q.total || 0).toLocaleString('es-CL')}`,
      ]),
      theme: 'grid',
      styles: { font: FUENTE, fontSize: T.dato, cellPadding: 2, lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
      headStyles: { fillColor: C.muted, textColor: C.white, fontSize: T.etiqueta, fontStyle: 'bold' },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // --- Constancia de entrega -----------------------------------------------
  if (y > g.pieY - 42) { doc.addPage(); y = g.margen.arriba + 16; }
  doc.setFillColor(...C.sandSoft);
  doc.setDrawColor(...C.lineStrong);
  doc.setLineWidth(0.3);
  doc.roundedRect(g.izq, y, g.util, 30, 2, 2, 'FD');
  texto(doc, 'Constancia de entrega', g.izq + 4, y + 5.5, { size: T.etiqueta, estilo: 'bold' });
  texto(doc, ENTREGA_LEGAL, g.izq + 4, y + 10.5, { size: T.pie, color: C.muted, maxWidth: g.util - 8 });
  texto(
    doc,
    `Recibe: ______________________________   RUT: ______________   Fecha: ${fecha()}   Firma: ______________________`,
    g.izq + 4, y + 26,
    { size: T.pie, color: C.ink, maxWidth: g.util - 8 },
  );

  // Art. 6 c): cada documento agregado a la ficha lleva su número.
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    texto(doc, `Ficha N° ${numeroFicha}  ·  ${(p.personal?.legalName || '').toUpperCase()}  ·  ${per.rut ? formatRUT(per.rut) : ''}`,
      g.centro, g.margen.arriba - 4, { size: T.pie, color: C.faint, align: 'center' });
  }
  doc.setPage(total);

  return y + 36;
}

export function fichaClinica(payload) {
  const { doc, g } = crearDocumento({ formato: payload.formato });
  construirFichaClinica({ doc, g, ...payload });
  return { doc, g };
}
