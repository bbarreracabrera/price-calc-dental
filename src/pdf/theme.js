// src/pdf/theme.js
// ============================================================================
// TOKENS DE LOS DOCUMENTOS PDF
// ----------------------------------------------------------------------------
// Los mismos colores de la app, traducidos a los arreglos RGB que espera jsPDF.
// Si cambia la paleta en tailwind.config.js, cambia aquí y en ningún otro lado:
// los seis documentos leen de este archivo.
//
// Sobre el blanco y negro: ningún dato puede depender solo del color. En el
// periodontograma viejo el sangrado era un punto rojo y la supuración una letra
// ámbar; impresos en una láser monocromática quedaban indistinguibles. Por eso
// cada marca clínica tiene además su letra (ver GLIFOS más abajo).
// ============================================================================

// --- Paleta (RGB) -----------------------------------------------------------
export const C = {
  ink:        [36, 31, 27],     // #241F1B
  muted:      [94, 85, 78],     // #5E554E
  faint:      [138, 127, 116],  // #8A7F74
  line:       [230, 223, 213],  // #E6DFD5
  lineStrong: [217, 210, 199],  // #D9D2C7
  canvas:     [251, 250, 248],  // #FBFAF8
  raised:     [245, 242, 237],  // #F5F2ED
  white:      [255, 255, 255],

  accent:     [70, 82, 60],     // #46523C
  accentSoft: [227, 233, 221],  // #E3E9DD

  rose:       [125, 74, 67],    // #7D4A43
  roseSoft:   [244, 226, 222],  // #F4E2DE
  sandSoft:   [239, 230, 218],  // #EFE6DA
  sky:        [61, 90, 128],    // #3D5A80
  skySoft:    [224, 231, 236],  // #E0E7EC

  ok:         [31, 111, 99],    // #1F6F63
  warn:       [138, 90, 0],     // #8A5A00
  danger:     [166, 43, 33],    // #A62B21
};

// Severidad de sondaje: los mismos umbrales que la app usa en pantalla.
export const colorSondaje = (mm) => {
  const n = parseFloat(mm);
  if (!Number.isFinite(n)) return null;
  if (n >= 6) return C.danger;
  if (n >= 4) return C.warn;
  return null;
};

// --- Glifos: legibles en blanco y negro sin depender del color --------------
export const GLIFOS = {
  sangrado:   'S',
  supuracion: 'P',
  implante:   'I',
  ausente:    '\u2014',  // guion largo
};

// --- Geometría de página ----------------------------------------------------
// Las coordenadas absolutas de 210 y 195 estaban escritas a mano por todo el
// generador viejo. En Carta (215,9 mm de ancho) todo quedaba descuadrado a la
// izquierda. Ahora la geometría se calcula.
const TAMANOS = {
  a4:    { ancho: 210,   alto: 297 },
  carta: { ancho: 215.9, alto: 279.4 },
};

export const FORMATOS = Object.keys(TAMANOS);

export function geometria(formato = 'a4', orientacion = 'p') {
  const base = TAMANOS[formato] || TAMANOS.a4;
  const vertical = orientacion === 'p' || orientacion === 'portrait';
  const ancho = vertical ? base.ancho : base.alto;
  const alto  = vertical ? base.alto  : base.ancho;

  const margen = { x: 15, arriba: 12, abajo: 18 };

  return {
    formato,
    orientacion: vertical ? 'p' : 'l',
    ancho,
    alto,
    margen,
    izq: margen.x,
    der: ancho - margen.x,
    centro: ancho / 2,
    util: ancho - margen.x * 2,
    pieY: alto - margen.abajo,
  };
}

// --- Escala tipográfica del documento impreso -------------------------------
// En papel el ojo tolera menos que en pantalla. 8 pt es el piso para cualquier
// cosa que un paciente deba poder leer; 6,5 pt solo se usa en la grilla del
// periodontograma, que es una tabla de números para el profesional.
export const T = {
  titulo:    16,
  subtitulo: 12,
  seccion:   10,
  cuerpo:     9.5,
  dato:       9,
  etiqueta:   7.5,
  pie:        7,
  grilla:     6.5,
};

export const FUENTE = 'helvetica';
