// src/constants.js
// ============================================================================
// Constantes clínicas y de negocio de ShiningCloud Dental.
// ============================================================================

// ----------------------------------------------------------------------------
// TEMA
// ----------------------------------------------------------------------------
// Antes existían tres temas (oscuro con dorado, claro con ámbar, azul con cian)
// que convivían con las variables CSS "boutique" y con los hex escritos a mano
// en cada componente. Tres sistemas de color para una sola app.
//
// Ahora hay uno solo. El objeto se mantiene con las tres claves para no romper
// los `THEMES[themeMode]` que quedan repartidos por el código: las tres apuntan
// al mismo tema. `themeMode` se puede ir borrando componente por componente sin
// apuro y sin que nada se caiga mientras tanto.
const TEMA = {
  bg: 'bg-canvas',
  text: 'text-ink',
  card: 'bg-surface border border-line shadow-card',
  accent: 'text-accent',
  accentBg: 'bg-accent',
  inputBg: 'bg-raised border-line focus-within:bg-surface focus-within:border-accent',
  subText: 'text-muted',
  gradient: 'bg-gradient-to-br from-accent to-accent-hover',
  buttonSecondary: 'bg-raised border border-line text-ink hover:bg-accent-soft',
};

export const THEMES = { light: TEMA, dark: TEMA, blue: TEMA };

// ----------------------------------------------------------------------------
// ALERTAS MÉDICAS
// ----------------------------------------------------------------------------
// Antes las alertas eran banderas booleanas sueltas: sabías que el paciente
// tenía alergia, no a qué. Ahora cada condición declara su nivel y si necesita
// un detalle escrito antes de considerarse completa.
//
//   critica  → cambia la conducta clínica de hoy. Siempre visible, en rojo.
//   alta     → exige precaución o interconsulta. Visible, en ámbar.
//   contexto → hay que tenerlo presente, no frena la atención.
export const CONDICIONES_MEDICAS = [
  { id: 'Alergias',         label: 'Alergias',              nivel: 'critica', pideDetalle: true,  placeholder: 'A qué y qué reacción tuvo' },
  { id: 'Coagulopatía',     label: 'Trastorno de coagulación', nivel: 'critica', pideDetalle: true,  placeholder: 'Diagnóstico e INR reciente' },
  { id: 'Anticoagulantes',  label: 'Anticoagulantes',       nivel: 'critica', pideDetalle: true,  placeholder: 'Cuál, dosis y última toma' },
  { id: 'Cardiopatía',      label: 'Cardiopatía',           nivel: 'critica', pideDetalle: true,  placeholder: 'Diagnóstico y tratante' },
  { id: 'Profilaxis ATB',   label: 'Requiere profilaxis antibiótica', nivel: 'critica', pideDetalle: true, placeholder: 'Indicación y esquema' },
  { id: 'Epilepsia',        label: 'Epilepsia',             nivel: 'critica', pideDetalle: true,  placeholder: 'Última crisis y medicación' },

  { id: 'Diabetes',         label: 'Diabetes',              nivel: 'alta',    pideDetalle: true,  placeholder: 'Tipo, HbA1c y control' },
  { id: 'Hipertensión',     label: 'Hipertensión',          nivel: 'alta',    pideDetalle: true,  placeholder: 'Controlada o no, fármacos' },
  { id: 'Asma',             label: 'Asma',                  nivel: 'alta',    pideDetalle: true,  placeholder: 'Gatillantes, uso de inhalador' },
  { id: 'Embarazo',         label: 'Embarazo',              nivel: 'alta',    pideDetalle: true,  placeholder: 'Semanas de gestación' },
  { id: 'Bifosfonatos',     label: 'Bifosfonatos',          nivel: 'alta',    pideDetalle: true,  placeholder: 'Cuál, vía y tiempo de uso' },
  { id: 'Inmunosupresión',  label: 'Inmunosupresión',       nivel: 'alta',    pideDetalle: true,  placeholder: 'Causa y tratamiento' },

  { id: 'Toma Medicamentos', label: 'Medicamentos en uso',  nivel: 'contexto', pideDetalle: true, placeholder: 'Listado con dosis' },
  { id: 'Fumador',          label: 'Fumador',               nivel: 'contexto', pideDetalle: true,  placeholder: 'Cigarrillos al día y años' },
  { id: 'Bruxismo',         label: 'Bruxismo',              nivel: 'contexto', pideDetalle: false },
  { id: 'Ansiedad dental',  label: 'Ansiedad dental',       nivel: 'contexto', pideDetalle: true,  placeholder: 'Qué la desencadena' },
];

