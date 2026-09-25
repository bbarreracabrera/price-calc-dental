// src/pdf/documents/perio.js
import autoTable from 'jspdf-autotable';
import { C, T, FUENTE } from '../theme.js';
import { crearDocumento, dibujarMembrete, cajaPaciente, texto, fecha } from '../layout.js';

// ============================================================================
// PERIODONTOGRAMA
// ----------------------------------------------------------------------------
// Versión anterior: redibujaba el gráfico de sondaje y las tablas desde cero
// con primitivas de jsPDF (líneas, círculos, polígonos). El resultado nunca
// terminó de verse bien — ni de cerca tan claro como lo que la ficha ya
// muestra en pantalla en PerioChart.jsx, que tiene el mismo dato pero con
// meses de ajuste visual encima (dientes con anatomía real, colores de
// severidad, líneas de margen/sondaje calculadas en vivo).
//
// Ahora este archivo no dibuja el periodontograma: lo recibe ya capturado.
// PerioTab.jsx usa html2canvas sobre cada arcada tal como está en pantalla en
// ese momento (con la denticion, las notas y los valores que el dentista ve),
// y aquí cada captura se inserta como imagen, una por página, ajustada al
// ancho de la hoja. Lo único que este módulo sigue construyendo él mismo es
// el membrete, la identificación del paciente, los índices resumen y la
// comparativa entre sesiones — todo eso es texto real, no una reconstrucción
// de algo que ya existía en otro lado.
//
// Contrapartida a tener en cuenta: al ser una imagen y no vectores, si se
// imprime en blanco y negro los colores de la captura (rojo/ámbar/azul) se
// reducen a escalas de gris parecidas entre sí. En pantalla y en una
// impresión a color no hay pérdida de información.
// ============================================================================

export function construirPeriodontograma({ doc, g, paciente, stats = {}, config, folio, capturas = [] }) {
  // --- Portada: identificación e índices ---
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

  // --- Leyenda: describe la captura real, no un sistema de símbolos propio ---
  const leyenda = [
    'Las páginas siguientes son una captura de la ficha tal como se ve en pantalla, con los mismos colores y valores.',
    'En el gráfico de cada arcada: línea azul = margen gingival, línea roja = profundidad de sondaje. El punto sobre la línea roja marca profundidad elevada (ámbar desde 4 mm, rojo desde 6 mm).',
    'En la tabla: círculo rojo = sangrado al sondaje, cuadrado ámbar = supuración, triángulo morado = compromiso de furca.',
    'Por ser una imagen, en una impresión en blanco y negro estos colores se distinguen menos que en pantalla o en una impresión a color.',
  ];
  const altoLeyenda = 8 + leyenda.length * 5;
  doc.setFillColor(...C.canvas);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(g.izq, y, g.util, altoLeyenda, 2, 2, 'FD');
  texto(doc, 'Cómo leer este documento', g.izq + 4, y + 5.5, { size: T.etiqueta, estilo: 'bold' });
  leyenda.forEach((l, i) => texto(doc, l, g.izq + 4, y + 11 + i * 5, { size: T.pie, color: C.muted, maxWidth: g.util - 8 }));
  y += altoLeyenda + 6;

  if (!capturas.length) {
    texto(doc, 'No se pudo capturar el periodontograma en pantalla.', g.izq, y + 4, { size: T.cuerpo, color: C.danger });
  }

  // --- Una arcada por página, ajustada al ancho disponible ---
  const yInicioImagen = g.margen.arriba + 6;
  const altoDisponible = g.pieY - yInicioImagen - 4;

  capturas.forEach((cap) => {
    if (!cap?.dataUrl || !cap.width || !cap.height) return;
    doc.addPage();
    doc.setFillColor(...C.accent);
    doc.rect(0, 0, g.ancho, 2.4, 'F');

    // Ajusta primero al ancho de la página; si con ese ancho la imagen queda
    // más alta que el espacio disponible, se reajusta por alto en su lugar.
    let anchoImg = g.util;
    let altoImg = (cap.height / cap.width) * anchoImg;
    if (altoImg > altoDisponible) {
      altoImg = altoDisponible;
      anchoImg = (cap.width / cap.height) * altoImg;
    }
    const xImg = g.izq + (g.util - anchoImg) / 2;

    try {
      doc.addImage(cap.dataUrl, 'PNG', xImg, yInicioImagen, anchoImg, altoImg, undefined, 'FAST');
    } catch (e) {
      console.error('[perio-pdf] no se pudo insertar una captura', e);
      texto(doc, 'No se pudo insertar esta imagen.', g.izq, yInicioImagen + 10, { size: T.cuerpo, color: C.danger });
    }
  });

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
  const { doc, g } = crearDocumento({ formato: payload.formato, orientacion: 'l' });
  construirPeriodontograma({ doc, g, ...payload });
  return { doc, g };
}
