/**
 * Dimensiones físicas reales (Área Activa) de sensores intraorales comunes.
 * Los valores están en milímetros (mm).
 * Fuente: Manuales técnicos de fabricantes (Schick, Carestream, Dexis, Vatech).
 */
export const DENTAL_SENSORS = [
    { 
        id: 'generic_size_2', 
        name: 'Genérico - Tamaño 2 (Adulto)', 
        brand: 'Generic',
        activeWidth: 26.0, 
        activeHeight: 36.0,
        description: 'Estándar para la mayoría de los sensores tamaño 2'
    },
    { 
        id: 'generic_size_1', 
        name: 'Genérico - Tamaño 1 (Niño/Adulto Pequeño)', 
        brand: 'Generic',
        activeWidth: 20.0, 
        activeHeight: 30.0,
        description: 'Estándar para sensores tamaño 1'
    },
    { 
        id: 'generic_size_0', 
        name: 'Genérico - Tamaño 0 (Pediátrico)', 
        brand: 'Generic',
        activeWidth: 18.0, 
        activeHeight: 24.0,
        description: 'Estándar para sensores tamaño 0'
    },
    { 
        id: 'schick_33_s2', 
        name: 'Schick 33 - Size 2', 
        brand: 'Schick',
        activeWidth: 25.6, 
        activeHeight: 36.0,
        description: 'Sensor de alta resolución Dentsply Sirona'
    },
    { 
        id: 'schick_33_s1', 
        name: 'Schick 33 - Size 1', 
        brand: 'Schick',
        activeWidth: 20.0, 
        activeHeight: 30.0 
    },
    { 
        id: 'carestream_rvg_6200_s2', 
        name: 'Carestream RVG 6200 - Size 2', 
        brand: 'Carestream',
        activeWidth: 26.0, 
        activeHeight: 36.0 
    },
    { 
        id: 'carestream_rvg_6200_s1', 
        name: 'Carestream RVG 6200 - Size 1', 
        brand: 'Carestream',
        activeWidth: 20.0, 
        activeHeight: 30.0 
    },
    { 
        id: 'dexis_titanium_s2', 
        name: 'Dexis Titanium - Size 2', 
        brand: 'Dexis',
        activeWidth: 26.1, 
        activeHeight: 36.0 
    },
    { 
        id: 'vatech_ezsensor_s2', 
        name: 'Vatech EzSensor - Size 2', 
        brand: 'Vatech',
        activeWidth: 25.0, 
        activeHeight: 35.0 
    },
    { 
        id: 'woodpecker_i_sensor_s2', 
        name: 'Woodpecker i-Sensor - Size 2', 
        brand: 'Woodpecker',
        activeWidth: 26.0, 
        activeHeight: 36.0 
    }
];

/**
 * Calcula el ratio de calibración (píxeles por mm) basándose en el sensor y la imagen.
 * @param {Object} sensor - Objeto del sensor seleccionado.
 * @param {number} imgWidth - Ancho de la imagen en píxeles.
 * @param {number} imgHeight - Alto de la imagen en píxeles.
 * @returns {number} - Ratio de calibración (px/mm).
 */
export const calculateSensorRatio = (sensor, imgWidth, imgHeight) => {
    if (!sensor || !imgWidth || !imgHeight) return null;
    
    // Determinamos si la imagen está en vertical u horizontal para asignar correctamente las dimensiones
    const isPortrait = imgHeight > imgWidth;
    const sensorW = isPortrait ? Math.min(sensor.activeWidth, sensor.activeHeight) : Math.max(sensor.activeWidth, sensor.activeHeight);
    
    // El ratio es Píxeles / Milímetros
    return imgWidth / sensorW;
};
