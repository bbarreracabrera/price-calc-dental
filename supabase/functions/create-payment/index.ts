
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
        const { clinic_email, patient_name, patient_email, amount, description, appointment_id } = await req.json();

        if (!MP_ACCESS_TOKEN) {
            throw new Error("MercadoPago access token not configured.");
        }

        // Crear preferencia de pago en MercadoPago
        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                items: [
                    {
                        title: description,
                        quantity: 1,
                        unit_price: amount,
                    },
                ],
                payer: {
                    name: patient_name,
                    email: patient_email,
                },
                external_reference: appointment_id, // Usar el ID de la cita como referencia externa
                back_urls: {
                    success: "https://shiningclouddental.vercel.app/payment-success", // URL de éxito (puedes ajustar)
                    pending: "https://shiningclouddental.vercel.app/payment-pending", // URL pendiente
                    failure: "https://shiningclouddental.vercel.app/payment-failure", // URL de fallo
                },
                auto_return: "approved",
                notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`, // URL de tu webhook
            }),
        });

        if (!mpResponse.ok) {
            throw new Error(`MercadoPago API error: ${await mpResponse.text()}`);
        }

        const preference = await mpResponse.json();

        return new Response(
            JSON.stringify({ init_point: preference.init_point }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (e) {
        console.error("[create-payment] Error:", e);
        return new Response(
            JSON.stringify({ error: (e as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
