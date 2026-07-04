/**
 * ShiningCloud Dental — Edge Function: mp-lab-webhook
 * ====================================================
 * Webhook de MercadoPago para gestionar suscripciones Lab Pro.
 * 
 * CONFIGURACIÓN EN MERCADOPAGO DASHBOARD:
 * - URL del webhook: https://[SUPABASE_PROJECT_REF].supabase.co/functions/v1/mp-lab-webhook
 * - Eventos a escuchar: preapproval (suscripciones recurrentes)
 * 
 * SECRETS REQUERIDOS EN SUPABASE:
 * - MP_ACCESS_TOKEN: Token de acceso de MercadoPago (producción)
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LAB_PRO_MONTHLY_FEE = 12990; // CLP

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    try {
        const body = await req.json();
        const { type, data } = body;

        // Solo procesamos eventos de preapproval (suscripciones)
        if (type !== "preapproval") {
            return new Response(JSON.stringify({ skipped: true, type }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const preapprovalId = data?.id;
        if (!preapprovalId || !MP_ACCESS_TOKEN) {
            return new Response(JSON.stringify({ error: "Missing preapproval_id or MP token" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Consultar detalles de la suscripción en MercadoPago
        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
            headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
        });

        if (!mpRes.ok) {
            throw new Error(`MP API error: ${await mpRes.text()}`);
        }

        const preapproval = await mpRes.json();
        const {
            status: mpStatus,          // authorized | paused | cancelled
            payer_email,
            external_reference,        // lab_email del laboratorio
            next_payment_date,
        } = preapproval;

        const labEmail = external_reference || payer_email;

        // Mapear estado MP → estado interno
        const statusMap: Record<string, string> = {
            authorized: 'active',
            paused: 'past_due',
            cancelled: 'cancelled',
        };
        const internalStatus = statusMap[mpStatus] || 'past_due';
        const planType = internalStatus === 'active' ? 'pro' : 'free';

        // Upsert en lab_subscriptions
        const { error: upsertError } = await supabase
            .from('lab_subscriptions')
            .upsert({
                lab_email: labEmail,
                plan_type: planType,
                status: internalStatus,
                mp_preapproval_id: preapprovalId,
                mp_payer_email: payer_email,
                monthly_fee: planType === 'pro' ? LAB_PRO_MONTHLY_FEE : 0,
                next_billing_date: next_payment_date ? new Date(next_payment_date).toISOString().split('T')[0] : null,
                cancelled_at: internalStatus === 'cancelled' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'lab_email' });

        if (upsertError) throw upsertError;

        return new Response(
            JSON.stringify({ success: true, lab_email: labEmail, plan_type: planType, status: internalStatus }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (e) {
        console.error("[mp-lab-webhook] Error:", e);
        return new Response(
            JSON.stringify({ error: (e as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
