
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    try {
        const body = await req.json();
        const { type, data } = body;

        // Solo procesamos eventos de pago
        if (type !== "payment") {
            return new Response(JSON.stringify({ skipped: true, type }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const paymentId = data?.id;
        if (!paymentId || !MP_ACCESS_TOKEN) {
            return new Response(JSON.stringify({ error: "Missing payment_id or MP token" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Consultar detalles del pago en MercadoPago
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` }
        });

        if (!mpRes.ok) {
            throw new Error(`MP API error: ${await mpRes.text()}`);
        }

        const payment = await mpRes.json();
        const {
            status: mpStatus,          // approved | rejected | cancelled
            external_reference,
        } = payment;

        const appointmentId = external_reference;

        if (!appointmentId) {
            return new Response(JSON.stringify({ error: "Missing appointment_id in external_reference" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        let newApptStatus = "pending_payment"; // Default
        let newPaymentStatus = mpStatus;

        if (mpStatus === "approved") {
            newApptStatus = "agendado";
        } else if (mpStatus === "rejected" || mpStatus === "cancelled") {
            newApptStatus = "rechazado";
        }

        // Actualizar la tabla de appointments en Supabase
        const { error: updateError } = await supabase
            .from("appointments")
            .update({
                data: {
                    status: newApptStatus,
                    payment_status: newPaymentStatus,
                    mp_payment_id: paymentId,
                    updated_at: new Date().toISOString(),
                }
            })
            .eq("id", appointmentId);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({ success: true, appointment_id: appointmentId, status: newApptStatus, payment_status: newPaymentStatus }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (e) {
        console.error("[mercadopago-webhook] Error:", e);
        return new Response(
            JSON.stringify({ error: (e as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
