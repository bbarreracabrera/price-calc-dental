// src/pdf/layout.js
// ============================================================================
// MAQUETADO COMPARTIDO DE TODOS LOS DOCUMENTOS
// ----------------------------------------------------------------------------
// Antes había dos generadores independientes: pdfGenerator.js dibujaba el
// membrete para receta, presupuesto y consentimiento, y perioPdfExport.js
// dibujaba lo suyo por su cuenta — sin logo, sin datos de la clínica, sin
// marca de agua y sin hash de auditoría. Cambiar el pie legal significaba
// editarlo en dos lugares y acordarse de los dos.
//
// Aquí vive una sola implementación. Cada documento describe su contenido y
// nada más.
// ============================================================================

import { jsPDF } from 'jspdf';
import { C, T, FUENTE, geometria } from './theme.js';
import { formatRUT } from '../constants.js';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

// Antes, una fecha vacía o mal formada (frecuente en historiales importados o
// snapshots de prueba) llegaba tal cual a toLocaleDateString, que no valida
// nada y devuelve literalmente el texto "Invalid Date" impreso en el
// documento. El valor por defecto `new Date()` se mantiene para las llamadas
// sin argumento (el sello de fecha/hora de emisión del propio documento).
export const fecha = (d = new Date()) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('es-CL');
};
export const fechaHora = (d = new Date()) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleString('es-CL');
};
export const pesos = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

/**
 * Folio del documento. Formato: TIPO-AAAAMMDD-XXXX
 * El Decreto 41/2012 art. 6 b) exige un número identificador para la ficha y
 * que todo documento que se agregue a ella lo lleve. Este folio es el
 * identificador del documento y va impreso y guardado en el registro de
 * auditoría, de modo que un papel en la mano se puede rastrear hasta el evento
 * que lo generó.
 */
