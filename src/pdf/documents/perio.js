// src/pdf/documents/perio.js
import autoTable from 'jspdf-autotable';
import { C, T, FUENTE, GLIFOS, colorSondaje } from '../theme.js';
import { crearDocumento, dibujarMembrete, cajaPaciente, texto, fecha } from '../layout.js';

// ============================================================================
// PERIODONTOGRAMA
// ----------------------------------------------------------------------------
// Tres problemas del generador anterior, resueltos aquí:
//
// 1. Los datos del paciente nunca salían. Leía `patient.name` y `patient.rut`,
//    pero en el objeto real viven en `patient.personal.legalName` y
//    `patient.personal.rut`. El encabezado imprimía siempre "Paciente" y ningún
//    RUT. Ahora usa la misma caja de identificación que el resto de los
//    documentos, con el membrete de la clínica que antes tampoco tenía.
//
// 2. Las tablas no entraban. Dieciséis dientes por tres sitios son cuarenta y
//    ocho columnas; en A4 apaisado quedan unos 267 mm útiles, así que cada
//    celda medía poco más de cinco milímetros. Ahora cada arcada se dibuja por
//    hemiarcada: ocho dientes, veinticuatro columnas, más de diez milímetros
//    por celda. Son más páginas y se lee de verdad.
//
// 3. No había dibujo. Este archivo agrega el gráfico clásico de sondaje: la
//    silueta de cada pieza, la línea del margen gingival y la del fondo del
//    saco, con el área entre ambas rellena. Es la parte del periodontograma que
//    se lee de un vistazo, mientras que la tabla es para el dato exacto.
//
// CONVENCIÓN DE SIGNO (impresa también en la leyenda del documento, para que
// quien lo lea sepa cómo interpretarlo):
//   - La línea de referencia horizontal es el límite amelocementario, el cero.
//   - El margen gingival se dibuja por encima del cero con valores positivos y
//     por debajo cuando hay recesión, con valores negativos.
//   - El fondo del saco se ubica a la profundidad de sondaje medida en sentido
//     apical desde el margen gingival.
//   - El nivel de inserción clínico es la distancia del cero al fondo del saco.
// ============================================================================

const FILAS_COMPLETA = ['implante', 'movilidad', 'furca', 'sangrado', 'supuracion', 'mg', 'pd'];
const FILAS_SIMPLE   = ['pd', 'mg', 'sangrado', 'supuracion', 'furca', 'nota'];

const ETIQUETAS = {
  implante: 'Implante', movilidad: 'Movilidad', furca: 'Furca',
  sangrado: 'Sangrado', supuracion: 'Supuración',
  mg: 'Margen gingival', pd: 'Prof. sondaje', nota: 'Nota',
};

const FILAS_SITIO = ['mg', 'pd', 'sangrado', 'supuracion'];
const esFilaSitio = (f) => FILAS_SITIO.includes(f);

const fdi = (n) => `${Math.floor(n / 10)}.${n % 10}`;

function estadoPieza(p, n) {
  const st = p?.clinical?.teeth?.[n]?.status;
  return Array.isArray(st) ? st : (st ? [st] : []);
}
const ausente  = (p, n) => estadoPieza(p, n).includes('missing');
const implante = (p, n) => estadoPieza(p, n).includes('implant');

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------------------
// GRÁFICO DE SONDAJE
// ---------------------------------------------------------------------------

