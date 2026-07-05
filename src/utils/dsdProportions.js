/**
 * Motor de Proporciones para DSD (Digital Smile Design)
 * Basado en teorías de estética dental: RED, Golden, Mondelli, Chu, PDI
 * 
 * Este módulo calcula las dimensiones ideales de los dientes
 * basándose en medidas de referencia del paciente
 */

/**
 * Teoría RED Proportion (Recurrent Esthetic Dental Proportion)
 * Basada en la relación entre el ancho intercanino y las proporciones dentales
 * 
 * @param {number} intercanineWidth - Ancho entre caninos en mm
 * @returns {object} Proporciones calculadas para cada diente
 */
export const calculateREDProportion = (intercanineWidth) => {
    // RED Proportion: cada diente tiene una relación específica con el ancho intercanino
    // Fórmula: ancho diente = intercanineWidth * ratio
    
    const ratios = {
        // Dientes superiores (de distal a mesial)
        molar2: 0.33,      // Segundo molar
        molar1: 0.38,      // Primer molar
        premolar2: 0.32,   // Segundo premolar
        premolar1: 0.33,   // Primer premolar
        canine: 0.35,      // Canino (referencia)
        lateral: 0.32,     // Lateral
        central: 0.38      // Central
    };
    
    return Object.fromEntries(
        Object.entries(ratios).map(([tooth, ratio]) => [
            tooth,
            { width: intercanineWidth * ratio }
        ])
    );
};

/**
 * Teoría Golden Proportion (Proporción Áurea)
 * Relación 1.618 entre dientes consecutivos
 * 
 * @param {number} centralWidth - Ancho del incisivo central en mm
 * @returns {object} Proporciones calculadas
 */
export const calculateGoldenProportion = (centralWidth) => {
    const phi = 1.618; // Número de oro
    
    return {
        central: { width: centralWidth },
        lateral: { width: centralWidth / phi },
        canine: { width: (centralWidth / phi) * 0.95 }, // Ligeramente más estrecho que lateral
        premolar1: { width: (centralWidth / phi) * 0.85 },
        premolar2: { width: (centralWidth / phi) * 0.80 },
        molar1: { width: (centralWidth / phi) * 0.75 }
    };
};

/**
 * Rejilla de Mondelli
 * Sistema de análisis basado en líneas de referencia horizontal y vertical
 * 
 * @param {number} canineToCanineWidth - Ancho entre caninos en mm
 * @param {number} imageHeight - Altura de la imagen en píxeles
 * @returns {object} Parámetros de la rejilla
 */
export const calculateMondelliGrid = (canineToCanineWidth, imageHeight) => {
    // La rejilla de Mondelli divide el espacio en proporciones específicas
    const toothHeight = imageHeight * 0.25; // Altura aproximada de los dientes
    const gingivalHeight = imageHeight * 0.15; // Altura de la encía visible
    
    return {
        canineToCanineWidth,
        toothHeight,
        gingivalHeight,
        // Líneas horizontales de referencia
        lines: {
            interpupillary: imageHeight * 0.25,
            commissural: imageHeight * 0.65,
            incisal: imageHeight * 0.70,
            gingival: imageHeight * 0.75
        }
    };
};

/**
 * Proporción Dentaria Individual (PDI)
 * Relación ancho/alto de cada diente (idealmente 75-80%)
 * 
 * @param {number} toothWidth - Ancho del diente en mm
 * @param {number} pdiRatio - Ratio PDI (0.70 a 0.90, típicamente 0.75-0.80)
 * @returns {object} Dimensiones del diente
 */
export const calculatePDI = (toothWidth, pdiRatio = 0.78) => {
    const toothHeight = toothWidth / pdiRatio;
    
    return {
        width: toothWidth,
        height: toothHeight,
        ratio: pdiRatio,
        description: `${Math.round(pdiRatio * 100)}% - ${getPDIDescription(pdiRatio)}`
    };
};

/**
 * Descripción cualitativa del ratio PDI
 */