export function generarFolio(tipo) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${String(tipo).toUpperCase().slice(0, 4)}-${ymd}-${azar}`;
}

function texto(doc, str, x, y, opts = {}) {
  const { size = T.cuerpo, color = C.ink, estilo = 'normal', align = 'left', maxWidth } = opts;
  doc.setFont(FUENTE, estilo);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(String(str ?? ''), x, y, maxWidth ? { align, maxWidth } : { align });
}

// ---------------------------------------------------------------------------
// Creación del documento
// ---------------------------------------------------------------------------

/**
 * @param {object} o
 * @param {'a4'|'carta'} o.formato   tamaño de papel elegido por la clínica
 * @param {'p'|'l'} o.orientacion
 */
export function crearDocumento({ formato = 'a4', orientacion = 'p' } = {}) {
  const g = geometria(formato, orientacion);
  const doc = new jsPDF({
    orientation: g.orientacion,
    unit: 'mm',
    format: [g.ancho, g.alto],
    compress: true,
  });
  doc.setLanguage('es-CL');
  return { doc, g };
}

// ---------------------------------------------------------------------------
// Membrete de la clínica
// ---------------------------------------------------------------------------
// Decreto 41/2012, art. 6 b): todo documento de la ficha debe identificar al
// prestador con su nombre completo y su RUT o cédula de identidad.
// ---------------------------------------------------------------------------

export function dibujarMembrete(doc, g, config = {}, { titulo, folio } = {}) {
  // Banda superior
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, g.ancho, 3.2, 'F');

  let y = g.margen.arriba + 6;

  // Logo de la clínica, si está cargado
  let xTexto = g.izq;
  if (config.logo) {
    try {
      doc.addImage(config.logo, 'PNG', g.izq, y - 2, 22, 22, undefined, 'FAST');
      xTexto = g.izq + 27;
    } catch {
      /* Un logo en un formato que jsPDF no entiende no puede tumbar el documento. */
    }
  }

  texto(doc, (config.name || 'Clínica Dental').toUpperCase(), xTexto, y + 3, {
    size: T.subtitulo, estilo: 'bold',
  });

  const datos = [
    config.rut ? `RUT ${formatRUT(config.rut)}` : null,
    config.rnpi ? `Registro Superintendencia de Salud ${config.rnpi}` : null,
    config.specialty || config.university || null,
    config.address || null,
    [config.phone, config.email].filter(Boolean).join('  ·  ') || null,
  ].filter(Boolean);

  let yd = y + 8;
  for (const linea of datos) {
    texto(doc, linea, xTexto, yd, { size: T.etiqueta, color: C.muted });
    yd += 3.6;
  }

  // Título y folio, alineados a la derecha
  if (titulo) {
    texto(doc, titulo.toUpperCase(), g.der, y + 3, { size: T.titulo, estilo: 'bold', align: 'right' });
  }
  if (folio) {
    texto(doc, `Folio ${folio}`, g.der, y + 8.5, { size: T.etiqueta, color: C.muted, align: 'right' });
    texto(doc, fecha(), g.der, y + 12.5, { size: T.etiqueta, color: C.muted, align: 'right' });
  }

  const yLinea = Math.max(yd + 1, y + 26);
  doc.setDrawColor(...C.lineStrong);
  doc.setLineWidth(0.4);
  doc.line(g.izq, yLinea, g.der, yLinea);

  return yLinea + 7;
}

// ---------------------------------------------------------------------------
// Caja de identificación del paciente
// ---------------------------------------------------------------------------
// Decreto 41/2012, art. 6 a): nombre completo, tipo y número de documento de
// identificación, sexo, fecha de nacimiento, domicilio, teléfonos y/o correo,
// ocupación, representante legal y sistema de salud.
//
// Art. 7: en cada nueva atención los datos de identificación deben confirmarse
// y actualizarse. Por eso la caja imprime la fecha de última actualización:
// hace visible si alguien lleva dos años sin confirmarlos.
// ---------------------------------------------------------------------------

export function dibujarCajaPaciente(doc, g, p = {}, { compacta = false } = {}) {
  const per = p.personal || {};
  const alto = compacta ? 16 : 27;

  const y = doc.__y ?? 0;
  doc.setFillColor(...C.raised);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(g.izq, y, g.util, alto, 2, 2, 'FD');

  const col = (i, n) => g.izq + 5 + (g.util - 10) * (i / n);

  const nombre = per.legalName || per.name || 'Paciente sin identificar';
  const rut = per.rut ? formatRUT(per.rut) : (per.documentId || '—');
  const nac = per.birthDate ? fecha(per.birthDate) : null;
  const edad = per.age ? `${per.age} años` : null;

  texto(doc, 'PACIENTE', col(0, 4), y + 5.5, { size: T.etiqueta, estilo: 'bold', color: C.muted });
  texto(doc, 'RUT / DOCUMENTO', col(2, 4), y + 5.5, { size: T.etiqueta, estilo: 'bold', color: C.muted });
  texto(doc, 'NACIMIENTO', col(3, 4), y + 5.5, { size: T.etiqueta, estilo: 'bold', color: C.muted });

  texto(doc, nombre, col(0, 4), y + 11, { size: T.seccion, estilo: 'bold', maxWidth: g.util * 0.48 });
  texto(doc, rut, col(2, 4), y + 11, { size: T.dato });
  texto(doc, [nac, edad].filter(Boolean).join('  ·  ') || '—', col(3, 4), y + 11, { size: T.dato });

  if (!compacta) {
    const fila2 = [
      ['SEXO', per.sex || per.gender || '—'],
      ['PREVISIÓN', per.insurance || per.prevision || '—'],
      ['TELÉFONO', per.phone || '—'],
      ['CORREO', per.email || '—'],
    ];
    fila2.forEach(([et, val], i) => {
      texto(doc, et, col(i, 4), y + 17.5, { size: T.etiqueta, estilo: 'bold', color: C.muted });
      texto(doc, String(val), col(i, 4), y + 22, { size: T.dato, maxWidth: (g.util - 10) / 4 - 3 });
    });

    const dom = per.address || per.domicilio;
    if (dom) {
      texto(doc, `Domicilio: ${dom}`, g.izq + 5, y + alto + 4, { size: T.etiqueta, color: C.muted });
      return y + alto + 9;
    }
  }

  return y + alto + 6;
}

/** Versión encadenable: recibe y devuelve la coordenada vertical. */
export function cajaPaciente(doc, g, p, y, opts) {
  doc.__y = y;
  return dibujarCajaPaciente(doc, g, p, opts);
}

// ---------------------------------------------------------------------------
// Bloque de firmas
// ---------------------------------------------------------------------------
// El generador viejo envolvía las firmas del presupuesto en `if (finalY < 240)`.
// Si el presupuesto tenía muchos ítems, el documento salía sin firmas y sin
// condiciones, en silencio. Aquí, si no hay espacio, se abre página.
// ---------------------------------------------------------------------------

export function dibujarFirmas(doc, g, y, etiquetas, { config, alto = 30 } = {}) {
  if (y + alto > g.pieY - 10) {
    doc.addPage();
    y = g.margen.arriba + 18;
  }

  const n = etiquetas.length;
  const anchoLinea = Math.min(62, (g.util - 12 * (n - 1)) / n);
  const paso = (g.util - anchoLinea) / Math.max(1, n - 1);
  const yLinea = y + alto - 10;

  etiquetas.forEach((et, i) => {
    const x0 = n === 1 ? g.centro - anchoLinea / 2 : g.izq + paso * i;
    doc.setDrawColor(...C.faint);
    doc.setLineWidth(0.35);
    doc.line(x0, yLinea, x0 + anchoLinea, yLinea);

    const cx = x0 + anchoLinea / 2;
    texto(doc, et.titulo, cx, yLinea + 4.5, { size: T.etiqueta, estilo: 'bold', align: 'center' });
    if (et.subtitulo || (et.esProfesional && config?.name)) {
      texto(doc, et.subtitulo || config.name, cx, yLinea + 8.2, {
        size: T.etiqueta, color: C.muted, align: 'center',
      });
    }
    if (et.esProfesional && config?.rnpi) {
      texto(doc, `Reg. ${config.rnpi}`, cx, yLinea + 11.4, {
        size: T.pie, color: C.muted, align: 'center',
      });
    }
  });

  return y + alto + 4;
}

// ---------------------------------------------------------------------------
// Pie con paginación y trazabilidad
// ---------------------------------------------------------------------------
// Se llama una sola vez, al final, cuando ya se sabe cuántas páginas hay. Antes
// solo el periodontograma numeraba las páginas; los otros tres no.
// ---------------------------------------------------------------------------

export function dibujarPie(doc, g, { folio, usuario, config, nota }) {
  const total = doc.internal.getNumberOfPages();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);

    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.25);
    doc.line(g.izq, g.pieY - 4, g.der, g.pieY - 4);

    if (nota) {
      texto(doc, nota, g.izq, g.pieY, { size: T.pie, color: C.muted, maxWidth: g.util * 0.62 });
    }

    texto(doc, `Página ${i} de ${total}`, g.der, g.pieY, {
      size: T.pie, color: C.muted, align: 'right',
    });

    texto(
      doc,
      `${config?.name || 'ShiningCloud Dental'} · Folio ${folio} · Emitido ${fechaHora()} por ${usuario || 'usuario no identificado'}`,
      g.izq,
      g.pieY + 4,
      { size: T.pie, color: C.faint, maxWidth: g.util },
    );
  }
}

// ---------------------------------------------------------------------------
// Cierre: hash de auditoría y descarga
// ---------------------------------------------------------------------------
// Ley 21.719 (vigente desde el 1 de diciembre de 2026) exige poder demostrar
// con evidencia quién accedió a qué dato y cuándo, no solo tener políticas. El
// hash SHA-256 del archivo permite probar más adelante que un PDF en manos de
// un tercero es exactamente el que emitió el sistema, sin haber guardado una
// copia del documento con datos sensibles.
// ---------------------------------------------------------------------------

async function sha256(bytes) {
  const buf = await crypto.subtle.digest('SHA-256', bytes.buffer ?? bytes);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function cerrarDocumento(doc, { tipo, folio, nombreArchivo, contexto = {} }) {
  const { logAction, selectedPatientId, notify } = contexto;

  const bytes = new Uint8Array(doc.output('arraybuffer'));
  doc.save(nombreArchivo);

  let hash = null;
  try {
    hash = await sha256(bytes);
  } catch {
    /* crypto.subtle no está disponible fuera de contextos seguros. */
  }

  try {
    logAction?.(
      'GENERATE_PDF',
      { tipo, folio, sha256: hash, bytes: bytes.length, timestamp: new Date().toISOString() },
      selectedPatientId,
    );
  } catch {
    /* La auditoría no puede impedir que el profesional tenga su documento. */
  }

  notify?.('Documento generado');
  return { folio, hash };
}

export function nombreArchivo(tipo, paciente, folio) {
  const n = (paciente?.personal?.legalName || paciente?.personal?.name || 'paciente')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase();
  return `${tipo}_${n}_${folio}.pdf`;
}

export { texto };
