import { supabase } from '../supabase';

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_PATIENT_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_LAB_SIZE = 50 * 1024 * 1024; // 50MB para archivos de lab
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const ALLOWED_PATIENT_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];
    const ALLOWED_LAB_TYPES = ['model/stl', 'application/zip', 'application/x-rar-compressed', 'application/dicom', 'image/jpeg', 'image/png', 'application/pdf']; // Añadir tipos de archivo de laboratorio

// Valida los primeros bytes reales del archivo contra su tipo MIME declarado.
// Previene upload de SVG maliciosos o archivos políglotos disfrazados de imagen.
async function validateMagicBytes(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arr = new Uint8Array(e.target.result);
            const text = new TextDecoder('utf-8', { fatal: false })
                .decode(arr.slice(0, 256))
                .trimStart()
                .toLowerCase();

            // Rechazar SVG/XML sin importar el MIME reportado por el navegador
            if (
                text.startsWith('<svg') ||
                text.startsWith('<?xml') ||
                text.includes('<script')
            ) {
                resolve(false);
                return;
            }

            switch (file.type) {
                case 'image/jpeg':
                    resolve(arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF);
                    break;
                case 'image/png':
                    resolve(
                        arr[0] === 0x89 && arr[1] === 0x50 &&
                        arr[2] === 0x4E && arr[3] === 0x47
                    );
                    break;
                case 'image/webp': {
                    const isRiff =
                        arr[0] === 0x52 && arr[1] === 0x49 &&
                        arr[2] === 0x46 && arr[3] === 0x46;
                    const isWebp =
                        arr[8] === 0x57 && arr[9] === 0x45 &&
                        arr[10] === 0x42 && arr[11] === 0x50;
                    resolve(isRiff && isWebp);
                    break;
                }
                case 'image/gif':
                    resolve(
                        arr[0] === 0x47 && arr[1] === 0x49 &&
                        arr[2] === 0x46 && arr[3] === 0x38
                    );
                    break;
                case 'application/pdf':
                    resolve(
                        arr[0] === 0x25 && arr[1] === 0x50 &&
                        arr[2] === 0x44 && arr[3] === 0x46
                    );
                    break;
                default:
                    resolve(false);
            }
        };
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsArrayBuffer(file.slice(0, 256));
    });
}

// 1. FUNCIÓN PARA SUBIR EL LOGO DE LA CLÍNICA
export const uploadLogo = async (e, context) => {
    const { setUploading, notify, config, setConfigLocal, saveToSupabase } = context;
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE) {
        notify('El archivo es demasiado grande (máximo 5MB)');
        return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        notify('Solo se permiten imágenes JPG, PNG, WEBP o GIF');
        return;
    }
    const magicValid = await validateMagicBytes(file);
    if (!magicValid) {
        notify('El archivo no es una imagen válida');
        return;
    }

    setUploading(true);
    notify('Subiendo logo...');

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `logo_${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('clinic-logos')
            .upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('clinic-logos')
            .getPublicUrl(fileName);
        const newConfig = { ...config, logo: publicUrl };
        setConfigLocal(newConfig);
        await saveToSupabase('settings', 'general', newConfig);
        notify('Logo actualizado con éxito');
    } catch (err) {
        console.error(err);
        notify('Error subiendo el logo');
    } finally {
        setUploading(false);
    }
};

// 2. FUNCIÓN PARA SUBIR IMÁGENES/ARCHIVOS DE PACIENTES
export const uploadPatientImage = async (file, context, fileType = 'clinical') => {
    const {
        selectedPatientId, setUploading, getPatient,
        activeFolder, savePatientData, notify, logAction,
    } = context;

    if (!file || !selectedPatientId) {
        console.error('No se detectó el archivo o el paciente', { file, selectedPatientId });
        return;
    }

    const currentMaxSize = fileType === 'lab' ? MAX_LAB_SIZE : MAX_PATIENT_SIZE;
    if (file.size > currentMaxSize) {
        notify(`El archivo es demasiado grande (máximo ${currentMaxSize / (1024 * 1024)}MB)`);
        return;
    }
    const currentAllowedTypes = fileType === 'lab' ? ALLOWED_LAB_TYPES : ALLOWED_PATIENT_TYPES;
    if (!currentAllowedTypes.includes(file.type)) {
        notify(`Tipo de archivo no permitido para ${fileType === 'lab' ? 'Laboratorio' : 'Ficha Clínica'}`);
        return;
    }
    const magicValid = await validateMagicBytes(file);
    if (!magicValid) {
        notify('El archivo no es válido o está corrupto');
        return;
    }

    setUploading(true);
    notify('Subiendo archivo...');

    try {
        const fileName = `${selectedPatientId}_${Date.now()}.${file.name.split('.').pop()}`;
        const bucketName = fileType === 'lab' ? 'lab_works' : 'patient-images';
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file);
        if (uploadError) throw uploadError;

        const p = getPatient(selectedPatientId);
        let fileUrl = fileName;
        if (fileType === 'lab') {
            // Para archivos de laboratorio, no guardamos la URL pública directamente, sino la ruta
            // La URL segura se generará al momento de la visualización
            fileUrl = fileName;
        } else {
            // Para imágenes clínicas, seguimos usando la URL pública si el bucket es público
            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
            fileUrl = publicUrlData.publicUrl;
        }

        const updatedFiles = [...(p.files || []), {
            id: Date.now(),
            path: fileName,
            url: fileUrl, // Guardar la URL pública o la ruta según el tipo
            date: new Date().toLocaleDateString('es-CL'),
            folder: activeFolder,
            type: fileType, // Añadir el tipo de archivo
        }];

        await savePatientData(selectedPatientId, { ...p, files: updatedFiles });
        notify(`Archivo guardado en ${activeFolder}`);
        logAction('UPLOAD_FILE', { fileName, folder: activeFolder, fileType }, selectedPatientId);
    } catch (err) {
        notify(`Error al subir: ${err.message}`);
    } finally {
        setUploading(false);
    }
};
