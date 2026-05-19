import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { lab_email, lab_name, clinic_name, magic_link } = await req.json();

        if (!lab_email || !clinic_name) {
            return new Response(
                JSON.stringify({ error: "Faltan datos requeridos" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

        if (!RESEND_API_KEY) {
            return new Response(
                JSON.stringify({ fallback: true, message: "Resend no configurado" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const html = buildInviteHTML({
            lab_name: lab_name || "Laboratorio",
            clinic_name,
            magic_link: magic_link || "https://shiningclouddental.vercel.app",
        });

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: `${clinic_name} via ShiningCloud <${FROM_EMAIL}>`,
                to: lab_email,
                subject: `${clinic_name} te invita a su red de laboratorios`,
                html,
            }),
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            throw new Error(`Resend error: ${errorText}`);
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (e) {
        return new Response(
            JSON.stringify({ error: (e as Error).message, fallback: true }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

function buildInviteHTML({ lab_name, clinic_name, magic_link }: {
    lab_name: string;
    clinic_name: string;
    magic_link: string;
}): string {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.wrapper{max-width:600px;margin:0 auto;background:#FDFBF7;border:1px solid #DFD2C4;border-radius:16px;overflow:hidden}
.header{background:#312923;padding:24px 32px;color:#fff}
.header-logo{font-weight:700;font-size:16px}
.header-logo span{color:#CBAAA2}
.content{padding:32px}
.badge{display:inline-block;padding:4px 12px;background:rgba(91,102,81,0.1);border:1px solid rgba(91,102,81,0.3);border-radius:999px;font-size:11px;font-weight:600;color:#5B6651;margin-bottom:16px;letter-spacing:1px}
.title{font-size:22px;font-weight:700;color:#312923;margin:0 0 12px;line-height:1.3}
.text{color:#9A8F84;font-size:14px;line-height:1.7;margin:0 0 24px}
.text strong{color:#312923;font-weight:600}
.card{background:#fff;border:1px solid #DFD2C4;border-radius:12px;padding:16px;margin:0 0 24px}
.card-title{font-size:11px;letter-spacing:1.5px;font-weight:600;color:#9A8F84;margin:0 0 12px}
.card-item{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;font-size:14px;color:#312923}
.card-item .check{color:#5B6651;font-weight:700}
.cta{text-align:center;margin:0 0 16px}
.cta a{display:inline-block;background:#312923;color:#fff !important;padding:14px 32px;border-radius:14px;text-decoration:none;font-weight:600;font-size:15px}
.disclaimer{font-size:12px;color:#9A8F84;text-align:center;margin:0}
.disclaimer strong{color:#312923}
.footer{background:#fff;border-top:1px solid #DFD2C4;padding:16px 32px;text-align:center}
.footer p{font-size:11px;color:#9A8F84;margin:0}
.footer a{color:#5B6651;text-decoration:none}
</style></head>
<body><div class="wrapper">
<div class="header"><div class="header-logo">ShiningCloud<span>Dental</span></div></div>
<div class="content">
<div class="badge">INVITACIÓN A LABORATORIO</div>
<h1 class="title">Has sido invitado a colaborar con ${clinic_name}</h1>
<p class="text"><strong>${clinic_name}</strong> te ha invitado a su red de laboratorios en <strong>ShiningCloud Dental</strong>. Desde ahora podrás recibir y gestionar trabajos protésicos directamente desde la plataforma.</p>
<div class="card">
<p class="card-title">QUÉ PODRÁS HACER</p>
<div class="card-item"><span class="check">✓</span><span>Ver trabajos asignados en tiempo real</span></div>
<div class="card-item"><span class="check">✓</span><span>Actualizar estados de cada caso</span></div>
<div class="card-item"><span class="check">✓</span><span>Comunicarte directo con la clínica</span></div>
</div>
<div class="cta"><a href="${magic_link}">Aceptar invitación →</a></div>
<p class="disclaimer">Este enlace expira en <strong>1 hora</strong>. Si no fuiste tú o no reconoces a esta clínica, ignora este mensaje.</p>
</div>
<div class="footer"><p>Enviado por <strong>${clinic_name}</strong> a través de ShiningCloud Dental<br>
<a href="https://shiningclouddental.vercel.app">shiningclouddental.vercel.app</a></p></div>
</div></body></html>`;
}