const getPDIDescription = (ratio) => {
    if (ratio < 0.70) return 'Muy ancho (poco común)';
    if (ratio < 0.75) return 'Ancho (moderno)';
    if (ratio < 0.80) return 'Ideal (clásico)';
    if (ratio < 0.85) return 'Estrecho (femenino)';
    return 'Muy estrecho (juvenil)';
};

/**
 * Teoría de Stephen Chu
 * Proporciones rápidas entre dientes superiores e inferiores
 * 
 * @param {number} upperCentralWidth - Ancho del central superior en mm
 * @returns {object} Proporciones para dientes superiores e inferiores
 */
export const calculateChuProportion = (upperCentralWidth) => {
    return {
        upper: {
            central: { width: upperCentralWidth },
            lateral: { width: upperCentralWidth * 0.85 },
            canine: { width: upperCentralWidth * 0.88 }
        },
        lower: {
            central: { width: upperCentralWidth * 0.75 },
            lateral: { width: upperCentralWidth * 0.80 },
            canine: { width: upperCentralWidth * 0.82 }
        }
    };
};

/**
 * Calcula la curva de sonrisa ideal basada en puntos de referencia
 * 
 * @param {number} imageWidth - Ancho de la imagen en píxeles
 * @param {number} imageHeight - Alto de la imagen en píxeles
 * @param {number} smileCurveIntensity - Intensidad de la curva (0-1)
 * @returns {array} Array de puntos {x, y} para dibujar la curva
 */
export const calculateSmileCurve = (imageWidth, imageHeight, smileCurveIntensity = 0.5) => {
    const points = [];
    const curveY = imageHeight * 0.65; // Posición vertical de la curva
    const curveAmplitude = imageHeight * 0.15 * smileCurveIntensity;
    
    for (let x = 0; x < imageWidth; x += 10) {
        const normalizedX = x / imageWidth; // 0 a 1
        const curveX = normalizedX * Math.PI; // 0 a PI
        const yOffset = Math.sin(curveX) * curveAmplitude;
        const y = curveY - yOffset;
        
        points.push({ x, y });
    }
    
    return points;
};

/**
 * Calcula las cajas dentales para visualización en el canvas
 * 
 * @param {object} params - Parámetros de cálculo
 * @param {number} params.imageWidth - Ancho de la imagen
 * @param {number} params.imageHeight - Alto de la imagen
 * @param {number} params.midlineX - Posición X de la línea media
 * @param {number} params.toothStartY - Posición Y inicial de los dientes
 * @param {number} params.toothHeight - Altura de los dientes
 * @param {string} params.proportionTheory - Teoría a usar: 'RED', 'GOLDEN', 'CHU', 'PDI'
 * @param {number} params.referenceWidth - Ancho de referencia en mm
 * @returns {array} Array de cajas dentales con posiciones
 */
