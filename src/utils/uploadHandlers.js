import { supabase } from '../supabase';

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PATIENT_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_PATIENT_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

// 1. FUNCIÓN PARA SUBIR EL LOGO DE LA CLÍNICA
export const uploadLogo = async (e, context) => {
    const { setUploading, notify, clinicOwner, session, config, setConfigLocal, saveToSupabase } = context;
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

    setUploading(true);
    notify("Subiendo logo...");
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `logo_${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('clinic-logos').upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('clinic-logos').getPublicUrl(fileName);
        const newConfig = { ...config, logo: publicUrl }; 
        setConfigLocal(newConfig); 
        await saveToSupabase('settings', 'general', newConfig); 
        notify("Logo Actualizado con éxito"); 
    } catch (err) {
        console.error(err);
        notify("Error subiendo el logo");
    } finally {
        setUploading(false);
    }
};

// 2. FUNCIÓN PARA SUBIR IMÁGENES/ARCHIVOS DE PACIENTES
export const uploadPatientImage = async (file, context) => {
    const { selectedPatientId, setUploading, getPatient, activeFolder, savePatientData, notify, logAction } = context;
    
    if (!file || !selectedPatientId) {
        console.error("No se detectó el archivo o el paciente", { file, selectedPatientId });
        return;
    }

    if (file.size > MAX_PATIENT_SIZE) {
        notify('El archivo es demasiado grande (máximo 10MB)');
        return;
    }
    if (!ALLOWED_PATIENT_TYPES.includes(file.type)) {
        notify('Solo se permiten imágenes (JPG, PNG, WEBP, GIF) o PDF');
        return;
    }

    setUploading(true);
    notify("Subiendo archivo...");
    
    try {
        const fileName = `${selectedPatientId}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('patient-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const p = getPatient(selectedPatientId);
        const updatedImages = [...(p.images || []), { 
            id: Date.now(), 
            path: fileName, 
            url: fileName, 
            date: new Date().toLocaleDateString('es-CL'),
            folder: activeFolder 
        }];
        
        await savePatientData(selectedPatientId, { ...p, images: updatedImages });
        notify(`Archivo guardado exitosamente en ${activeFolder}`);
        logAction('UPLOAD_IMAGE', { fileName, folder: activeFolder }, selectedPatientId); 
    } catch (err) {
        notify(`Error al subir: ${err.message}`);
    } finally { 
        setUploading(false); 
    }
};