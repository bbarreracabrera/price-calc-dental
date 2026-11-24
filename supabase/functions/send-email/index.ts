/**
 * ShiningCloud Dental — Edge Function: send-email
 * ================================================
 * Envía correos transaccionales vía Resend desde el servidor.
 * Reemplaza el envío directo desde el cliente, que exponía la API key
 * de Resend en el bundle de Vite (variable VITE_RESEND_API_KEY).
 *
 * SECRETS REQUERIDOS EN SUPABASE:
 * - RESEND_API_KEY=re_xxxxxxxxxxxx  (configurar con `supabase secrets set`)
 * - RESEND_FROM_EMAIL=hola@shiningclouddental.cl (opcional, con fallback)
 * - SUPABASE_URL / SUPABASE_ANON_KEY (incluidos por defecto)
 *
 * SEGURIDAD:
 * - Exige JWT válido (el SDK de Supabase lo pasa automáticamente en functions.invoke).
 * - Rate limit básico en memoria por usuario: máx. 10 correos por hora.
 *   Nota: es por instancia (las instancias de Edge Functions son efímeras),
 *   sirve como freno básico, no como límite contable exacto.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit básico en memoria: user_id -> { count, resetAt }
const MAX_EMAILS_PER_HOUR = 10;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
    const now = Date.now();
    const bucket = rateBuckets.get(userId);
    if (!bucket || bucket.resetAt <= now) {
        rateBuckets.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
        return false;
    }
    bucket.count += 1;
    return bucket.count > MAX_EMAILS_PER_HOUR;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Exigir JWT válido: sin sesión no se envía nada
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !ANON_KEY) {
        return new Response(
            JSON.stringify({ error: "No autorizado" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user?.id || !user?.email) {
        return new Response(
            JSON.stringify({ error: "No autorizado" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Rate limit básico por usuario
    if (isRateLimited(user.id)) {
        return new Response(
            JSON.stringify({ error: "Límite de envíos alcanzado" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const { to, subject, html } = await req.json();

        if (!to || !subject || !html) {
            return new Response(
                JSON.stringify({ error: "Faltan datos requeridos" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "hola@shiningclouddental.cl";

        if (!RESEND_API_KEY) {
            // Misma respuesta de fallback que antes devolvía el cliente
            console.warn("[send-email] RESEND_API_KEY no configurada. El correo no se enviará.");
            return new Response(
                JSON.stringify({ success: false, error: "Missing API Key" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: `ShiningCloud Dental <${FROM_EMAIL}>`,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
            }),
        });

        const data = await resendResponse.json();
        if (!resendResponse.ok) {
            throw new Error(`Resend error: ${data?.message || resendResponse.status}`);
        }

        return new Response(
            JSON.stringify({ success: true, id: data.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (e) {
        console.error("[send-email] Error:", e);
        // Nunca exponer el detalle del error al cliente
        return new Response(
            JSON.stringify({ error: "Error interno" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