export const calculateToothBoxes = (params) => {
    const {
        imageWidth,
        imageHeight,
        midlineX,
        toothStartY,
        toothHeight,
        proportionTheory = 'RED',
        referenceWidth = 8, // mm
        pixelPerMM = 10 // píxeles por mm
    } = params;
    
    let proportions = {};
    
    switch (proportionTheory) {
        case 'GOLDEN':
            proportions = calculateGoldenProportion(referenceWidth);
            break;
        case 'CHU':
            proportions = calculateChuProportion(referenceWidth).upper;
            break;
        case 'RED':
        default:
            proportions = calculateREDProportion(referenceWidth * 6); // Aproximadamente 48mm
            break;
    }
    
    const teeth = [
        { id: 18, name: 'Molar 2', side: 'left', proportion: 'molar2' },
        { id: 17, name: 'Molar 1', side: 'left', proportion: 'molar1' },
        { id: 16, name: 'Premolar 2', side: 'left', proportion: 'premolar2' },
        { id: 15, name: 'Premolar 1', side: 'left', proportion: 'premolar1' },
        { id: 14, name: 'Canino', side: 'left', proportion: 'canine' },
        { id: 13, name: 'Lateral', side: 'left', proportion: 'lateral' },
        { id: 12, name: 'Central', side: 'left', proportion: 'central' },
        { id: 11, name: 'Central', side: 'right', proportion: 'central' },
        { id: 21, name: 'Lateral', side: 'right', proportion: 'lateral' },
        { id: 22, name: 'Canino', side: 'right', proportion: 'canine' },
        { id: 23, name: 'Premolar 1', side: 'right', proportion: 'premolar1' },
        { id: 24, name: 'Premolar 2', side: 'right', proportion: 'premolar2' },
        { id: 25, name: 'Molar 1', side: 'right', proportion: 'molar1' },
        { id: 26, name: 'Molar 2', side: 'right', proportion: 'molar2' }
    ];
    
    const boxes = [];
    let currentX = midlineX;
    
    // Dientes derechos (11-16)
    const rightTeeth = teeth.filter(t => t.side === 'right').reverse();
    rightTeeth.forEach((tooth, index) => {
        const proportion = proportions[tooth.proportion];
        if (!proportion) return;
        
        const toothWidthMM = proportion.width || referenceWidth * 0.8;
        const toothWidthPx = toothWidthMM * pixelPerMM;
        
        boxes.push({
            id: tooth.id,
            name: tooth.name,
            x: currentX,
            y: toothStartY,
            width: toothWidthPx,
            height: toothHeight,
            side: 'right'
        });
        
        currentX += toothWidthPx;
    });
    
    // Reiniciar para dientes izquierdos
    currentX = midlineX;
    
    // Dientes izquierdos (17-26)
    const leftTeeth = teeth.filter(t => t.side === 'left');
    leftTeeth.forEach((tooth) => {
        const proportion = proportions[tooth.proportion];
        if (!proportion) return;
        
        const toothWidthMM = proportion.width || referenceWidth * 0.8;
        const toothWidthPx = toothWidthMM * pixelPerMM;
        
        currentX -= toothWidthPx;
        
        boxes.push({
            id: tooth.id,
            name: tooth.name,
            x: currentX,
            y: toothStartY,
            width: toothWidthPx,
            height: toothHeight,
            side: 'left'
        });
    });
    
    return boxes;
};

/**
 * Exporta un resumen de proporciones para mostrar al usuario
 */
export const generateProportionReport = (params) => {
    const { proportionTheory, referenceWidth } = params;
    
    let report = {
        theory: proportionTheory,
        description: '',
        advantages: [],
        clinical_use: ''
    };
    
    switch (proportionTheory) {
        case 'GOLDEN':
            report.description = 'Proporción Áurea (1.618)';
            report.advantages = [
                'Matemáticamente armónica',
                'Universalmente reconocida como bella',
                'Aplicable a cualquier tamaño de sonrisa'
            ];
            report.clinical_use = 'Ideal para casos donde se busca máxima armonía estética';
            break;
        case 'RED':
            report.description = 'RED Proportion (Recurrent Esthetic Dental)';
            report.advantages = [
                'Basada en datos clínicos reales',
                'Adaptable al ancho intercanino del paciente',
                'Proporciona resultados naturales'
            ];
            report.clinical_use = 'Recomendada para la mayoría de casos clínicos';
            break;
        case 'CHU':
            report.description = 'Teoría de Stephen Chu';
            report.advantages = [
                'Cálculo rápido y simple',
                'Relaciones predecibles',
                'Excelente para sonrisas amplias'
            ];
            report.clinical_use = 'Útil para evaluaciones rápidas y planificación inicial';
            break;
        case 'PDI':
            report.description = 'Proporción Dentaria Individual (75-80%)';
            report.advantages = [
                'Enfoque individual para cada diente',
                'Permite personalización',
                'Considera la forma facial'
            ];
            report.clinical_use = 'Ideal para refinamiento de casos complejos';
            break;
    }
    
    return report;
};
