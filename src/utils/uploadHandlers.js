import { supabase } from '../supabase';

// 1. FUNCIÓN PARA SUBIR EL LOGO DE LA CLÍNICA
export const uploadLogo = async (e, context) => {
    const { setUploading, notify, clinicOwner, session, config, setConfigLocal, saveToSupabase } = context;
    const file = e.target.files[0]; 
    if (!file) return; 
    
    setUploading(true);
    notify("Subiendo logo...");
    
    try {
        const fileName = `logo_${clinicOwner || session.user.email}_file`;
        const { error: uploadError } = await supabase.storage.from('clinic-logos').upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('clinic-logos').getPublicUrl(fileName);
        const newConfig = { ...config, logo: publicUrl }; 
        setConfigLocal(newConfig); 
        await saveToSupabase('settings', 'general', newConfig); 
        notify("Logo Actualizado con éxito"); 
    } catch (err) {
        console.error(err);
        alert("Error subiendo el logo");
    } finally {
        setUploading(false);
    }
};

// 2. FUNCIÓN PARA SUBIR IMÁGENES/ARCHIVOS DE PACIENTES
export const uploadPatientImage = async (file, context) => {
    const { selectedPatientId, setUploading, getPatient, activeFolder, savePatientData, notify, logAction } = context;
    
    // Si no hay archivo o paciente, avisamos en consola para no fallar en silencio
    if (!file || !selectedPatientId) {
        console.error("No se detectó el archivo o el paciente", { file, selectedPatientId });
        return; 
    }
    
    setUploading(true);
    notify("Subiendo archivo..."); // Aviso visual de que empezó
    
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
        alert(`Error al subir: ${err.message}`); 
    } finally { 
        setUploading(false); 
    }
};