function dibujarGrafico(doc, g, { piezas, paciente, cara, x0, y0, ancho, alto }) {
  const ESCALA = 1.55;             // mm de papel por cada mm clínico
  const yCero = y0 + alto * 0.42;  // límite amelocementario
  const w = ancho / piezas.length;

  // Rejilla de referencia cada 3 mm
  doc.setLineWidth(0.15);
  for (let mm = -3; mm <= 12; mm += 3) {
    const y = yCero + mm * ESCALA;
    if (y < y0 || y > y0 + alto) continue;
    doc.setDrawColor(...(mm === 0 ? C.lineStrong : C.line));
    doc.setLineWidth(mm === 0 ? 0.35 : 0.12);
    doc.line(x0, y, x0 + ancho, y);
    texto(doc, `${mm}`, x0 - 2.5, y + 1, { size: 5, color: C.faint, align: 'right' });
  }

  const puntosMG = [];
  const puntosFondo = [];

  piezas.forEach((n, i) => {
    const xIni = x0 + i * w;
    const cx = xIni + w / 2;
    const perio = paciente?.clinical?.perio?.[n] || {};

    // --- Silueta de la pieza ---
    const anchoCorona = w * 0.62;
    const anchoCuello = w * 0.5;
    const xc = cx - anchoCorona / 2;

    if (ausente(paciente, n)) {
      doc.setDrawColor(...C.faint);
      doc.setLineWidth(0.5);
      doc.line(cx - 2.4, yCero - 5, cx + 2.4, yCero); // aspa
      doc.line(cx - 2.4, yCero, cx + 2.4, yCero - 5);
    } else {
      // Corona
      doc.setFillColor(...(implante(paciente, n) ? C.skySoft : C.raised));
      doc.setDrawColor(...C.lineStrong);
      doc.setLineWidth(0.25);
      doc.roundedRect(xc, yCero - 8.5, anchoCorona, 8.5, 1, 1, 'FD');
      // Raíz: trapecio simétrico que se afina hacia apical. Los tres segmentos
      // deben sumar cero en el eje X o el polígono queda inclinado al cerrarse.
      const largoRaiz = 13;
      doc.setFillColor(...C.canvas);
      doc.lines(
        [
          [anchoCuello, 0],                        // cuello, de mesial a distal
          [-anchoCuello * 0.35, largoRaiz],        // baja hacia apical
          [-anchoCuello * 0.30, 0],                // ápice
        ],
        cx - anchoCuello / 2, yCero, [1, 1], 'FD', true,
      );
      if (implante(paciente, n)) {
        texto(doc, GLIFOS.implante, cx, yCero + 5, { size: 5.5, estilo: 'bold', color: C.sky, align: 'center' });
      }
    }

    // --- Puntos de margen y fondo de saco ---
    // Una pieza ausente interrumpe las dos líneas en vez de dejar que crucen
    // por encima del espacio: así el gráfico no sugiere continuidad donde no
    // hay diente que sondear.
    if (ausente(paciente, n)) {
      puntosMG.push(null, null, null);
      puntosFondo.push(null, null, null);
      doc.setDrawColor(...C.line);
      doc.setLineWidth(0.1);
      doc.line(xIni, y0, xIni, y0 + alto);
      texto(doc, fdi(n), cx, y0 + alto + 3, { size: 6, estilo: 'bold', color: C.faint, align: 'center' });
      return;
    }

    [0, 1, 2].forEach((idx) => {
      const px = xIni + w * ((idx * 2 + 1) / 6);
      const mg = num((perio[`mg_${cara}`] || [])[idx]);
      const pd = num((perio[`pd_${cara}`] || [])[idx]);
      if (mg === null && pd === null) { puntosMG.push(null); puntosFondo.push(null); return; }

      const mgv = mg ?? 0;
      const yMG = yCero - mgv * ESCALA;
      const yFondo = yMG + (pd ?? 0) * ESCALA;

      puntosMG.push({ x: px, y: yMG });
      puntosFondo.push({ x: px, y: yFondo });

      // Marca de sangrado: punto relleno MÁS la letra, para que sobreviva a una
      // impresión en blanco y negro.
      const bop = (perio[`bop_${cara}`] || [])[idx];
      if (bop) {
        doc.setFillColor(...C.danger);
        doc.circle(px, yMG - 2.4, 0.75, 'F');
        texto(doc, GLIFOS.sangrado, px, yMG - 3.6, { size: 4.5, estilo: 'bold', color: C.danger, align: 'center' });
      }
      const pus = (perio[`pus_${cara}`] || [])[idx];
      if (pus) {
        texto(doc, GLIFOS.supuracion, px, yMG - 6.2, { size: 4.5, estilo: 'bold', color: C.warn, align: 'center' });
      }
    });

    // Separador vertical entre piezas
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.1);
    doc.line(xIni, y0, xIni, y0 + alto);

    texto(doc, fdi(n), cx, y0 + alto + 3, { size: 6, estilo: 'bold', color: C.muted, align: 'center' });
  });

  // --- Relleno del saco y las dos líneas ---
  const tramos = (puntos) => {
    const out = [];
    let actual = [];
    for (const p of puntos) {
      if (p) actual.push(p);
      else { if (actual.length > 1) out.push(actual); actual = []; }
    }
    if (actual.length > 1) out.push(actual);
    return out;
  };

  const tMG = tramos(puntosMG);
  const tFondo = tramos(puntosFondo);

  // Área entre margen y fondo
  doc.setFillColor(...C.roseSoft);
  for (let t = 0; t < Math.min(tMG.length, tFondo.length); t++) {
    const a = tMG[t], b = tFondo[t];
    if (a.length !== b.length) continue;
    const primeros = [...a, ...[...b].reverse()];
    const rel = primeros.slice(1).map((p, i) => [p.x - primeros[i].x, p.y - primeros[i].y]);
    doc.lines(rel, primeros[0].x, primeros[0].y, [1, 1], 'F', true);
  }

  const linea = (tramosArr, color, grosor) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(grosor);
    for (const t of tramosArr) {
      for (let i = 1; i < t.length; i++) doc.line(t[i - 1].x, t[i - 1].y, t[i].x, t[i].y);
      for (const p of t) { doc.setFillColor(...color); doc.circle(p.x, p.y, 0.45, 'F'); }
    }
  };

  linea(tMG, C.rose, 0.55);
  linea(tFondo, C.accent, 0.75);

  return y0 + alto + 5;
}

