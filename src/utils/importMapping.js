// src/utils/importMapping.js
// ============================================================================
// TRASPASO DE PACIENTES — lógica de mapeo y validación
// ----------------------------------------------------------------------------
// Vive separada del componente para que se pueda probar sin renderizar nada, y
// porque la parte delicada de una migración no es la interfaz: es lo que se
// decide hacer con una fila rara.
//
// Qué hacía el importador anterior y por qué había que rehacerlo:
//
//   · Prometía en pantalla que eliminaba duplicados. No lo hacía: el upsert iba
//     `onConflict: 'id'` y generaba un id aleatorio nuevo para cada fila en cada
//     ejecución, así que nunca había conflicto. Reimportar el mismo Excel
//     duplicaba todos los pacientes.
//   · No usaba validateRUT, que ya existía en el proyecto.
//   · Una columna "fecha nacimiento" entraba tal cual al campo `age`, así que
//     desde Excel llegaba un número de serie como 30875.
//   · Si el archivo traía "Nombres" y "Apellidos" separados, tomaba una sola.
//   · Si la detección automática de una columna fallaba, importaba vacío sin
//     avisar.
//   · No había forma de deshacer una importación.
// ============================================================================

import { validateRUT } from './rutValidator.js';
import { normalizeRUT, formatRUT } from '../constants.js';

// ---------------------------------------------------------------------------
// CAMPOS DESTINO
// ---------------------------------------------------------------------------
export const CAMPOS = [
  { id: 'nombres',    label: 'Nombres',            requerido: false },
  { id: 'apellidos',  label: 'Apellidos',          requerido: false },
  { id: 'legalName',  label: 'Nombre completo',    requerido: true,
    ayuda: 'Si el archivo trae nombres y apellidos por separado, mapea esas dos y deja esta vacía.' },
  { id: 'rut',        label: 'RUT',                requerido: false },
  { id: 'birthDate',  label: 'Fecha de nacimiento', requerido: false },
  { id: 'phone',      label: 'Teléfono',           requerido: false },
  { id: 'email',      label: 'Correo',             requerido: false },
  { id: 'sex',        label: 'Sexo',               requerido: false },
  { id: 'address',    label: 'Domicilio',          requerido: false },
  { id: 'insurance',  label: 'Previsión',          requerido: false },
  { id: 'occupation', label: 'Ocupación',          requerido: false },
  { id: 'notes',      label: 'Observaciones',      requerido: false },
];

// ---------------------------------------------------------------------------
// PERFILES DE ORIGEN
// ---------------------------------------------------------------------------
// Cada software chileno rotula sus columnas a su manera. En vez de una sola
// heurística que adivina para todos, cada origen trae sus sinónimos y la
// detección parte por ahí.
export const PERFILES = {
  generico: {
    label: 'Excel o CSV propio',
    descripcion: 'Cualquier planilla con encabezados en la primera fila.',
    sinonimos: {
      legalName:  ['nombre completo', 'paciente', 'nombre del paciente', 'nombre'],
      nombres:    ['nombres', 'primer nombre', 'nombre de pila'],
      apellidos:  ['apellidos', 'apellido paterno', 'apellido'],
      rut:        ['rut', 'r.u.t', 'run', 'rol unico', 'identificacion', 'documento', 'dni'],
      birthDate:  ['fecha de nacimiento', 'fecha nacimiento', 'nacimiento', 'f. nacimiento', 'fec nac'],
      phone:      ['telefono', 'teléfono', 'celular', 'movil', 'móvil', 'fono', 'contacto'],
      email:      ['email', 'correo', 'e-mail', 'mail'],
      sex:        ['sexo', 'genero', 'género'],
      address:    ['direccion', 'dirección', 'domicilio'],
      insurance:  ['prevision', 'previsión', 'isapre', 'fonasa', 'seguro'],
      occupation: ['ocupacion', 'ocupación', 'profesion', 'profesión'],
      notes:      ['observacion', 'observaciones', 'notas', 'comentario'],
    },
  },
  dentalink: {
    label: 'Dentalink',
    descripcion: 'Exportación del listado de pacientes.',
    sinonimos: {
      legalName:  ['nombre completo', 'paciente'],
      nombres:    ['nombres', 'nombre'],
      apellidos:  ['apellidos', 'apellido paterno'],
      rut:        ['rut', 'identificacion'],
      birthDate:  ['fecha nacimiento', 'fecha de nacimiento'],
      phone:      ['telefono movil', 'celular', 'telefono'],
      email:      ['email', 'correo'],
      sex:        ['sexo'],
      address:    ['direccion'],
      insurance:  ['prevision', 'convenio'],
      notes:      ['observaciones'],
    },
  },
  reservo: {
    label: 'Reservo',
    descripcion: 'Exportación de clientes o pacientes.',
    sinonimos: {
      legalName:  ['nombre', 'cliente', 'paciente'],
      apellidos:  ['apellido'],
      rut:        ['rut', 'identificador'],
      birthDate:  ['fecha de nacimiento', 'cumpleanos', 'cumpleaños'],
      phone:      ['telefono', 'celular'],
      email:      ['email', 'correo electronico'],
      sex:        ['sexo'],
      address:    ['direccion'],
      notes:      ['comentarios'],
    },
  },
  agendapro: {
    label: 'AgendaPro',
    descripcion: 'Exportación de la base de clientes.',
    sinonimos: {
      legalName:  ['nombre completo', 'nombre cliente'],
      nombres:    ['nombre'],
      apellidos:  ['apellido', 'apellidos'],
      rut:        ['rut', 'identificacion'],
      birthDate:  ['fecha de nacimiento', 'cumpleanos'],
      phone:      ['telefono', 'celular'],
      email:      ['email', 'correo'],
      sex:        ['genero', 'sexo'],
      address:    ['direccion'],
      notes:      ['notas'],
    },
  },
  papel: {
    label: 'Fichas en papel',
    descripcion: 'Descarga la plantilla, llénala y súbela.',
    sinonimos: null, // usa las columnas exactas de la plantilla
  },
};

