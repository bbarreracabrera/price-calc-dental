// src/pdf/documents/consent.js
import { C, T } from '../theme.js';
import { crearDocumento, dibujarMembrete, texto, fechaHora } from '../layout.js';
import { NOTA_LEGAL_CONSENTIMIENTO } from '../../constants.js';

/**
 * Consentimiento informado.
 *
 *  - Ley 20.584 art. 14 y Decreto 38/2012: el consentimiento se expresa por
 *    escrito cuando se trata de intervenciones quirúrgicas, procedimientos
 *    invasivos o los que puedan afectar significativamente la condición de
 *    salud. Debe quedar constancia en la ficha.
 *  - Decreto 41/2012 art. 6 letra d): las decisiones adoptadas por el paciente,
 *    incluidos los consentimientos y los rechazos de tratamiento, son contenido
 *    mínimo obligatorio de la ficha clínica.
 *  - Ley 19.799: la firma electrónica simple es válida entre las partes. Por eso
 *    el documento imprime la marca de tiempo, la IP y el hash del acto de firma:
 *    sin esa evidencia la firma en pantalla no prueba nada.
 */
export function construirConsentimiento({ doc, g, paciente, consentimiento = {}, config, folio }) {
  const titulo = consentimiento.type || consentimiento.title || 'Consentimiento informado';

  let y = dibujarMembrete(doc, g, config, { titulo: 'Consentimiento', folio });
  y = dibujarCajaPaciente(doc, g, paciente, y);

  texto(doc, titulo.toUpperCase(), g.centro, y + 4, { size: T.subtitulo, estilo: 'bold', align: 'center' });
  y += 12;

  // Cuerpo justificado con salto de página real: el generador viejo estimaba la
  // altura con una constante de 5 mm por línea y abría página solo si superaba
  // 230, así que un texto largo se salía de la hoja.
  const lineas = doc.splitTextToSize(consentimiento.text || '', g.util - 6);
  const alturaLinea = 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(T.cuerpo);
  doc.setTextColor(...C.ink);

  for (const linea of lineas) {
    if (y > g.pieY - 55) {
      doc.addPage();
      doc.setFillColor(...C.accent);
      doc.rect(0, 0, g.ancho, 3.2, 'F');
      y = g.margen.arriba + 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(T.cuerpo);
      doc.setTextColor(...C.ink);
    }
    doc.text(linea, g.izq + 3, y);
    y += alturaLinea;
  }

  y += 8;
  if (y > g.pieY - 58) { doc.addPage(); y = g.margen.arriba + 14; }

  // --- Firma ---
  // La firma se escala respetando su relación de aspecto, con tope de 70x28 mm,
  // y queda centrada horizontalmente. El tamaño fijo anterior estiraba las
  // imágenes que no eran exactamente 2.5:1.
  if (consentimiento.signature) {
    try {
      const cap = doc.getImageProperties(consentimiento.signature);
      const escala = Math.min(70 / cap.width, 28 / cap.height);
      const ancho = cap.width * escala;
      const alto = cap.height * escala;
      doc.addImage(consentimiento.signature, 'PNG', g.centro - ancho / 2, y, ancho, alto, undefined, 'FAST');
    } catch { /* firma ilegible: se imprime la línea vacía igual */ }
  }
  const yLinea = y + 30;
  doc.setDrawColor(...C.faint);
  doc.setLineWidth(0.35);
  doc.line(g.centro - 35, yLinea, g.centro + 35, yLinea);
  texto(doc, 'Firma del paciente o representante legal', g.centro, yLinea + 4.5, {
    size: T.etiqueta, estilo: 'bold', align: 'center',
  });
  if (consentimiento.signed_by) {
    texto(doc, consentimiento.signed_by, g.centro, yLinea + 8.5, { size: T.etiqueta, color: C.muted, align: 'center' });
  }

  y = yLinea + 16;

  // --- Metadatos de la firma electrónica ---
  const meta = [
    consentimiento.signed_at ? `Firmado el ${fechaHora(consentimiento.signed_at)}` : null,
    consentimiento.ip_address && consentimiento.ip_address !== 'no_disponible'
      ? `Dirección IP ${consentimiento.ip_address}` : null,
    consentimiento.hash ? `Hash del acto: ${consentimiento.hash}` : null,
  ].filter(Boolean);

  if (meta.length) {
    const alto = 8 + meta.length * 4.4;
    if (y + alto > g.pieY - 14) { doc.addPage(); y = g.margen.arriba + 14; }
    doc.setFillColor(...C.canvas);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.roundedRect(g.izq, y, g.util, alto, 1.5, 1.5, 'FD');
    texto(doc, 'Evidencia de la firma electrónica', g.izq + 4, y + 5, { size: T.pie, estilo: 'bold', color: C.muted });
    meta.forEach((m, i) => texto(doc, m, g.izq + 4, y + 9.5 + i * 4.4, { size: T.pie, color: C.muted, maxWidth: g.util - 8 }));
    y += alto + 5;
  }

  // La nota legal se imprime completa y con espacio verificado: si no alcanza
  // antes del pie se abre página, igual que en los bloques anteriores del
  // documento. Un salto aquí también exige reimprimir el membrete (banda de
  // acento y línea de folio) para que la hoja nueva se identifique sola.
  const altoNota = doc.splitTextToSize(NOTA_LEGAL_CONSENTIMIENTO, g.util).length * 3.2 + 4;
  if (y + altoNota > g.pieY - 10) {
    doc.addPage();
    doc.setFillColor(...C.accent);
    doc.rect(0, 0, g.ancho, 3.2, 'F');
    y = g.margen.arriba + 14;
  }
  texto(doc, NOTA_LEGAL_CONSENTIMIENTO, g.izq, y + 2, { size: T.pie, color: C.faint, maxWidth: g.util });

  return y + altoNota + 4;
}

export function consentimiento(payload) {
  const { doc, g } = crearDocumento({ formato: payload.formato });
  construirConsentimiento({ doc, g, ...payload });
  return { doc, g };
}
