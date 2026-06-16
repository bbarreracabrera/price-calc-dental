/**
 * ============================================================
 * SERVICIO DE RECORDATORIOS AUTOMÁTICOS ANTI NO-SHOW
 * ShiningCloud Dental
 * ============================================================
 * 
 * ESTADO: ⏳ PENDIENTE DE ACTIVACIÓN
 * 
 * Para activar este servicio, necesitas:
 * 1. WhatsApp Cloud API (Meta):
 *    - Crear cuenta en https://developers.facebook.com/
 *    - Crear una App de tipo "Business"
 *    - Activar el producto "WhatsApp"
 *    - Obtener: WHATSAPP_TOKEN y WHATSAPP_PHONE_ID
 *    - Costo: GRATIS hasta 1.000 conversaciones/mes
 * 
 * 2. Resend (Email):
 *    - Crear cuenta en https://resend.com
 *    - Verificar tu dominio (shiningclouddental.cl)
 *    - Obtener: RESEND_API_KEY
 *    - Costo: GRATIS hasta 3.000 emails/mes
 * 
 * 3. Supabase Edge Functions (Scheduler):
 *    - Ya incluido en tu plan de Supabase
 *    - Crear una Edge Function que se ejecute cada día a las 9:00 AM
 *    - Esta función consultará las citas de los próximos 7 días y enviará recordatorios
 * 
 * INSTRUCCIONES DE ACTIVACIÓN:
 * 1. Agregar al archivo .env:
 *    VITE_WHATSAPP_TOKEN=tu_token_aqui
 *    VITE_WHATSAPP_PHONE_ID=tu_phone_id_aqui
 *    VITE_RESEND_API_KEY=tu_api_key_aqui
 * 
 * 2. Descomentar las funciones sendWhatsAppReminder y sendEmailReminder
 * 3. Desplegar la Edge Function de Supabase (ver archivo supabase/functions/send-reminders/index.ts)
 * ============================================================
 */

// ============================================================
// CONFIGURACIÓN DE RECORDATORIOS
// ============================================================
export const REMINDER_SCHEDULE = [
    { daysBeforeAppt: 7, label: '7 días antes', channel: ['email'] },
    { daysBeforeAppt: 5, label: '5 días antes', channel: ['email'] },
    { daysBeforeAppt: 3, label: '3 días antes', channel: ['whatsapp', 'email'] },
    { daysBeforeAppt: 1, label: '1 día antes',  channel: ['whatsapp', 'email'] },
    { daysBeforeAppt: 0, label: 'Mismo día',    channel: ['whatsapp'] },
];

