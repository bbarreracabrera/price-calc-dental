#!/usr/bin/env node
/* eslint-disable no-console */
// ============================================================================
// MIGRAR TOKENS — script de un solo uso
// ----------------------------------------------------------------------------
// Recorre src/ y hace dos cosas, nada más:
//
//   1. Reemplaza los colores hexadecimales escritos a mano por los de la
//      paleta nueva. Es sustitución literal de hex por hex, así que funciona
//      igual dentro de un className de Tailwind, de un style inline, de un
//      atributo SVG o de una cadena suelta. No necesita entender Tailwind.
//
//   2. Sube el piso de los tamaños de texto en px. Existen decenas de
//      `text-[9px]` y `text-[10px]` que, con el zoom viejo, se dibujaban a
//      6.75 y 7.5 píxeles reales. Al quitar el zoom ya mejoran solos, pero
//      por debajo de 11px no vale la pena defenderlos.
//
// Lo que NO hace, a propósito:
//   - No toca espaciados, radios ni sombras. Esos van en rem y la reducción
//     de la raíz en index.css ya los deja donde están hoy.
//   - No toca los arreglos RGB de jsPDF. Esos viven en src/pdf/, que ya se
//     entrega reescrito.
//   - No toca node_modules, ni .git, ni archivos binarios.
//
// Uso:
//   node scripts/migrar-tokens.mjs --dry     ← solo informa, no escribe
//   node scripts/migrar-tokens.mjs           ← aplica los cambios
//   node scripts/migrar-tokens.mjs --backup  ← aplica y deja copias .bak
//
// Antes de correrlo: haz commit de lo que tengas. El script no crea ramas.
// ============================================================================

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

const DRY = process.argv.includes('--dry');
const BACKUP = process.argv.includes('--backup');

const EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.svg']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.vite']);

// Los archivos que ya vienen escritos contra la paleta nueva. Tocarlos sería
// deshacer trabajo hecho a mano.
const SKIP_FILES = new Set([
  'src/pdf/theme.js',
  'src/pdf/layout.js',
  'src/constants.js',
  'src/index.css',
  'src/App.css',
]);

// ----------------------------------------------------------------------------
// 1. Mapa de color: hex viejo → hex nuevo
// ----------------------------------------------------------------------------
// La justificación de cada línea está al lado. Los ratios son contra blanco,
// medidos con la fórmula de luminancia relativa de WCAG 2.1.
const COLORS = {
  // Tinta principal: espresso un punto más profundo. 14.27:1 → 16.32:1
  '#312923': '#241F1B',

  // Texto secundario: subido para cumplir AA. 6.03:1 → 7.28:1
  '#6B615A': '#5E554E',

  // El problema grande. #9A8F84 daba 3.06:1 sobre el crema, bajo el mínimo
  // de 4.5:1, y era el color de casi todas las etiquetas pequeñas de la ficha.
  '#9A8F84': '#5E554E',
  '#A3968B': '#8A7F74',   // solo aparece como borde/icono decorativo

  // Oliva de acción: más profundo para que el blanco encima también cumpla.
  // 6.06:1 → 8.29:1, en los dos sentidos.
  '#5B6651': '#46523C',
  '#4a5442': '#36402F',
  '#4A5442': '#36402F',

  // Rosa empolvado: se conserva como color de superficie, apenas más saturado
  // para que los rellenos al 20-40% de opacidad sigan leyéndose.
  '#CBAAA2': '#D3A9A0',
  '#8B5E57': '#7D4A43',   // su versión de texto: 5.47:1 → 7.16:1

  // Bordes: #DFD2C4 al 50% sobre blanco daba 1.24:1, prácticamente invisible.
  // Ese es el motivo de que la interfaz se sintiera plana y sin estructura.
  '#DFD2C4': '#D9D2C7',

  // Fondos crema
  '#FDFBF7': '#FBFAF8',
  '#FAFAFA': '#FBFAF8',

  // Restos del tema oscuro/dorado que ya no existe (THEMES fue eliminado)
  '#D4AF37': '#8A5A00',
  '#B69121': '#8A5A00',
  '#050505': '#241F1B',
  '#121212': '#241F1B',
  '#090909': '#241F1B',
};

// ----------------------------------------------------------------------------
// 2. Piso de tamaño de texto
// ----------------------------------------------------------------------------
const PISO_PX = 11;

// ----------------------------------------------------------------------------

function listarArchivos(dir, acc = []) {
  for (const nombre of readdirSync(dir)) {
    if (SKIP_DIRS.has(nombre)) continue;
    const ruta = join(dir, nombre);
    const st = statSync(ruta);
    if (st.isDirectory()) listarArchivos(ruta, acc);
    else if (EXT.has(extname(nombre))) acc.push(ruta);
  }
  return acc;
}

function migrar(texto) {
  const cambios = { colores: 0, tamaños: 0 };
  let salida = texto;

  // --- Colores ---
  for (const [viejo, nuevo] of Object.entries(COLORS)) {
    // Insensible a mayúsculas, pero exigiendo que no haya más dígitos hex
    // pegados detrás: así '#31292344' (8 dígitos con alfa) no se corrompe.
    const re = new RegExp(viejo.replace('#', '#') + '(?![0-9a-fA-F])', 'gi');
    salida = salida.replace(re, () => { cambios.colores++; return nuevo; });
  }

  // --- Tamaños de texto en px dentro de valores arbitrarios de Tailwind ---
  // Cubre text-[9px], sm:text-[10px], lg:text-[8px], hover:text-[9px]...
  salida = salida.replace(/\btext-\[(\d+(?:\.\d+)?)px\]/g, (todo, n) => {
    const px = parseFloat(n);
    if (px >= PISO_PX) return todo;
    cambios.tamaños++;
    return `text-[${PISO_PX}px]`;
  });

  return { salida, cambios };
}

// ----------------------------------------------------------------------------

const archivos = listarArchivos(SRC);
let tocados = 0, totalColores = 0, totalTamaños = 0;
const detalle = [];

for (const ruta of archivos) {
  const rel = relative(ROOT, ruta).split('\\').join('/');
  if (SKIP_FILES.has(rel)) continue;

  const original = readFileSync(ruta, 'utf8');
  const { salida, cambios } = migrar(original);
  if (salida === original) continue;

  tocados++;
  totalColores += cambios.colores;
  totalTamaños += cambios.tamaños;
  detalle.push({ rel, ...cambios });

  if (!DRY) {
    if (BACKUP) writeFileSync(ruta + '.bak', original, 'utf8');
    writeFileSync(ruta, salida, 'utf8');
  }
}

detalle.sort((a, b) => (b.colores + b.tamaños) - (a.colores + a.tamaños));

console.log('');
console.log(DRY ? '  SIMULACIÓN — no se escribió nada' : '  CAMBIOS APLICADOS');
console.log('  ' + '─'.repeat(58));
for (const d of detalle.slice(0, 25)) {
  console.log(`  ${String(d.colores).padStart(4)} color  ${String(d.tamaños).padStart(3)} texto   ${d.rel}`);
}
if (detalle.length > 25) console.log(`  … y ${detalle.length - 25} archivos más`);
console.log('  ' + '─'.repeat(58));
console.log(`  ${tocados} archivos · ${totalColores} colores · ${totalTamaños} tamaños de texto`);
console.log('');

if (!DRY) {
  console.log('  Revisa con:  git diff --stat');
  console.log('  Deshaz con:  git checkout -- src/');
  console.log('');
}