// Compatibilidad con el código que todavía lee la lista plana de etiquetas.
export const ANAMNESIS_TAGS = CONDICIONES_MEDICAS.map(c => c.id);

export const NIVEL_ALERTA = {
  critica:  { orden: 0, clase: 'bg-danger text-white',        chip: 'bg-danger-soft text-danger border-danger/25' },
  alta:     { orden: 1, clase: 'bg-warn text-white',          chip: 'bg-warn-soft text-warn border-warn/25' },
  contexto: { orden: 2, clase: 'bg-raised text-ink border border-line', chip: 'bg-raised text-muted border-line' },
};

// Bloques de anamnesis que aparecen solo cuando el caso lo pide. No son fichas
// distintas: es un formulario con secciones condicionales, para que lo que no
// aplica no ocupe espacio ni pida atención.
export const BLOQUES_CONDICIONALES = [
  { id: 'pediatrico',   label: 'Paciente pediátrico', activaSi: p => (Number(p?.personal?.age) || 99) < 15,
    campos: ['Embarazo y parto', 'Hábitos (chupete, succión digital, respiración bucal)', 'Erupción dentaria', 'Apoderado responsable'] },
  { id: 'embarazo',     label: 'Embarazo',            activaSi: p => !!p?.anamnesis?.conditions?.['Embarazo'],
    campos: ['Semanas de gestación', 'Médico tratante', 'Autorización para radiografías', 'Trimestre y posición en el sillón'] },
  { id: 'prequirurgico', label: 'Prequirúrgico',      activaSi: () => false,
    campos: ['Exámenes preoperatorios', 'Ayuno', 'Acompañante', 'Indicaciones postoperatorias entregadas'] },
  { id: 'ortodoncia',   label: 'Ortodoncia',          activaSi: () => false,
    campos: ['Motivo estético', 'Antecedentes de ATM', 'Hábitos parafuncionales', 'Expectativas del paciente'] },
];

// ----------------------------------------------------------------------------
// CONSENTIMIENTOS
// ----------------------------------------------------------------------------
export const CONSENT_TEMPLATES = {
  general: {
    title: 'Consentimiento General',
    text: 'Autorizo al profesional tratante a realizar los exámenes y tratamientos dentales que se me han explicado. Declaro que se me informó el diagnóstico, las alternativas de tratamiento, sus riesgos, sus beneficios y el pronóstico esperado, y que pude hacer preguntas y fueron respondidas. Entiendo que la odontología no es una ciencia exacta y que no se garantizan resultados. Me comprometo a seguir las indicaciones entregadas y a asistir a mis controles. Sé que puedo revocar este consentimiento en cualquier momento antes del procedimiento.',
  },
  exodoncia: {
    title: 'Consentimiento de Exodoncia',
    text: 'Doy mi consentimiento para la extracción de la o las piezas dentarias indicadas. Se me informó sobre los riesgos del procedimiento, entre ellos dolor, inflamación, sangrado, infección, alveolitis, fractura radicular, comunicación con el seno maxilar, daño a dientes vecinos y alteración transitoria o permanente de la sensibilidad por compromiso nervioso. Autorizo el uso de anestesia local y declaro haber informado mis antecedentes médicos, alergias y medicamentos en uso. Acepto las indicaciones postoperatorias entregadas por escrito.',
  },
  endo: {
    title: 'Consentimiento de Endodoncia',
    text: 'Autorizo la realización del tratamiento de conducto en la pieza indicada. Entiendo que su objetivo es conservar el diente y que, pese a un procedimiento correcto, puede fracasar y requerir retratamiento, cirugía apical o extracción. Se me informó sobre los riesgos de fractura de instrumental dentro del conducto, perforación radicular, extrusión de material, dolor postoperatorio y fractura de la corona si no se rehabilita a tiempo. Acepto realizar la rehabilitación definitiva en el plazo indicado.',
  },
  periodoncia: {
    title: 'Consentimiento de Tratamiento Periodontal',
    text: 'Autorizo la realización del tratamiento periodontal indicado. Entiendo que su éxito depende de mi higiene diaria y de asistir a los controles de mantención. Se me informó que puede producirse sensibilidad dentaria, retracción de encías con exposición de raíces, aumento de los espacios entre los dientes y movilidad transitoria, y que el tabaquismo y la diabetes no controlada reducen la respuesta al tratamiento.',
  },
  rehabilitacion: {
    title: 'Consentimiento de Rehabilitación Oral',
    text: 'Autorizo la confección e instalación de la rehabilitación indicada. Se me informó sobre la necesidad de desgastar tejido dentario, el uso de provisorios, la posibilidad de requerir tratamiento de conducto si aparece compromiso pulpar, y los plazos de laboratorio. Entiendo que el color y la forma se acuerdan antes de la confección definitiva y que las prótesis requieren un período de adaptación y controles periódicos.',
  },
  menor: {
    title: 'Consentimiento de Atención a Menor de Edad',
    text: 'En mi calidad de padre, madre, tutor o representante legal del paciente menor de edad individualizado en este documento, autorizo la realización de los procedimientos odontológicos que se me han explicado. Declaro haber informado los antecedentes médicos, alergias y medicamentos del menor. Entiendo que se considerará progresivamente la opinión del menor de acuerdo a su edad y madurez.',
  },
};

