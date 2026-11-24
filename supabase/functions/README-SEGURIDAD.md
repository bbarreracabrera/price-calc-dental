# Hardening de seguridad — ShiningCloud Dental (Edge Functions + Email)

Este parche corrige los hallazgos del audit previo sobre las Edge Functions de
Supabase y el envío de correos. Los cambios quedaron en el working tree del
repo (sin commit) y también en esta carpeta para revisión.

## Archivos modificados / nuevos

| Archivo | Estado | Cambio |
|---|---|---|
| `supabase/functions/create-payment/index.ts` | modificado | Exige JWT (`auth.getUser` con el header `Authorization`), valida que `appointment_id` exista y pertenezca a `admin_email` del JWT (consulta a `appointments`), y toma el monto desde `settings` (id `general`, `data.appointment_price`) del lado servidor. El body ya no puede enviar `amount` ni `clinic_email`. 401 sin JWT, 404 si la cita no es de la clínica, 400 si no hay precio configurado. |
| `supabase/functions/invite-lab/index.ts` | modificado | Exige JWT y verifica que el llamador sea admin de la clínica (existe fila en `settings` con `admin_email` = email del JWT) antes de enviar cualquier correo. 401 sin JWT, 403 si no es admin. Escapa entidades HTML de `clinic_name`, `lab_name` y `magic_link` (`escapeHTML`) antes de interpolarlos en la plantilla y en el asunto/remite. |
| `supabase/functions/send-email/index.ts` | **nuevo** | Edge Function que envía vía Resend leyendo `RESEND_API_KEY` desde `Deno.env` (secrets del servidor). Requiere JWT y aplica un rate limit básico en memoria de 10 correos/hora por usuario (429 al superar). Responde `{ success: false, error: "Missing API Key" }` con 200 cuando Resend no está configurado, igual que hacía el cliente. |
| `supabase/functions/_shared/mp-signature.ts` | **nuevo** | Helper compartido que implementa el algoritmo oficial de verificación de firma de webhooks de MercadoPago (HMAC SHA256). Usado por ambos webhooks. |
| `supabase/functions/mercadopago-webhook/index.ts` | modificado | Verifica el header `x-signature` con `MP_WEBHOOK_SECRET` antes de procesar el evento; 401 si falta o no coincide. Los errores de negocio responden genérico. |
| `supabase/functions/mp-lab-webhook/index.ts` | modificado | Igual que el anterior: firma obligatoria con `MP_WEBHOOK_SECRET`, 401 si falta o no coincide. |
| `supabase/functions/send-reminders/index.ts` | modificado | Rechaza con 401 si el header `Authorization` no es exactamente `Bearer $SUPABASE_SERVICE_ROLE_KEY` (patrón de invocación server-side de pg_cron). La respuesta ya no incluye `errors` con correos de pacientes: solo conteos `{ sent, skipped, failed }`; el detalle de cada fallo queda solo en los logs del servidor. |
| `src/utils/emailService.js` | modificado | Ya no llama a `api.resend.com` ni usa `VITE_RESEND_API_KEY`. Ahora invoca `supabase.functions.invoke('send-email', ...)`. El remite se define en el servidor con `RESEND_FROM_EMAIL` (fallback `hola@shiningclouddental.cl`, el valor que tenía el cliente). No se tocó ningún otro archivo del frontend. |

Regla transversal: **todas** las funciones responden `{ error: 'Error interno' }`
con status 500 ante excepciones, con `console.error` del detalle solo en el
servidor (antes filtraban `e.message` crudo). Se mantiene el formato existente
(`cors.ts`, manejo OPTIONS, estructura de handlers, comentarios en español).

## Secrets que debes configurar

Desde el directorio del repo, con la CLI autenticada y el proyecto vinculado
(`supabase link --project-ref <ref>`):

```bash
# Secret de firma de webhooks de MercadoPago (hallazgo 4). Requerido:
# sin él, los webhooks rechazan TODA petición con 401.
supabase secrets set MP_WEBHOOK_SECRET=<secret_de_webhook_de_MP>

# API key de Resend: se mueve de variable VITE_ (pública en el bundle)
# a secreto de servidor (hallazgo 3). Requerida para send-email, invite-lab y send-reminders.
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx

# Remite de los correos (opcional; fallback hola@shiningclouddental.cl):
supabase secrets set RESEND_FROM_EMAIL=hola@shiningclouddental.cl
```

Dónde obtener el valor de `MP_WEBHOOK_SECRET`: en tu cuenta de MercadoPago,
Tus integraciones → tu app → Webhooks → "Secret de firma" (o "Clave secreta"
de las notificaciones webhook). Es la misma clave con la que MP calcula la
firma HMAC que ahora validamos.

`RESEND_API_KEY` debe dejar de usarse como `VITE_RESEND_API_KEY`: puedes
eliminarla de tu `.env` y de Vercel (VITE_ la exponía al navegador). Revoca
esa key en Resend y genera una nueva antes de configurarla como secret,
ya que la antigua quedó expuesta en los bundles desplegados.

## Deploy de las funciones

Los webhooks los llama MercadoPago sin JWT de Supabase, así que deben
desplegarse con `--no-verify-jwt` (la protección ahora es la firma HMAC):

```bash
supabase functions deploy mercadopago-webhook --no-verify-jwt
supabase functions deploy mp-lab-webhook --no-verify-jwt
```

Las demás exigen JWT y se despliegan con la verificación por defecto:

```bash
supabase functions deploy create-payment
supabase functions deploy invite-lab
supabase functions deploy send-email
supabase functions deploy send-reminders
```

Nota sobre `send-reminders`: la verificación JWT por defecto de Supabase no
bloquea el patrón `Bearer SERVICE_ROLE_KEY` que usa tu `pg_cron` (el cron envía
ese header explícitamente, como ya lo hace tu job actual), y encima agregamos
la comparación exacta contra `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`.

## Acciones manuales necesarias después del deploy

1. **Actualizar el webhook en el dashboard de MercadoPago** (Tus integraciones
   → Webhooks): asegúrate de que la URL apunte a las funciones desplegadas y
   que el secret de firma configurado ahí sea el mismo `MP_WEBHOOK_SECRET`.
   Mientras el webhook no esté reconfigurado con firma, las notificaciones
   quedarán rechazadas con 401 (es el comportamiento esperado del hallazgo 4).
2. **Recrear el job de `pg_cron` si el header del job no usa el SERVICE_ROLE_KEY
   literal.** El job debe enviar exactamente
   `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`.
3. **Redesplegar el frontend** para que el bundle ya no contenga la key de
   Resend, y **revocar la `VITE_RESEND_API_KEY` antigua** en Resend.
4. Las preferencias de pago que cree `create-payment` siguen usando la URL de
   notificación de `mercadopago-webhook`; no cambia nada en tu flujo, salvo que
   ahora el monto sale de `settings` (configura "precio de cita" en la clínica
   si aún no lo tienes).

## Verificaciones realizadas

- Type-check de las 7 funciones con `deno check` (Deno 2.9.8): todas pasan.
- `node --check` de `src/utils/emailService.js`: OK.
- Build de producción con Vite (`NODE_OPTIONS=--experimental-global-webcrypto npx vite build`): OK.
- El bundle de producción ya no contiene `api.resend.com` ni `VITE_RESEND_API_KEY`;
  las invocaciones pasan por `functions.invoke('send-email')`.
