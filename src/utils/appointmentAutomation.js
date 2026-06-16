import { sendProfessionalEmail } from './emailService';

/**
 * Genera el link de WhatsApp para recordatorio de cita
 */
export const getWhatsAppReminderLink = (patientPhone, patientName, date, time, clinicName) => {
    if (!patientPhone) return null;
    
    const message = `Hola ${patientName}, te recordamos tu cita en ${clinicName} para el día ${date} a las ${time}. Por favor confirma tu asistencia. ¡Te esperamos!`;
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = patientPhone.replace(/\s+/g, '').replace('+', '');
    
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Lógica para enviar recordatorio por Email (Resend)
 */
export const sendEmailReminder = async (patientEmail, patientName, date, time, clinicName) => {
    if (!patientEmail) return { success: false, error: "No email provided" };

    const html = `
        <div style="font-family: sans-serif; color: #312923; max-width: 600px; margin: auto; border: 1px solid #DFD2C4; border-radius: 24px; padding: 40px;">
            <h2 style="font-size: 20px; font-weight: 900; margin-bottom: 20px;">Recordatorio de Cita Médica</h2>
            <p style="font-size: 16px; line-height: 1.6;">Hola <b>${patientName}</b>,</p>
            <p style="font-size: 16px; line-height: 1.6;">Te recordamos que tienes una cita agendada en <b>${clinicName}</b>:</p>
            <div style="background-color: #FDFBF7; padding: 20px; border-radius: 16px; border: 1px solid #DFD2C4; margin: 20px 0;">
                <p style="margin: 5px 0;">📅 <b>Fecha:</b> ${date}</p>
                <p style="margin: 5px 0;">⏰ <b>Hora:</b> ${time}</p>
            </div>
            <p style="font-size: 14px; color: #9A8F84;">Si necesitas reagendar, por favor contáctanos con anticipación.</p>
            <hr style="border: 0; border-top: 1px solid #DFD2C4; margin: 30px 0;" />
            <p style="font-size: 10px; color: #9A8F84; text-align: center;">Enviado automáticamente por ShiningCloud Dental</p>
        </div>
    `;

    return await sendProfessionalEmail({
        to: patientEmail,
        subject: `Recordatorio de Cita - ${clinicName}`,
        html
    });
};

/**
 * Validador de conflictos de agenda
 */
export const checkAppointmentConflict = (appointments, newAppt) => {
    return appointments.find(a => 
        a.id !== newAppt.id &&
        a.date === newAppt.date &&
        a.dentist_email === newAppt.dentist_email &&
        a.time === newAppt.time &&
        a.deleted_at === null
    );
};