// ============================================================
// GENERADOR DE MENSAJES PERSONALIZADOS
// ============================================================
export const buildWhatsAppMessage = (patientName, appointmentDate, appointmentTime, clinicName, doctorName) => {
    const firstName = patientName?.split(' ')[0] || 'paciente';
    const dateStr = new Date(appointmentDate).toLocaleDateString('es-CL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return `Hola ${firstName} 👋\n\nTe recordamos que tienes una cita en *${clinicName}* el *${dateStr}* a las *${appointmentTime}*.\n\n👨‍⚕️ Doctor/a: ${doctorName || 'tu dentista'}\n\n¿Necesitas reagendar? Responde este mensaje o llámanos directamente.\n\n_${clinicName} - Powered by ShiningCloud Dental_`;
};

export const buildEmailSubject = (patientName, daysUntil) => {
    const firstName = patientName?.split(' ')[0] || 'paciente';
    if (daysUntil === 0) return `⏰ Recordatorio: Tu cita dental es HOY, ${firstName}`;
    if (daysUntil === 1) return `📅 Tu cita dental es mañana, ${firstName}`;
    return `📅 Recordatorio: Tu cita dental en ${daysUntil} días, ${firstName}`;
};

export const buildEmailBody = (patientName, appointmentDate, appointmentTime, clinicName, doctorName, clinicPhone) => {
    const firstName = patientName?.split(' ')[0] || 'paciente';
    const dateStr = new Date(appointmentDate).toLocaleDateString('es-CL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FDFBF7; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(49,41,35,0.08);">
    
    <!-- Header -->
    <div style="background: #312923; padding: 32px; text-align: center;">
      <h1 style="color: white; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">ShiningCloud Dental</h1>
      <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 6px 0 0; letter-spacing: 2px; text-transform: uppercase;">Recordatorio de Cita</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #312923; font-weight: 700; margin: 0 0 24px;">Hola, ${firstName} 👋</p>
      <p style="font-size: 14px; color: #6B615A; line-height: 1.6; margin: 0 0 24px;">
        Te recordamos que tienes una <strong>cita dental</strong> agendada en <strong>${clinicName}</strong>.
      </p>
      
      <!-- Cita Card -->
      <div style="background: #FDFBF7; border: 1px solid #DFD2C4; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="font-size: 24px;">📅</span>
          <div>
            <p style="font-size: 11px; color: #9A8F84; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 2px;">Fecha</p>
            <p style="font-size: 15px; color: #312923; font-weight: 900; margin: 0; text-transform: capitalize;">${dateStr}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="font-size: 24px;">⏰</span>
          <div>
            <p style="font-size: 11px; color: #9A8F84; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 2px;">Hora</p>
            <p style="font-size: 15px; color: #312923; font-weight: 900; margin: 0;">${appointmentTime}</p>
          </div>
        </div>
        ${doctorName ? `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">👨‍⚕️</span>
          <div>
            <p style="font-size: 11px; color: #9A8F84; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 2px;">Profesional</p>
            <p style="font-size: 15px; color: #312923; font-weight: 900; margin: 0;">${doctorName}</p>
          </div>
        </div>` : ''}
      </div>
      
      <p style="font-size: 13px; color: #9A8F84; line-height: 1.6; margin: 0 0 24px;">
        ¿Necesitas reagendar o tienes alguna consulta? Contáctanos al <strong>${clinicPhone || '+56 9 XXXX XXXX'}</strong>.
      </p>
      
      <!-- CTA -->
      <a href="https://wa.me/56${(clinicPhone || '').replace(/\D/g, '')}" 
         style="display: block; background: #25D366; color: white; text-align: center; padding: 14px; border-radius: 12px; font-weight: 900; font-size: 13px; text-decoration: none; letter-spacing: 0.5px;">
        💬 Contactar por WhatsApp
      </a>
    </div>
    
    <!-- Footer -->
    <div style="background: #FDFBF7; padding: 20px 32px; border-top: 1px solid #DFD2C4; text-align: center;">
      <p style="font-size: 10px; color: #9A8F84; margin: 0;">
        ${clinicName} · Powered by <strong>ShiningCloud Dental</strong>
      </p>
    </div>
  </div>
</body>
</html>`;
};

// ============================================================
// ENVÍO VÍA WHATSAPP CLOUD API (META)
// ⏳ PENDIENTE: Descomentar cuando tengas las API keys
// ============================================================
export const sendWhatsAppReminder = async (toPhone, message) => {
    // TODO: Activar cuando se obtengan las credenciales de Meta WhatsApp Cloud API
    // const WHATSAPP_TOKEN = import.meta.env.VITE_WHATSAPP_TOKEN;
    // const PHONE_ID = import.meta.env.VITE_WHATSAPP_PHONE_ID;
    // 
    // if (!WHATSAPP_TOKEN || !PHONE_ID) {
    //     console.warn('[ReminderService] WhatsApp API no configurada. Agrega VITE_WHATSAPP_TOKEN y VITE_WHATSAPP_PHONE_ID al .env');
    //     return { success: false, reason: 'not_configured' };
    // }
    // 
    // const cleanPhone = toPhone.replace(/\D/g, '');
    // const fullPhone = cleanPhone.startsWith('56') ? cleanPhone : `56${cleanPhone}`;
    // 
    // const res = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         messaging_product: 'whatsapp',
    //         to: fullPhone,
    //         type: 'text',
    //         text: { body: message }
    //     })
    // });
    // 
    // const data = await res.json();
    // return { success: res.ok, data };

    // MODO FALLBACK: Generar enlace de WhatsApp manual mientras no hay API
    const cleanPhone = toPhone?.replace(/\D/g, '') || '';
    const fullPhone = cleanPhone.startsWith('56') ? cleanPhone : `56${cleanPhone}`;
    return {
        success: false,
        reason: 'not_configured',
        fallbackUrl: `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
    };
};

// ============================================================
// ENVÍO VÍA RESEND (EMAIL)
// ⏳ PENDIENTE: Descomentar cuando tengas la API key de Resend
// ============================================================
export const sendEmailReminder = async (toEmail, subject, htmlBody, fromName = 'ShiningCloud Dental') => {
    // TODO: Activar cuando se obtenga la API key de Resend
    // const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
    // 
    // if (!RESEND_API_KEY) {
    //     console.warn('[ReminderService] Resend API no configurada. Agrega VITE_RESEND_API_KEY al .env');
    //     return { success: false, reason: 'not_configured' };
    // }
    // 
    // const res = await fetch('https://api.resend.com/emails', {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `Bearer ${RESEND_API_KEY}`,
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //         from: `${fromName} <hola@shiningclouddental.cl>`,
    //         to: [toEmail],
    //         subject,
    //         html: htmlBody,
    //     })
    // });
    // 
    // const data = await res.json();
    // return { success: res.ok, data };

    console.info('[ReminderService] Email pendiente de activación:', { toEmail, subject });
    return { success: false, reason: 'not_configured' };
};

// ============================================================
// ORQUESTADOR PRINCIPAL DE RECORDATORIOS
// Llama a esta función desde la agenda al guardar una cita
// ============================================================
export const scheduleRemindersForAppointment = async (appointment, patient, clinicConfig) => {
    const {
        date: apptDate,
        time: apptTime,
        doctorName,
    } = appointment;

    const {
        personal: { legalName: patientName, phone: patientPhone, email: patientEmail } = {}
    } = patient;

    const {
        clinicName = 'Tu Clínica Dental',
        clinicPhone = '',
    } = clinicConfig || {};

    const apptDateTime = new Date(`${apptDate}T${apptTime || '10:00'}:00`);
    const now = new Date();
    const daysUntilAppt = Math.ceil((apptDateTime - now) / (1000 * 60 * 60 * 24));

    const results = [];

    for (const schedule of REMINDER_SCHEDULE) {
        if (schedule.daysBeforeAppt > daysUntilAppt) continue; // Ya pasó esa ventana

        // WhatsApp
        if (schedule.channel.includes('whatsapp') && patientPhone) {
            const message = buildWhatsAppMessage(patientName, apptDate, apptTime, clinicName, doctorName);
            const result = await sendWhatsAppReminder(patientPhone, message);
            results.push({ type: 'whatsapp', schedule: schedule.label, ...result });
        }

        // Email
        if (schedule.channel.includes('email') && patientEmail) {
            const subject = buildEmailSubject(patientName, schedule.daysBeforeAppt);
            const html = buildEmailBody(patientName, apptDate, apptTime, clinicName, doctorName, clinicPhone);
            const result = await sendEmailReminder(patientEmail, subject, html, clinicName);
            results.push({ type: 'email', schedule: schedule.label, ...result });
        }
    }

    return results;
};

// ============================================================
// GENERADOR DE ENLACE WHATSAPP RÁPIDO (DISPONIBLE AHORA)
// Úsalo para el botón manual de recordatorio en la agenda
// ============================================================
export const getWhatsAppReminderLink = (appointment, patient, clinicName) => {
    const phone = patient?.personal?.phone?.replace(/\D/g, '') || '';
    const fullPhone = phone.startsWith('56') ? phone : `56${phone}`;
    const message = buildWhatsAppMessage(
        patient?.personal?.legalName,
        appointment?.date,
        appointment?.time,
        clinicName || 'la clínica',
        appointment?.doctorName
    );
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
};
