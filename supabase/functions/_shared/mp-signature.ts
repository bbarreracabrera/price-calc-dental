/**
 * Verificación de firma de webhooks de MercadoPago (algoritmo oficial).
 *
 * Header x-signature con formato: t=<timestamp>,v1=<hash>,v1=<hash>,...
 * El hash es HMAC-SHA256 sobre el "manifest":
 *   id:{data.id};request-id:{x-request-id};ts:{t};
 * seguido del body crudo de la petición. La clave es MP_WEBHOOK_SECRET.
 *
 * Ver: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export async function verifyMercadoPagoSignature(req: Request, rawBody: string): Promise<{ ok: boolean; dataId: string }> {
    const SECRET = Deno.env.get("MP_WEBHOOK_SECRET");

    // Si el webhook no viene firmado, se rechaza y se registra un warning:
    // el usuario debe actualizar la URL/configuración en el dashboard de
    // MercadoPago para que incluya la firma (MP_WEBHOOK_SECRET configurado).
    if (!SECRET) {
        console.warn("[mp-webhook] MP_WEBHOOK_SECRET no configurada: se rechaza el webhook. Configura el secret con `supabase secrets set MP_WEBHOOK_SECRET=...`");
        return { ok: false, dataId: "" };
    }

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id") ?? "";

    if (!xSignature) {
        console.warn("[mp-webhook] Petición sin header x-signature: se rechaza. Actualiza la configuración del webhook en el dashboard de MercadoPago.");
        return { ok: false, dataId: "" };
    }

    // Extraer ts y hashes del header parseado: "t=123,v1=abc,v1=def"
    const parts = xSignature.split(",").map(p => p.trim());
    const tsPart = parts.find(p => p.startsWith("t="));
    const hashes = parts.filter(p => p.startsWith("v1=")).map(p => p.slice(3));

    if (!tsPart || hashes.length === 0) {
        console.warn("[mp-webhook] Header x-signature malformado.");
        return { ok: false, dataId: "" };
    }
    const ts = tsPart.slice(2);

    // data.id se toma de la query string del webhook (o del body si no viene)
    const url = new URL(req.url);
    const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";

    // Manifest: id:{data.id};request-id:{x-request-id};ts:{t};
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest + rawBody));
    const computed = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    // Basta con que el hash calculado coincida con alguno de los v1 enviados
    const ok = hashes.includes(computed);
    if (!ok) console.warn("[mp-webhook] Firma HMAC inválida: se rechaza el webhook.");
    return { ok, dataId };
}
