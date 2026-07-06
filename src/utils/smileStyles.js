/**
 * Biblioteca de Estilos de Sonrisa basada en Visagismo
 * Mapeo entre forma dental, psicología y propuesta estética
 * 
 * Basado en la teoría de que la forma de los dientes comunica
 * rasgos de personalidad y permite personalizar la propuesta al paciente
 */

export const SMILE_STYLES = {
    OVAL: {
        id: 'oval',
        name: 'Oval',
        emoji: '◯',
        color: '#8B7355',
        colorHex: '#D4A574',
        description: 'Armonía y Suavidad',
        
        // Características visuales
        visual: {
            dominantCentrals: true,
            roundedCusps: true,
            delicateLaterals: true,
            smileLineShape: 'round',
            archShape: 'round'
        },
        
        // Atributos emocionales
        personality: {
            primary: 'Sensible',
            secondary: 'Melancholic',
            traits: [
                'Organizado',
                'Perfeccionista',
                'Artístico',
                'Abstracto',
                'Tímido',
                'Reservado'
            ]
        },
        
        // Descripción clínica
        clinical: {
            centralWidth: 'Ancho',
            lateralWidth: 'Estrecho',
            canineWidth: 'Moderado',
            incisorEdge: 'Redondeado',
            contactPoints: 'Suaves'
        },
        
        // Propuesta al paciente
        proposal: {
            title: 'Sonrisa Armónica y Elegante',
            description: 'Un diseño que transmite serenidad, equilibrio y sofisticación. Ideal para quienes buscan una sonrisa que refleje calma y elegancia natural.',
            benefits: [
                '✓ Aspecto natural y equilibrado',
                '✓ Transmite confianza y serenidad',
                '✓ Proporciones clásicas y atemporales',
                '✓ Versátil para cualquier contexto'
            ],
            idealFor: 'Pacientes que valoran la armonía y el equilibrio estético'
        },
        
        // Proporciones recomendadas
        proportions: {
            theory: 'GOLDEN',
            pdi: 0.78,
            description: 'Proporción Áurea con PDI ideal (78%)'
        }
    },
    
    TRIANGULAR: {
        id: 'triangular',
        name: 'Triangular',
        emoji: '△',
        color: '#FF6B9D',
        colorHex: '#FF8AB9',
        description: 'Energía y Dinamismo',
        
        visual: {
            ascendantSmileLine: true,
            convergingAxis: true,
            inclinedCusps: true,
            smileLineShape: 'ascending',
            archShape: 'triangular'
        },
        
        personality: {
            primary: 'Dynamic',
            secondary: 'Sanguine',
            traits: [
                'Extrovertido',
                'Comunicativo',
                'Entusiasta',
                'Dinámico',
                'Impulsivo',
                'Expresivo'
            ]
        },
        
        clinical: {
            centralWidth: 'Moderado',
            lateralWidth: 'Estrecho',
            canineWidth: 'Prominente',
            incisorEdge: 'Angulado',
            contactPoints: 'Agudos'
        },
        
        proposal: {
            title: 'Sonrisa Joven y Expresiva',
            description: 'Un diseño dinámico que comunica juventud, energía y vitalidad. Perfecto para quienes desean una sonrisa que refleje su personalidad activa y comunicativa.',
            benefits: [
                '✓ Aspecto juvenil y fresco',
                '✓ Transmite energía y dinamismo',
                '✓ Ideal para sonrisas amplias',
                '✓ Impacto visual inmediato'
            ],
            idealFor: 'Pacientes jóvenes o con personalidad extrovertida'
        },
        
        proportions: {
            theory: 'RED',
            pdi: 0.75,
            description: 'RED Proportion con PDI moderno (75%)'
        }
    },
    
    RECTANGULAR: {
        id: 'rectangular',
        name: 'Rectangular',
        emoji: '▭',
        color: '#FFD700',
        colorHex: '#FFA500',
        description: 'Fuerza y Determinación',
        
        visual: {
            dominantCentrals: true,
            flatIncisalEdge: true,
            aggressiveCusps: true,
            smileLineShape: 'vertical',
            archShape: 'rectangular'
        },
        
        personality: {
            primary: 'Strong',
            secondary: 'Choleric',
            traits: [
                'Determinado',
                'Objetivo',
                'Explosivo',
                'Intenso',
                'Emprendedor',
                'Apasionado'
            ]
        },
        
        clinical: {
            centralWidth: 'Muy Ancho',
            lateralWidth: 'Moderado',
            canineWidth: 'Ancho',
            incisorEdge: 'Recto',
            contactPoints: 'Amplios'
        },
        
        proposal: {
            title: 'Sonrisa Fuerte y Segura',
            description: 'Un diseño que comunica poder, confianza y determinación. Ideal para profesionales que desean proyectar autoridad y seguridad.',
            benefits: [
                '✓ Aspecto maduro y profesional',
                '✓ Transmite confianza y autoridad',
                '✓ Impacto visual potente',
                '✓ Ideal para líderes y emprendedores'
            ],
            idealFor: 'Pacientes profesionales o con personalidad fuerte'
        },
        
        proportions: {
            theory: 'CHU',
            pdi: 0.80,
            description: 'Teoría Chu con PDI clásico (80%)'
        }
    },
    
    SQUARE: {
        id: 'square',
        name: 'Cuadrado',
        emoji: '▢',
        color: '#87CEEB',
        colorHex: '#4A90E2',
        description: 'Calma y Equilibrio',
        
        visual: {
            lackOfDominance: true,
            divergingAxis: true,
            horizontalArrangement: true,
            smileLineShape: 'horizontal',
            archShape: 'square'
        },
        
        personality: {
            primary: 'Calm',
            secondary: 'Phlegmatic',
            traits: [
                'Diplomático',
                'Pacífico',
                'Místico',
                'Espiritualizado',
                'Conformista',
                'Discreto'
            ]
        },
        
        clinical: {
            centralWidth: 'Moderado',
            lateralWidth: 'Similar',
            canineWidth: 'Similar',
            incisorEdge: 'Horizontal',
            contactPoints: 'Uniformes'
        },
        
        proposal: {
            title: 'Sonrisa Serena y Equilibrada',
            description: 'Un diseño que transmite paz, estabilidad y equilibrio. Perfecto para quienes buscan una sonrisa que refleje su naturaleza tranquila y reflexiva.',
            benefits: [
                '✓ Aspecto tranquilo y accesible',
                '✓ Transmite paz y estabilidad',
                '✓ Proporciones simétricas',
                '✓ Fácil de mantener'
            ],
            idealFor: 'Pacientes que valoran la paz y el equilibrio'
        },
        
        proportions: {
            theory: 'PDI',
            pdi: 0.82,
            description: 'PDI personalizado (82%) para máxima armonía'
        }
    }
};