export const COLUMNAS_PLANTILLA = [
  'Nombres', 'Apellidos', 'RUT', 'Fecha de nacimiento', 'Sexo',
  'Teléfono', 'Correo', 'Domicilio', 'Previsión', 'Ocupación', 'Observaciones',
];

// ---------------------------------------------------------------------------
// DETECCIÓN DE COLUMNAS
// ---------------------------------------------------------------------------

const sinTildes = (s) => String(s || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export function detectarColumnas(encabezados, perfilId = 'generico') {
  const perfil = PERFILES[perfilId] || PERFILES.generico;
  const sinonimos = perfil.sinonimos || PERFILES.generico.sinonimos;
  const limpios = encabezados.map(sinTildes);
  const mapa = {};
  const usadas = new Set();

  for (const campo of CAMPOS) {
    const opciones = sinonimos[campo.id] || [];
    let indice = -1;

    // Primero coincidencia exacta, después por contención. El orden importa:
    // "nombre" contiene a "nombre completo" al revés y sin esto una columna
    // "Nombre del apoderado" se llevaba el nombre del paciente.
    for (const op of opciones) {
      const o = sinTildes(op);
      indice = limpios.findIndex((h, i) => h === o && !usadas.has(i));
      if (indice !== -1) break;
    }
    if (indice === -1) {
      for (const op of opciones) {
        const o = sinTildes(op);
        indice = limpios.findIndex((h, i) => h.includes(o) && !usadas.has(i));
        if (indice !== -1) break;
      }
    }

    if (indice !== -1) { mapa[campo.id] = indice; usadas.add(indice); }
    else mapa[campo.id] = null;
  }

  return mapa;
}

// ---------------------------------------------------------------------------
// NORMALIZADORES
// ---------------------------------------------------------------------------

/**
 * Fechas. Acepta las tres formas en que llegan realmente:
 *   · número de serie de Excel (45000)
 *   · dd/mm/aaaa y dd-mm-aaaa, que es como se escribe en Chile
 *   · aaaa-mm-dd, que es lo que exporta cualquier base
 * Devuelve siempre aaaa-mm-dd, o null si no se puede interpretar.
 */
export function parsearFecha(valor) {
  if (valor == null || valor === '') return null;

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor.toISOString().slice(0, 10);
  }

  // Serie de Excel: días desde el 30-12-1899. Se descartan valores absurdos
  // para no convertir un número de teléfono en una fecha.
  const n = Number(valor);
  if (Number.isFinite(n) && n > 1000 && n < 80000 && String(valor).length <= 6) {
    const ms = Date.UTC(1899, 11, 30) + n * 86400000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  const s = String(valor).trim();

  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    const [, a, mes, dia] = m;
    return `${a}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (m) {
    let [, dia, mes, a] = m;
    if (a.length === 2) a = Number(a) > 30 ? `19${a}` : `20${a}`;
    // Si el primer número es mayor que 12 solo puede ser el día; si el segundo
    // lo es, venía en formato mes/día y hay que invertir.
    if (Number(mes) > 12 && Number(dia) <= 12) [dia, mes] = [mes, dia];
    if (Number(mes) > 12 || Number(dia) > 31) return null;
    return `${a}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  return null;
}

export function edadDesde(fechaISO) {
  if (!fechaISO) return null;
  const nac = new Date(fechaISO);
  if (Number.isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad -= 1;
  return edad >= 0 && edad < 130 ? edad : null;
}

/** Teléfono chileno a formato +56 9 XXXX XXXX o +56 XX XXX XXXX. */
export function normalizarTelefono(valor) {
  if (!valor) return '';
  let d = String(valor).replace(/\D/g, '');
  if (!d) return '';
  d = d.replace(/^0+/, '');
  if (d.startsWith('56')) d = d.slice(2);
  if (d.length === 9 && d.startsWith('9')) return `+56 9 ${d.slice(1, 5)} ${d.slice(5)}`;
  if (d.length === 8) return `+56 9 ${d.slice(0, 4)} ${d.slice(4)}`;
  if (d.length === 9) return `+56 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `+56 ${d}`;
}

const SEXOS = { m: 'Masculino', f: 'Femenino', masculino: 'Masculino', femenino: 'Femenino', hombre: 'Masculino', mujer: 'Femenino', otro: 'Otro' };
export const normalizarSexo = (v) => (v ? (SEXOS[sinTildes(v)] || String(v).trim()) : '');

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------------------------------------------------------------------------
// FILA → PACIENTE
// ---------------------------------------------------------------------------

export function construirFila(fila, mapa, indice) {
  const val = (campo) => {
    const i = mapa[campo];
    return i == null ? '' : String(fila[i] ?? '').trim();
  };

  const nombres = val('nombres');
  const apellidos = val('apellidos');
  const completo = val('legalName');
  const legalName = (completo || [nombres, apellidos].filter(Boolean).join(' ')).replace(/\s+/g, ' ').trim();

  const rutCrudo = val('rut');
  const rutNorm = normalizeRUT(rutCrudo);
  const birthDate = parsearFecha(mapa.birthDate == null ? null : fila[mapa.birthDate]);
  const email = val('email').toLowerCase();

  const avisos = [];
  const errores = [];

  if (!legalName) errores.push('Sin nombre');
  if (rutCrudo && !rutNorm) avisos.push('RUT ilegible');
  if (rutNorm && !validateRUT(rutNorm)) errores.push('Dígito verificador incorrecto');
  if (!rutNorm) avisos.push('Sin RUT');
  if (mapa.birthDate != null && fila[mapa.birthDate] && !birthDate) avisos.push('Fecha de nacimiento ilegible');
  if (email && !RE_EMAIL.test(email)) avisos.push('Correo con formato inválido');

  return {
    fila: indice + 2, // +1 por el encabezado, +1 porque Excel cuenta desde 1
    legalName,
    rut: rutNorm ? formatRUT(rutNorm) : '',
    rutNorm,
    birthDate,
    age: edadDesde(birthDate),
    phone: normalizarTelefono(val('phone')),
    email: email && RE_EMAIL.test(email) ? email : '',
    sex: normalizarSexo(val('sex')),
    address: val('address'),
    insurance: val('insurance'),
    occupation: val('occupation'),
    notes: val('notes'),
    errores,
    avisos,
    decision: 'importar', // importar | omitir | fusionar
  };
}

/**
 * Duplicados. Se miran dos frentes a la vez, porque son distintos:
 *   · contra la clínica: el RUT ya existe en la base
 *   · dentro del archivo: el mismo RUT aparece dos veces en la planilla
 * El segundo caso reventaría el índice único de Postgres a mitad del lote y
 * dejaría la importación a medias.
 */
export function marcarDuplicados(filas, rutsExistentes = new Set()) {
  const vistos = new Map();

  return filas.map((f, i) => {
    if (!f.rutNorm) return { ...f, duplicado: null };

    if (rutsExistentes.has(f.rutNorm)) {
      return { ...f, duplicado: 'clinica', decision: 'fusionar' };
    }
    if (vistos.has(f.rutNorm)) {
      return { ...f, duplicado: 'archivo', duplicadoDe: vistos.get(f.rutNorm), decision: 'omitir' };
    }
    vistos.set(f.rutNorm, i);
    return { ...f, duplicado: null };
  });
}

/**
 * Estructura del paciente tal como la espera el resto de la aplicación.
 *
 * `consentStatus: 'heredado'` es deliberado: el consentimiento otorgado al
 * prestador anterior no desaparece al migrar el registro, pero tampoco es un
 * consentimiento otorgado aquí. Marcarlo así deja la deuda visible en la ficha
 * hasta que se capture uno actualizado en la primera cita, en vez de fingir que
 * está firmado o de bloquear la atención.
 */
export function aPaciente(f, { adminEmail, userId, loteId }) {
  const id = `pac_${f.rutNorm || Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    admin_email: adminEmail,
    ...(userId ? { user_id: userId } : {}),
    import_batch_id: loteId,
    data: {
      id,
      name: f.legalName,
      personal: {
        legalName: f.legalName,
        rut: f.rut,
        birthDate: f.birthDate || '',
        age: f.age ?? '',
        sex: f.sex,
        phone: f.phone,
        email: f.email,
        address: f.address,
        insurance: f.insurance,
        occupation: f.occupation,
      },
      anamnesis: { conditions: {}, details: {}, notes: f.notes || '' },
      clinical: { teeth: {}, perio: {}, evolutions: [], quotes: [], perioHistory: [] },
      consents: [],
      images: {},
      consentStatus: 'heredado',
      importedAt: new Date().toISOString(),
      importBatchId: loteId,
      source: 'asistente_traspaso',
    },
  };
}

export function resumen(filas) {
  return {
    total: filas.length,
    listos:     filas.filter(f => !f.errores.length && f.decision === 'importar').length,
    conError:   filas.filter(f => f.errores.length).length,
    conAviso:   filas.filter(f => !f.errores.length && f.avisos.length).length,
    duplicados: filas.filter(f => f.duplicado).length,
    omitidos:   filas.filter(f => f.decision === 'omitir').length,
    fusionar:   filas.filter(f => f.decision === 'fusionar').length,
  };
}
