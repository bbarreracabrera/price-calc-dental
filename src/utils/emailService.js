/**
 * Servicio de Email Profesional (Resend)
 * Para activar, configura VITE_RESEND_API_KEY en tu .env
 */

export const sendProfessionalEmail = async ({ to, subject, html }) => {
    const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
        console.warn("Resend API Key no configurada. El correo no se enviará.");
        return { success: false, error: "Missing API Key" };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'ShiningCloud Dental <hola@shiningclouddental.cl>',
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
            }),
        });

        const data = await response.json();
        if (response.ok) {
            return { success: true, id: data.id };
        } else {
            throw new Error(data.message || 'Error enviando email');
        }
    } catch (error) {
        console.error("Error en EmailService:", error);
        return { success: false, error: error.message };
    }
};