// ---------------------------------------------------------------------------
// TABLA DE UNA HEMIARCADA
// ---------------------------------------------------------------------------

function celdaSitio(fila, p, n, cara, idx) {
  const perio = p?.clinical?.perio?.[n] || {};
  if (ausente(p, n)) return { content: '', styles: { fillColor: C.raised } };

  if (fila === 'pd') {
    const raw = (perio[`pd_${cara}`] || [])[idx] ?? '';
    const color = colorSondaje(raw);
    return color
      ? { content: String(raw), styles: { textColor: color, fontStyle: 'bold' } }
      : { content: String(raw) };
  }
  if (fila === 'mg') return { content: String((perio[`mg_${cara}`] || [])[idx] ?? '') };
  if (fila === 'sangrado') {
    return (perio[`bop_${cara}`] || [])[idx]
      ? { content: GLIFOS.sangrado, styles: { textColor: C.danger, fontStyle: 'bold', fillColor: C.roseSoft } }
      : { content: '' };
  }
  if (fila === 'supuracion') {
    return (perio[`pus_${cara}`] || [])[idx]
      ? { content: GLIFOS.supuracion, styles: { textColor: C.warn, fontStyle: 'bold' } }
      : { content: '' };
  }
  return { content: '' };
}

function celdaPieza(fila, p, n) {
  if (ausente(p, n)) {
    return fila === 'implante'
      ? { content: GLIFOS.ausente, styles: { textColor: C.faint, fillColor: C.raised } }
      : { content: '', styles: { fillColor: C.raised } };
  }
  if (fila === 'implante') {
    return implante(p, n)
      ? { content: GLIFOS.implante, styles: { textColor: C.sky, fontStyle: 'bold', fillColor: C.skySoft } }
      : { content: '' };
  }
  if (fila === 'movilidad') {
    const v = p?.clinical?.perio?.[n]?.mobility || 0;
    return { content: v ? String(v) : '', styles: v >= 2 ? { textColor: C.danger, fontStyle: 'bold' } : {} };
  }
  if (fila === 'furca') {
    const v = p?.clinical?.perio?.[n]?.furcation || 0;
    return { content: v ? String(v) : '', styles: v >= 2 ? { textColor: C.danger, fontStyle: 'bold' } : {} };
  }
  if (fila === 'nota') return { content: p?.clinical?.perio?.[n]?.note || '' };
  return { content: '' };
}

function tablaHemiarcada(doc, g, { piezas, paciente, cara, filas, startY }) {
  const anchoEtiqueta = 24;
  const head = [[
    { content: '', styles: { fillColor: C.accent } },
    ...piezas.map(n => ({
      content: fdi(n),
      colSpan: 3,
      styles: { halign: 'center', fontStyle: 'bold', fontSize: T.etiqueta },
    })),
  ]];

  const body = filas.map(f => {
    const celdas = esFilaSitio(f)
      ? piezas.flatMap(n => [0, 1, 2].map(i => celdaSitio(f, paciente, n, cara, i)))
      : piezas.map(n => ({ ...celdaPieza(f, paciente, n), colSpan: 3 }));
    return [
      { content: ETIQUETAS[f], styles: { halign: 'left', fontStyle: 'bold', fontSize: 6, textColor: C.muted, fillColor: C.canvas } },
      ...celdas,
    ];
  });

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'grid',
    margin: { left: g.izq, right: g.izq },
    styles: {
      font: FUENTE, fontSize: T.grilla, cellPadding: 1.1,
      halign: 'center', valign: 'middle',
      lineColor: C.line, lineWidth: 0.15, textColor: C.ink,
    },
    headStyles: { fillColor: C.accent, textColor: C.white, cellPadding: 1.3 },
    columnStyles: { 0: { cellWidth: anchoEtiqueta } },
    tableWidth: g.util,
  });

  return doc.lastAutoTable.finalY;
}

