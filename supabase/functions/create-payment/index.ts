
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
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

    // Cliente con el JWT del llamador para autenticar la petición
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
    if (userError || !user?.email) {
        return new Response(
            JSON.stringify({ error: "No autorizado" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Cliente con service role para leer datos (ignora RLS de forma controlada)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    try {
        const { patient_name, patient_email, description, appointment_id } = await req.json();

        if (!appointment_id) {
            return new Response(
                JSON.stringify({ error: "Faltan datos requeridos" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!MP_ACCESS_TOKEN) {
            throw new Error("MercadoPago access token not configured.");
        }

        // IDOR: verificar que la cita existe y pertenece a la clínica del JWT
        const { data: appointment, error: apptError } = await supabase
            .from("appointments")
            .select("id, admin_email")
            .eq("id", appointment_id)
            .maybeSingle();

        if (apptError) throw apptError;
        if (!appointment || appointment.admin_email !== user.email) {
            return new Response(
                JSON.stringify({ error: "Cita no encontrada" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // El monto NUNCA viene del cliente: se lee del lado servidor
        // desde settings (id = 'general', data.appointment_price)
        const { data: settings, error: settingsError } = await supabase
            .from("settings")
            .select("data")
            .eq("id", "general")
            .eq("admin_email", user.email)
            .maybeSingle();

        if (settingsError) throw settingsError;

        const amount = Number(settings?.data?.appointment_price);
        if (!Number.isFinite(amount) || amount <= 0) {
            return new Response(
                JSON.stringify({ error: "La clínica no tiene precio de cita configurado" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
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
        // Nunca exponer el detalle del error al cliente
        return new Response(
            JSON.stringify({ error: "Error interno" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
