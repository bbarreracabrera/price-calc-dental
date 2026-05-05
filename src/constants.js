// src/constants.js

export const CONSENT_TEMPLATES = {
  general: { title: "Consentimiento General", text: "Autorizo al Dr/a. a realizar los exámenes y tratamientos dentales necesarios. Entiendo que la odontología no es una ciencia exacta y que no se pueden garantizar resultados. Me comprometo a seguir las indicaciones y asistir a mis citas." },
  exodoncia: { title: "Consentimiento Exodoncia", text: "Doy mi consentimiento para la extracción del diente indicado. He sido informado de los riesgos (dolor, infección, inflamación, parestesia) y beneficios. Autorizo el uso de anestesia local y acepto las instrucciones post-operatorias." },
  endo: { title: "Consentimiento Endodoncia", text: "Entiendo que el tratamiento de conducto busca salvar el diente, pero puede fallar, requerir retratamiento o cirugía. Conozco los riesgos de fractura instrumental o perforación. Acepto el procedimiento." }
};

export const ANAMNESIS_TAGS = ['Diabetes', 'Hipertensión', 'Cardiopatía', 'Alergias', 'Asma', 'Embarazo', 'Fumador', 'Coagulopatía', 'Epilepsia', 'Toma Medicamentos'];

export const THEMES = {
  dark: { bg: 'bg-[#050505]', text: 'text-white', card: 'bg-[#121212]/90 border border-white/10 shadow-2xl', accent: 'text-[#D4AF37]', accentBg: 'bg-[#D4AF37]', inputBg: 'bg-white/5 border-white/5 focus-within:border-[#D4AF37]', subText: 'text-stone-400', gradient: 'bg-gradient-to-br from-[#D4AF37] to-[#B69121]', buttonSecondary: 'bg-white/5 border-white/10 text-white' },
  light: { bg: 'bg-[#FAFAFA]', text: 'text-stone-800', card: 'bg-white border-stone-200 shadow-xl', accent: 'text-amber-600', accentBg: 'bg-amber-500', inputBg: 'bg-stone-100 focus-within:bg-white focus-within:border-amber-500', subText: 'text-stone-500', gradient: 'bg-gradient-to-br from-amber-400 to-amber-600', buttonSecondary: 'bg-stone-100 border-stone-200 text-stone-600' },
  blue: { bg: 'bg-[#0a192f]', text: 'text-white', card: 'bg-[#112240]/90 border-cyan-500/20 shadow-cyan-900/20 shadow-2xl', accent: 'text-cyan-400', accentBg: 'bg-cyan-500', inputBg: 'bg-[#1d2d50] border-transparent focus-within:border-cyan-400', subText: 'text-slate-400', gradient: 'bg-gradient-to-br from-cyan-400 to-blue-600', buttonSecondary: 'bg-white/5 border-white/10 text-cyan-400' }
};

// Dentición Permanente (Adultos)
export const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
export const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

// Dentición Temporal (Pediátricos)
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

export const getLocalDate = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().split('T')[0];
};

export const formatRUT = (rut) => {
    if (!rut) return '';
    let cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleanRut.length <= 1) return cleanRut;
    let result = cleanRut.slice(-1);
    let body = cleanRut.slice(0, -1);
    let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedBody}-${result}`;
};