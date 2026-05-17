export const CARIOGRAM_FACTORS = [
    {
        key: 'cariesExperience',
        label: 'Experiencia de caries',
        description: 'Caries previas, restauraciones, dientes ausentes por caries',
        max: 3,
        options: [
            { value: 0, label: '0 — Sin caries' },
            { value: 1, label: '1 — Mejor que promedio' },
            { value: 2, label: '2 — Promedio' },
            { value: 3, label: '3 — Peor que promedio' },
        ],
        group: 'circumstances',
    },
    {
        key: 'relatedDiseases',
        label: 'Enfermedades relacionadas',
        description: 'Condiciones sistémicas que afectan susceptibilidad a caries',
        max: 2,
        options: [
            { value: 0, label: '0 — Sin enfermedades' },
            { value: 1, label: '1 — Enfermedad moderada' },
            { value: 2, label: '2 — Enfermedad severa o múltiple' },
        ],
        group: 'circumstances',
    },
    {
        key: 'dietContents',
        label: 'Contenido de la dieta',
        description: 'Cariogenicidad de los alimentos consumidos',
        max: 3,
        options: [
            { value: 0, label: '0 — Muy bajo en azúcares' },
            { value: 1, label: '1 — Bajo en azúcares' },
            { value: 2, label: '2 — Moderado' },
            { value: 3, label: '3 — Alto en azúcares' },
        ],
        group: 'diet',
    },
    {
        key: 'dietFrequency',
        label: 'Frecuencia de comidas',
        description: 'Número de comidas/snacks por día',
        max: 3,
        options: [
            { value: 0, label: '0 — Máximo 3 comidas' },
            { value: 1, label: '1 — 4-5 comidas' },
            { value: 2, label: '2 — 6-7 comidas' },
            { value: 3, label: '3 — Más de 7 comidas' },
        ],
        group: 'diet',
    },
    {
        key: 'plaqueAmount',
        label: 'Cantidad de placa',
        description: 'Índice de placa de Silness-Löe',
        max: 3,
        options: [
            { value: 0, label: '0 — Sin placa visible' },
            { value: 1, label: '1 — Placa fina' },
            { value: 2, label: '2 — Acúmulo moderado' },
            { value: 3, label: '3 — Acúmulo abundante' },
        ],
        group: 'bacteria',
    },
    {
        key: 'mutansStreptococci',
        label: 'Streptococcus mutans',
        description: 'Nivel de bacterias cariogénicas en saliva',
        max: 3,
        options: [
            { value: 0, label: '0 — Clase 0 (bajo)' },
            { value: 1, label: '1 — Clase 1' },
            { value: 2, label: '2 — Clase 2' },
            { value: 3, label: '3 — Clase 3 (alto)' },
        ],
        group: 'bacteria',
    },
    {
        key: 'fluorideProgram',
        label: 'Programa de flúor',
        description: 'Exposición al flúor (dentífrico, enjuagues, aplicaciones)',
        max: 3,
        options: [
            { value: 0, label: '0 — Programa máximo' },
            { value: 1, label: '1 — Programa adicional' },
            { value: 2, label: '2 — Solo dentífrico' },
            { value: 3, label: '3 — Sin flúor' },
        ],
        group: 'susceptibility',
    },
    {
        key: 'salivaSecretion',
        label: 'Secreción salival',
        description: 'Flujo salival estimulado (ml/min)',
        max: 3,
        options: [
            { value: 0, label: '0 — Normal (>1.1 ml/min)' },
            { value: 1, label: '1 — Baja (0.9-1.1)' },
            { value: 2, label: '2 — Muy baja (0.5-0.9)' },
            { value: 3, label: '3 — Severa (<0.5)' },
        ],
        group: 'susceptibility',
    },
    {
        key: 'bufferCapacity',
        label: 'Capacidad buffer',
        description: 'Capacidad de neutralización de la saliva',
        max: 2,
        options: [
            { value: 0, label: '0 — Normal (pH ≥6)' },
            { value: 1, label: '1 — Reducida (pH 4.5-5.5)' },
            { value: 2, label: '2 — Baja (pH ≤4)' },
        ],
        group: 'susceptibility',
    },
    {
        key: 'clinicalJudgement',
        label: 'Juicio clínico',
        description: 'Evaluación profesional del riesgo general',
        max: 3,
        options: [
            { value: 0, label: '0 — Riesgo muy bajo' },
            { value: 1, label: '1 — Riesgo bajo' },
            { value: 2, label: '2 — Riesgo moderado' },
            { value: 3, label: '3 — Riesgo alto' },
        ],
        group: 'circumstances',
    },
];