/**
 * Obtiene un estilo por ID
 */
export const getSmileStyle = (styleId) => {
    return Object.values(SMILE_STYLES).find(s => s.id === styleId);
};

/**
 * Obtiene todos los estilos
 */
export const getAllSmileStyles = () => {
    return Object.values(SMILE_STYLES);
};

/**
 * Genera una descripción completa del estilo para mostrar al paciente
 */
export const generateStylePresentation = (styleId) => {
    const style = getSmileStyle(styleId);
    if (!style) return null;
    
    return {
        title: style.proposal.title,
        description: style.proposal.description,
        personality: style.personality,
        benefits: style.proposal.benefits,
        idealFor: style.proposal.idealFor,
        clinical: style.clinical,
        proportions: style.proportions,
        visual: style.visual
    };
};

/**
 * Calcula recomendaciones de estilo basadas en características del paciente
 */
export const recommendSmileStyle = (params) => {
    const {
        faceShape,        // 'oval', 'round', 'square', 'oblong'
        personality,      // 'introvert', 'extrovert', 'balanced'
        age,              // número
        profession,       // 'professional', 'creative', 'other'
        preference        // 'conservative', 'modern', 'bold'
    } = params;
    
    let recommendations = [];
    
    // Lógica de recomendación basada en características
    if (personality === 'extrovert' && preference === 'bold') {
        recommendations.push({
            style: SMILE_STYLES.TRIANGULAR,
            score: 95,
            reason: 'Perfecto para tu personalidad dinámica y expresiva'
        });
    }
    
    if (profession === 'professional' && preference === 'conservative') {
        recommendations.push({
            style: SMILE_STYLES.RECTANGULAR,
            score: 90,
            reason: 'Transmite profesionalismo y autoridad'
        });
    }
    
    if (personality === 'introvert' && preference === 'conservative') {
        recommendations.push({
            style: SMILE_STYLES.OVAL,
            score: 85,
            reason: 'Elegancia y armonía natural'
        });
    }
    
    if (preference === 'modern') {
        recommendations.push({
            style: SMILE_STYLES.TRIANGULAR,
            score: 80,
            reason: 'Aspecto contemporáneo y fresco'
        });
    }
    
    // Siempre incluir el estilo cuadrado como opción equilibrada
    recommendations.push({
        style: SMILE_STYLES.SQUARE,
        score: 75,
        reason: 'Opción equilibrada y versátil'
    });
    
    // Ordenar por puntuación
    return recommendations.sort((a, b) => b.score - a.score);
};

/**
 * Exporta un resumen comparativo de estilos
 */
export const generateStyleComparison = (styleIds) => {
    return styleIds.map(id => {
        const style = getSmileStyle(id);
        return {
            name: style.name,
            emoji: style.emoji,
            color: style.colorHex,
            personality: style.personality.primary,
            traits: style.personality.traits,
            benefits: style.proposal.benefits
        };
    });
};
