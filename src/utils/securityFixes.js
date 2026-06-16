import { supabase } from '../supabase';

/**
 * Utilidad para asegurar que todas las URLs de archivos sensibles sean firmadas.
 * Cumple con la Ley 19.628 de Protección de Datos Personales en Chile.
 */
export const getSecureUrl = async (bucket, path, expires = 3600) => {
    if (!path) return null;
    
    // Si ya es una URL firmada o externa (no recomendable para datos sensibles)
    if (path.startsWith('http')) {
        // Si es una URL pública de Supabase, intentamos convertirla a privada
        if (path.includes('.supabase.co/storage/v1/object/public/')) {
            const newPath = path.split(`/public/${bucket}/`)[1];
            if (newPath) return getSecureUrl(bucket, newPath, expires);
        }
        return path;
    }

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires);
    if (error) {
        console.error(`Error generando URL firmada para ${bucket}/${path}:`, error);
        return null;
    }
    return data.signedUrl;
};

/**
 * Validador de archivos extendido para Laboratorio (Soporta STL, DICOM, ZIP)
 */
export const validateFileSecurity = async (file, type = 'clinical') => {
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB para archivos de lab
    if (file.size > MAX_SIZE) throw new Error('El archivo excede el límite de 50MB');

    const extension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = {
        clinical: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
        lab: ['stl', 'obj', 'zip', 'rar', 'dicom', 'dcm', 'jpg', 'jpeg', 'png', 'pdf']
    };

    if (!allowedExtensions[type].includes(extension)) {
        throw new Error(`Tipo de archivo .${extension} no permitido para ${type === 'lab' ? 'Laboratorio' : 'Ficha Clínica'}`);
    }

    // Validación básica de Magic Bytes para imágenes/PDF
    if (['jpg', 'jpeg', 'png', 'pdf'].includes(extension)) {
        const header = await readFileHeader(file);
        const isSafe = checkMagicBytes(header, extension);
        if (!isSafe) throw new Error('El contenido del archivo no coincide con su extensión (Posible archivo malicioso)');
    }

    return true;
};

const readFileHeader = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(new Uint8Array(e.target.result));
        reader.readAsArrayBuffer(file.slice(0, 4));
    });
};

const checkMagicBytes = (header, ext) => {
    const hex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    switch (ext) {
        case 'jpg': case 'jpeg': return hex.startsWith('FFD8FF');
        case 'png': return hex.startsWith('89504E47');
        case 'pdf': return hex.startsWith('25504446');
        default: return true;
    }
};