// Texto legal que acompaña a todo consentimiento firmado en pantalla.
// La firma electrónica simple está reconocida por la Ley 19.799; el registro
// del consentimiento en la ficha es lo que exige el Decreto 41/2012, art. 6 d).
export const NOTA_LEGAL_CONSENTIMIENTO =
  'Documento suscrito mediante firma electrónica simple conforme a la Ley 19.799. ' +
  'Queda registrado en la ficha clínica del paciente según el artículo 6 letra d) del ' +
  'Decreto 41 de 2012 del Ministerio de Salud, que aprueba el Reglamento sobre Fichas Clínicas.';

// ----------------------------------------------------------------------------
// DENTICIÓN (notación FDI)
// ----------------------------------------------------------------------------
export const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
export const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
export const TEETH_UPPER_PED = [55,54,53,52,51,61,62,63,64,65];
export const TEETH_LOWER_PED = [85,84,83,82,81,71,72,73,74,75];

export const DEFAULT_CATALOG = [
    { name: 'Consulta de Diagnóstico', price: 25000, category: 'Examen' },
    { name: 'Consulta de Especialidad', price: 40000, category: 'Examen' },
    { name: 'Radiografía Retroalveolar', price: 10000, category: 'Examen' },
    { name: 'Aplicación de Flúor Barniz', price: 25000, category: 'Preventivo' },
    { name: 'Sellante (por diente)', price: 20000, category: 'Preventivo' },
    { name: 'Instrucción de Higiene Oral', price: 15000, category: 'Preventivo' },
    { name: 'Restauración Resina Simple (1 Cara)', price: 35000, category: 'Rehabilitación' },
    { name: 'Restauración Resina Compuesta (2 Caras)', price: 45000, category: 'Rehabilitación' },
    { name: 'Restauración Resina Compleja (3 o más caras)', price: 55000, category: 'Rehabilitación' },
    { name: 'Reconstrucción Coronaria (Resina)', price: 70000, category: 'Rehabilitación' },
    { name: 'Incrustación Cerámica / Resina Indirecta', price: 150000, category: 'Rehabilitación' },
    { name: 'Corona Provisoria de Acrílico', price: 50000, category: 'Rehabilitación' },
    { name: 'Perno Muñón Metálico / Fibra de Vidrio', price: 80000, category: 'Rehabilitación' },
    { name: 'Corona Metal Porcelana', price: 250000, category: 'Rehabilitación' },
    { name: 'Corona Zirconio', price: 350000, category: 'Rehabilitación' },
    { name: 'Prótesis Removible Acrílica (1 a 4 dientes)', price: 150000, category: 'Rehabilitación' },
    { name: 'Prótesis Removible Metálica (Un maxilar)', price: 350000, category: 'Rehabilitación' },
    { name: 'Prótesis Total Acrílica (Un maxilar)', price: 280000, category: 'Rehabilitación' },
    { name: 'Reparación de Prótesis (Fractura/Diente)', price: 45000, category: 'Rehabilitación' },
    { name: 'Rebasado de Prótesis', price: 60000, category: 'Rehabilitación' },
    { name: 'Blanqueamiento Led (Clínica)', price: 150000, category: 'Rehabilitación' },
    { name: 'Blanqueamiento Cubetas (Casa)', price: 120000, category: 'Rehabilitación' },
    { name: 'Carilla de Porcelana (por diente)', price: 280000, category: 'Rehabilitación' },
    { name: 'Plano de Relajación (Placa de Bruxismo)', price: 120000, category: 'Rehabilitación' },
    { name: 'Aplicación Toxina Botulínica (Bruxismo/Estética)', price: 180000, category: 'Otros' },
    { name: 'Limpieza (Destartraje y Profilaxis)', price: 45000, category: 'Periodoncia' },
    { name: 'Pulido Radicular (por sextante)', price: 40000, category: 'Periodoncia' },
    { name: 'Cirugía Periodontal (por sextante)', price: 120000, category: 'Periodoncia' },
    { name: 'Gingivectomía (por diente)', price: 35000, category: 'Periodoncia' },
    { name: 'Férula de Contención Periodontal', price: 60000, category: 'Periodoncia' },
    { name: 'Endodoncia Unirradicular', price: 120000, category: 'Endodoncia' },
    { name: 'Endodoncia Birradicular', price: 150000, category: 'Endodoncia' },
    { name: 'Endodoncia Multirradicular (Molares)', price: 190000, category: 'Endodoncia' },
    { name: 'Retratamiento Endodóntico (Recargo)', price: 50000, category: 'Endodoncia' },
    { name: 'Urgencia Endodóntica (Trepanación)', price: 45000, category: 'Endodoncia' },
    { name: 'Extracción Simple', price: 40000, category: 'Cirugía' },
    { name: 'Extracción Compleja / A colgajo', price: 70000, category: 'Cirugía' },
    { name: 'Extracción Tercer Molar (Erupcionado)', price: 80000, category: 'Cirugía' },
    { name: 'Extracción Tercer Molar (Incluido/Semi-incluido)', price: 130000, category: 'Cirugía' },
    { name: 'Instalación Implante (Fase Quirúrgica)', price: 550000, category: 'Implantología' },
    { name: 'Elevación de Seno Maxilar', price: 350000, category: 'Implantología' },
    { name: 'Injerto Óseo (por sitio)', price: 200000, category: 'Implantología' },
    { name: 'Estudio de Ortodoncia (Modelos, Fotos, Cefalometría)', price: 60000, category: 'Ortodoncia' },
    { name: 'Instalación Brackets Metálicos (Arcada)', price: 250000, category: 'Ortodoncia' },
    { name: 'Instalación Brackets Estéticos (Arcada)', price: 400000, category: 'Ortodoncia' },
    { name: 'Control Mensual Ortodoncia', price: 35000, category: 'Ortodoncia' },
    { name: 'Contención Fija o Removible (Arcada)', price: 80000, category: 'Ortodoncia' },
    { name: 'Pulpotomía / Pulpectomía (Diente temporal)', price: 60000, category: 'Odontopediatría' },
    { name: 'Corona de Acero (Diente temporal)', price: 75000, category: 'Odontopediatría' },
    { name: 'Extracción Diente Temporal', price: 25000, category: 'Odontopediatría' },
    { name: 'Mantenedor de Espacio', price: 70000, category: 'Odontopediatría' },
];

// ----------------------------------------------------------------------------
// UTILIDADES
// ----------------------------------------------------------------------------

export const getLocalDate = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().split('T')[0];
};

/**
 * RUT normalizado: sin puntos, sin guion, dígito verificador en mayúscula.
 *
 * IMPORTANTE: esta función debe producir exactamente lo mismo que la columna
 * generada `patients.rut_norm` en Postgres, que es
 *
 *   nullif(upper(regexp_replace(rut, '[^0-9kK]', '', 'g')), '')
 *
 * Sobre esa columna vive el índice único que impide dos pacientes con el mismo
 * RUT en una clínica. Si las dos normalizaciones se separan, el buscador de
 * duplicados del importador dejará pasar registros que la base después rechaza.
 * Cualquier cambio aquí exige la migración equivalente en la base.
 */
export const normalizeRUT = (rut) => {
    if (!rut) return null;
    const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
    return limpio || null;
};

/** Formato de presentación: 12.345.678-9 */
export const formatRUT = (rut) => {
    if (!rut) return '';
    const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length <= 1) return limpio;
    const dv = limpio.slice(-1);
    const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${cuerpo}-${dv}`;
};
