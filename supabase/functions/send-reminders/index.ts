/**
 * ShiningCloud Dental — Edge Function: send-reminders
 * =====================================================
 * Envía recordatorios automáticos de citas por email (Resend)
 * 
 * ACTIVACIÓN:
 * 1. Configurar en Supabase Dashboard > Edge Functions > Secrets:
 *    - RESEND_API_KEY=re_xxxxxxxxxxxx
 *    - RESEND_FROM_EMAIL=hola@shiningclouddental.cl  (o @resend.dev mientras no hay dominio)
 *    - SUPABASE_URL=https://xxxx.supabase.co
 *    - SUPABASE_SERVICE_ROLE_KEY=eyJxx...
 * 
 * 2. Programar con pg_cron en Supabase SQL Editor:
 *    SELECT cron.schedule('send-reminders-daily', '0 9 * * *', 
 *      $$SELECT net.http_post(url := 'https://xxxx.supabase.co/functions/v1/send-reminders',
 *        headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb)$$);
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) {
        return new Response(
            JSON.stringify({ message: "RESEND_API_KEY no configurada. Recordatorios desactivados." }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Calcular fechas objetivo: mañana (1 día) y en 3 días
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Obtener citas de mañana y en 3 días que tengan email del paciente
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, data, admin_email')
        .in('data->>date', [formatDate(tomorrow), formatDate(in3Days)])
        .limit(100);

    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const appt of appointments || []) {
        const d = appt.data || {};
        const patientEmail = d.patientEmail || d.email;
        const patientName = d.name || d.patientName || 'Paciente';
        const apptDate = d.date;
        const apptTime = d.time || '';
        const clinicName = d.clinicName || appt.admin_email?.split('@')[0] || 'tu clínica';

        if (!patientEmail) { skipped++; continue; }

        const daysUntil = Math.round(
            (new Date(apptDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const subject = daysUntil === 1
            ? `⏰ Recordatorio: Tu cita es mañana — ${clinicName}`
            : `📅 Recordatorio: Tu cita es en ${daysUntil} días — ${clinicName}`;

        const html = buildReminderHTML({ patientName, apptDate, apptTime, clinicName, daysUntil });

        try {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: `${clinicName} <${FROM_EMAIL}>`,
                    to: patientEmail,
                    subject,
                    html,
                }),
            });

            if (res.ok) {
                sent++;
                // Registrar el envío para evitar duplicados
                await supabase.from('reminder_log').insert({
                    appointment_id: appt.id,
                    patient_email: patientEmail,
                    sent_at: new Date().toISOString(),
                    days_before: daysUntil,
                }).maybeSingle();
            } else {
                const errText = await res.text();
                errors.push(`${patientEmail}: ${errText}`);
            }
        } catch (e) {
            errors.push(`${patientEmail}: ${(e as Error).message}`);
        }
    }

    return new Response(
        JSON.stringify({ success: true, sent, skipped, errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
});

function buildReminderHTML({ patientName, apptDate, apptTime, clinicName, daysUntil }: {
    patientName: string;
    apptDate: string;
    apptTime: string;
    clinicName: string;
    daysUntil: number;
}): string {
    const firstName = patientName.split(' ')[0];
    const dateFormatted = new Date(apptDate + 'T12:00:00').toLocaleDateString('es-CL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const urgencyText = daysUntil === 1
        ? '¡Tu cita es <strong>mañana</strong>!'
        : `Tu cita es en <strong>${daysUntil} días</strong>.`;

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.wrapper{max-width:600px;margin:0 auto;background:#FDFBF7;border:1px solid #DFD2C4;border-radius:16px;overflow:hidden}
.header{background:#312923;padding:24px 32px;color:#fff}
.header-logo{font-weight:700;font-size:16px}
.header-logo span{color:#CBAAA2}
.content{padding:32px}
.badge{display:inline-block;padding:4px 12px;background:rgba(91,102,81,0.1);border:1px solid rgba(91,102,81,0.3);border-radius:999px;font-size:11px;font-weight:600;color:#5B6651;margin-bottom:16px;letter-spacing:1px;text-transform:uppercase}
.title{font-size:22px;font-weight:700;color:#312923;margin:0 0 12px;line-height:1.3}
.text{color:#9A8F84;font-size:14px;line-height:1.7;margin:0 0 24px}
.text strong{color:#312923;font-weight:600}
.card{background:#fff;border:1px solid #DFD2C4;border-radius:12px;padding:20px;margin:0 0 24px}
.card-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0ebe4;font-size:14px}
.card-row:last-child{border-bottom:none}
.card-label{color:#9A8F84;font-weight:500}
.card-value{color:#312923;font-weight:700}
.footer{background:#fff;border-top:1px solid #DFD2C4;padding:16px 32px;text-align:center}
.footer p{font-size:11px;color:#9A8F84;margin:0}
.footer a{color:#5B6651;text-decoration:none}
</style></head>
<body><div class="wrapper">
<div class="header"><div class="header-logo">ShiningCloud<span>Dental</span></div></div>
<div class="content">
<div class="badge">Recordatorio de Cita</div>
<h1 class="title">Hola ${firstName}, ${urgencyText}</h1>
<p class="text">Te recordamos que tienes una cita programada en <strong>${clinicName}</strong>. Te esperamos puntual.</p>
<div class="card">
  <div class="card-row"><span class="card-label">Fecha</span><span class="card-value">${dateFormatted}</span></div>
  ${apptTime ? `<div class="card-row"><span class="card-label">Hora</span><span class="card-value">${apptTime}</span></div>` : ''}
  <div class="card-row"><span class="card-label">Clínica</span><span class="card-value">${clinicName}</span></div>
</div>
<p class="text" style="font-size:12px">¿Necesitas reagendar? Contáctanos directamente respondiendo este correo.</p>
</div>
<div class="footer"><p>Enviado por <strong>${clinicName}</strong> a través de ShiningCloud Dental<br>
<a href="https://shiningclouddental.vercel.app">shiningclouddental.vercel.app</a></p></div>
</div></body></html>`;
}