// ---------------------------------------------------------------------------
// BLOQUE COMPLETO: gráfico + las dos caras de una hemiarcada
// ---------------------------------------------------------------------------

function bloqueHemiarcada(doc, g, { titulo, piezas, paciente, caraSuperior, filasSuperior, caraInferior, filasInferior }) {
  doc.addPage();
  let y = g.margen.arriba + 4;

  doc.setFillColor(...C.accent);
  doc.rect(0, 0, g.ancho, 2.4, 'F');

  texto(doc, titulo, g.izq, y + 4, { size: T.subtitulo, estilo: 'bold' });
  texto(doc, caraSuperior === 'v' ? 'Cara vestibular' : 'Cara palatina / lingual',
    g.der, y + 4, { size: T.etiqueta, color: C.muted, align: 'right' });
  y += 10;

  const anchoGrafico = g.util - 6;
  y = dibujarGrafico(doc, g, {
    piezas, paciente, cara: caraSuperior,
    x0: g.izq + 6, y0: y, ancho: anchoGrafico, alto: 34,
  });

  y = tablaHemiarcada(doc, g, { piezas, paciente, cara: caraSuperior, filas: filasSuperior, startY: y + 2 }) + 7;

  texto(doc, caraInferior === 'v' ? 'Cara vestibular' : 'Cara palatina / lingual',
    g.der, y - 2, { size: T.etiqueta, color: C.muted, align: 'right' });

  y = dibujarGrafico(doc, g, {
    piezas, paciente, cara: caraInferior,
    x0: g.izq + 6, y0: y, ancho: anchoGrafico, alto: 34,
  });

  y = tablaHemiarcada(doc, g, { piezas, paciente, cara: caraInferior, filas: filasInferior, startY: y + 2 });

  return y;
}

// ---------------------------------------------------------------------------
// DOCUMENTO
// ---------------------------------------------------------------------------

