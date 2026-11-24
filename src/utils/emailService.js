/**
 * Servicio de Email Profesional (Resend vía Edge Function)
 * El envío se delega a la Edge Function `send-email`, que lee la API key
 * de Resend desde los secrets del servidor (RESEND_API_KEY). La key ya no
 * se expone en el bundle del cliente (antes se usaba VITE_RESEND_API_KEY).
 */

import { supabase } from '../supabase';

export const sendProfessionalEmail = async ({ to, subject, html }) => {
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: { to, subject, html },
        });

        if (error) {
            console.warn("Error en Edge Function send-email:", error.message);
            return { success: false, error: error.message };
        }

        // La función responde con fallback cuando Resend no está configurado
        if (data?.success === false) {
            console.warn(data?.error || "Resend no configurado. El correo no se enviará.");
            return { success: false, error: data?.error || "Missing API Key" };
        }

        return { success: true, id: data?.id };
    } catch (error) {
        console.error("Error en EmailService:", error);
        return { success: false, error: error.message };
    }
};