export function calculateCariogram(values) {
    const norm = (val, max) => (val / max) * 100;

    const bacteria = (
        norm(values.plaqueAmount || 0, 3) * 0.4 +
        norm(values.mutansStreptococci || 0, 3) * 0.6
    );
    const diet = (
        norm(values.dietContents || 0, 3) * 0.4 +
        norm(values.dietFrequency || 0, 3) * 0.6
    );
    const susceptibility = (
        norm(values.fluorideProgram || 0, 3) * 0.25 +
        norm(values.salivaSecretion || 0, 3) * 0.50 +
        norm(values.bufferCapacity || 0, 2) * 0.25
    );
    const circumstances = (
        norm(values.cariesExperience || 0, 3) * 0.50 +
        norm(values.relatedDiseases || 0, 2) * 0.20 +
        norm(values.clinicalJudgement || 0, 3) * 0.30
    );

    let penalty = 0;
    if ((values.salivaSecretion || 0) >= 3) penalty += 10;
    if ((values.mutansStreptococci || 0) >= 3) penalty += 5;
    if ((values.cariesExperience || 0) >= 3) penalty += 5;

    const totalRisk = (bacteria + diet + susceptibility + circumstances) / 4;
    const chance = Math.max(0, Math.min(100, 100 - totalRisk - penalty));
    const remaining = 100 - chance;
    const total = bacteria + diet + susceptibility + circumstances || 1;

    return {
        chance:          Math.round(chance),
        bacteria:        Math.round((bacteria        / total) * remaining),
        diet:            Math.round((diet            / total) * remaining),
        susceptibility:  Math.round((susceptibility  / total) * remaining),
        circumstances:   Math.round((circumstances   / total) * remaining),
        riskLevel: chance >= 60 ? 'low' : chance >= 30 ? 'moderate' : 'high',
    };
}

export const RISK_LABELS = {
    low:      { label: 'Riesgo Bajo',      recommendation: 'Mantenimiento estándar',              color: '#5B6651' },
    moderate: { label: 'Riesgo Moderado',  recommendation: 'Intensificar prevención',             color: '#D9A86C' },
    high:     { label: 'Riesgo Alto',      recommendation: 'Programa intensivo de prevención',    color: '#B92323' },
};

export function getCariogramRecommendations(values, result) {
    const recs = [];

    if ((values.dietContents || 0) >= 2)
        recs.push({ category: 'Dieta', priority: 'high', text: 'Reducir consumo de azúcares refinados y carbohidratos fermentables. Sustituir por opciones con xilitol o stevia.' });

    if ((values.dietFrequency || 0) >= 2)
        recs.push({ category: 'Dieta', priority: 'high', text: 'Limitar frecuencia de comidas/snacks a máximo 5-6 al día. Espaciar al menos 2-3 horas entre ingestas para permitir remineralización.' });

    if ((values.plaqueAmount || 0) >= 2)
        recs.push({ category: 'Higiene', priority: 'high', text: 'Reforzar técnica de cepillado (Bass modificada). Cepillado 3 veces al día, 2 min cada vez. Considerar revelador de placa para evaluación.' });

    if ((values.mutansStreptococci || 0) >= 2)
        recs.push({ category: 'Antibacteriano', priority: 'high', text: 'Considerar enjuagues con clorhexidina al 0.12% durante 1-2 semanas. Reevaluar niveles bacterianos en 3 meses.' });

    if ((values.fluorideProgram || 0) >= 2)
        recs.push({ category: 'Flúor', priority: 'medium', text: 'Intensificar uso de flúor: pasta dental ≥1450 ppm, enjuagues con NaF 0.05% diarios, considerar aplicación tópica de flúor barniz cada 3-6 meses.' });

    if ((values.salivaSecretion || 0) >= 2)
        recs.push({ category: 'Saliva', priority: 'high', text: 'Estimular flujo salival: chicles con xilitol post-comidas, hidratación frecuente. Evaluar medicamentos xerostomizantes. Considerar sialogogos.' });

    if ((values.bufferCapacity || 0) >= 1)
        recs.push({ category: 'Saliva', priority: 'medium', text: 'Capacidad buffer reducida: usar enjuagues alcalinos post-comidas, considerar bicarbonato como apoyo, evitar bebidas ácidas.' });

    if ((values.relatedDiseases || 0) >= 1)
        recs.push({ category: 'Sistémico', priority: 'medium', text: 'Coordinar con médico tratante. Revisar medicación xerostomizante. Plan de control sistémico (diabetes, reflujo, etc.).' });

    if (result.riskLevel === 'high') {
        recs.unshift({ category: 'Plan general', priority: 'critical', text: 'Programa intensivo de prevención. Controles cada 3 meses. Reforzar TODAS las áreas. Documentar línea base con fotos clínicas.' });
    } else if (result.riskLevel === 'moderate') {
        recs.unshift({ category: 'Plan general', priority: 'medium', text: 'Programa preventivo intensificado. Controles cada 4-6 meses. Reforzar áreas más débiles.' });
    } else {
        recs.unshift({ category: 'Plan general', priority: 'low', text: 'Mantenimiento estándar. Controles cada 6-12 meses. Reforzar hábitos preventivos.' });
    }

    return recs;
}