export function construirPeriodontograma({
  doc, g, paciente, stats = {}, config, folio,
  denticion = 'adulto',
  teethUpper = [], teethLower = [], teethUpperPed = [], teethLowerPed = [],
}) {
  // --- Portada con índices ---
  let y = dibujarMembrete(doc, g, config, { titulo: 'Periodontograma', folio });
  y = cajaPaciente(doc, g, paciente, y);

  const indices = [
    ['Sangrado al sondaje (BOP)', stats.bop != null ? `${stats.bop}%` : '—', 'Objetivo terapéutico: menos de 10%'],
    ["Índice de placa (O'Leary)", stats.plaque != null ? `${stats.plaque}%` : '—', 'Objetivo terapéutico: menos de 20%'],
    ['Nivel de inserción clínico promedio', stats.nic != null ? `${stats.nic} mm` : '—', 'Referencia de severidad'],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: g.izq, right: g.izq },
    head: [['Índice', 'Valor', 'Referencia']],
    body: indices,
    theme: 'grid',
    styles: { font: FUENTE, fontSize: T.dato, cellPadding: 2.8, lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
    headStyles: { fillColor: C.accent, textColor: C.white, fontSize: T.etiqueta, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 76, fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'center', fontStyle: 'bold', fontSize: T.seccion },
      2: { cellWidth: 'auto', textColor: C.muted },
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  // --- Leyenda: qué significa cada marca y cómo leer el gráfico ---
  const leyenda = [
    `${GLIFOS.sangrado} sangrado al sondaje    ${GLIFOS.supuracion} supuración    ${GLIFOS.implante} implante    ${GLIFOS.ausente} pieza ausente`,
    'Profundidad de sondaje: negro hasta 3 mm, ámbar de 4 a 5 mm, rojo desde 6 mm.',
    'En el gráfico, la línea horizontal marcada con 0 es el límite amelocementario. La línea rosada es el margen gingival y la verde es el fondo del saco; el área entre ambas es la profundidad de sondaje.',
    'Cada letra y cada color van acompañados de un símbolo distinto, de modo que el documento se lee igual impreso en blanco y negro.',
  ];
  doc.setFillColor(...C.canvas);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(g.izq, y, g.util, 8 + leyenda.length * 5, 2, 2, 'FD');
  texto(doc, 'Cómo leer este documento', g.izq + 4, y + 5.5, { size: T.etiqueta, estilo: 'bold' });
  leyenda.forEach((l, i) => texto(doc, l, g.izq + 4, y + 11 + i * 5, { size: T.pie, color: C.muted, maxWidth: g.util - 8 }));
  y += 12 + leyenda.length * 5;

  // --- Hemiarcadas ---
  const mitad = (arr) => [arr.slice(0, Math.ceil(arr.length / 2)), arr.slice(Math.ceil(arr.length / 2))];
  const incluyeAdulto = denticion === 'adulto' || denticion === 'mixto';
  const incluyePed = denticion === 'pediatrico' || denticion === 'mixto';

  const arcadas = [];
  if (incluyeAdulto && teethUpper.length) {
    const [der, izq] = mitad(teethUpper);
    arcadas.push(
      { titulo: 'Maxilar superior — hemiarcada derecha', piezas: der, arriba: 'v', abajo: 'l' },
      { titulo: 'Maxilar superior — hemiarcada izquierda', piezas: izq, arriba: 'v', abajo: 'l' },
    );
  }
  if (incluyePed && teethUpperPed.length) {
    const [der, izq] = mitad(teethUpperPed);
    arcadas.push(
      { titulo: 'Maxilar superior temporal — derecha', piezas: der, arriba: 'v', abajo: 'l' },
      { titulo: 'Maxilar superior temporal — izquierda', piezas: izq, arriba: 'v', abajo: 'l' },
    );
  }
  if (incluyeAdulto && teethLower.length) {
    const [der, izq] = mitad(teethLower);
    arcadas.push(
      { titulo: 'Mandíbula — hemiarcada derecha', piezas: der, arriba: 'v', abajo: 'l' },
      { titulo: 'Mandíbula — hemiarcada izquierda', piezas: izq, arriba: 'v', abajo: 'l' },
    );
  }
  if (incluyePed && teethLowerPed.length) {
    const [der, izq] = mitad(teethLowerPed);
    arcadas.push(
      { titulo: 'Mandíbula temporal — derecha', piezas: der, arriba: 'v', abajo: 'l' },
      { titulo: 'Mandíbula temporal — izquierda', piezas: izq, arriba: 'v', abajo: 'l' },
    );
  }

  for (const a of arcadas) {
    if (!a.piezas.length) continue;
    bloqueHemiarcada(doc, g, {
      titulo: a.titulo,
      piezas: a.piezas,
      paciente,
      caraSuperior: a.arriba, filasSuperior: FILAS_COMPLETA,
      caraInferior: a.abajo,  filasInferior: FILAS_SIMPLE,
    });
  }

  // --- Comparativa entre sesiones ---
  const historial = paciente?.clinical?.perioHistory || [];
  if (historial.length) {
    doc.addPage();
    doc.setFillColor(...C.accent);
    doc.rect(0, 0, g.ancho, 2.4, 'F');
    let yh = g.margen.arriba + 8;
    texto(doc, 'Evolución entre sesiones', g.izq, yh, { size: T.subtitulo, estilo: 'bold' });
    yh += 6;

    const orden = [...historial].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

    autoTable(doc, {
      startY: yh,
      margin: { left: g.izq, right: g.izq },
      head: [['Fecha', 'BOP', 'Placa', 'NIC', 'Variación BOP', 'Observaciones']],
      body: orden.map((s, i) => {
        const bop = s.stats?.bop;
        const prev = i > 0 ? orden[i - 1].stats?.bop : null;
        const delta = (bop != null && prev != null) ? bop - prev : null;
        return [
          s.date ? fecha(s.date) : '—',
          bop != null ? `${bop}%` : '—',
          s.stats?.plaque != null ? `${s.stats.plaque}%` : '—',
          s.stats?.nic != null ? `${s.stats.nic} mm` : '—',
          delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} pts`,
          s.notes || '—',
        ];
      }),
      theme: 'grid',
      styles: { font: FUENTE, fontSize: T.dato, cellPadding: 2.2, lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
      headStyles: { fillColor: C.accent, textColor: C.white, fontSize: T.etiqueta, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 24 }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 26, halign: 'center' }, 5: { cellWidth: 'auto' },
      },
      didParseCell: (d) => {
        if (d.section === 'body' && d.column.index === 4) {
          const v = String(d.cell.raw);
          if (v.startsWith('+')) { d.cell.styles.textColor = C.danger; d.cell.styles.fontStyle = 'bold'; }
          else if (v.startsWith('-')) { d.cell.styles.textColor = C.ok; d.cell.styles.fontStyle = 'bold'; }
        }
      },
    });
  }

  return doc;
}

export function periodontograma(payload) {
  // Apaisado siempre: una hemiarcada con sus tres sitios por pieza no cabe de
  // otra manera con celdas legibles.
  const { doc, g } = crearDocumento({ formato: payload.formato, orientacion: 'l' });
  construirPeriodontograma({ doc, g, ...payload });
  return { doc, g };
}
