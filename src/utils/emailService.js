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

/**
 * Template para bienvenida de nuevos usuarios
 */
export const getWelcomeTemplate = (userName) => `
    <div style="font-family: sans-serif; color: #312923; max-width: 600px; margin: auto; border: 1px solid #DFD2C4; border-radius: 24px; padding: 40px;">
        <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 20px;">¡Bienvenido a la Bóveda Digital, ${userName}!</h1>
        <p style="font-size: 16px; line-height: 1.6;">Estamos felices de tenerte en <b>ShiningCloud Dental</b>. Tus datos y los de tus pacientes ahora están protegidos bajo los estándares más altos de seguridad.</p>
        <div style="margin: 30px 0;">
            <a href="https://shiningclouddental.cl" style="background-color: #5B6651; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">Entrar a mi Clínica</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #DFD2C4; margin: 30px 0;" />
        <p style="font-size: 12px; color: #9A8F84;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
    </div>
`;
