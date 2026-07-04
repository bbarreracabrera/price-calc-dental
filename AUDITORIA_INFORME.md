# Informe de Auditoría: ShiningCloud Dental (price-calc-dental)

**Fecha:** Julio 2026
**Autor:** Manus AI

## 1. Resumen Ejecutivo

He completado una revisión exhaustiva del repositorio `price-calc-dental`, analizando el código fuente (React/Vite), la configuración de despliegue en Vercel, la base de datos y Edge Functions en Supabase, y las integraciones con servicios de terceros como MercadoPago y Resend.

El proyecto presenta una base sólida y una arquitectura funcional para un SaaS B2B dental, pero he identificado varias brechas críticas en el flujo de pagos, deuda técnica acumulada, y configuraciones de seguridad pendientes que deben resolverse antes de escalar a producción masiva o buscar certificaciones como el Sello CENS.

## 2. Evaluación de Integraciones y Fallos Detectados

### 2.1. Integración con MercadoPago (Flujo de Agendamiento)
El flujo de reserva pública (`PublicBooking.jsx`) permite a los pacientes agendar horas y, si la clínica lo requiere, realizar un pago por adelantado. Sin embargo, existe un **fallo crítico de diseño y conciliación**:
* **Creación prematura:** La cita se inserta en la base de datos con estado `pending_payment` **antes** de que el paciente complete el pago en MercadoPago.
* **Falta de Webhook de Conciliación:** El frontend delega el pago a una ventana emergente de MercadoPago (`payData.init_point`), pero **no existe un mecanismo (polling, callback o webhook)** que actualice el estado de la cita a `agendado` o `confirmado` una vez que el pago es exitoso. El archivo `PENDIENTES.md` menciona una Edge Function `mercadopago-webhook`, pero esta no se encuentra implementada ni desplegada en el repositorio.
* **Impacto en la Agenda:** El componente `AgendaView.jsx` no maneja visualmente el estado `pending_payment`, lo que significa que estas citas quedan "flotando" en un estado inconsistente.

### 2.2. Suscripciones de Laboratorio (Lab Pro)
El flujo de suscripción para laboratorios (`LabSubscriptionBanner.jsx` y la Edge Function `mp-lab-webhook`) está mejor estructurado:
* La Edge Function `mp-lab-webhook` procesa correctamente los eventos `preapproval` de MercadoPago y actualiza la tabla `lab_subscriptions`.
* Sin embargo, el frontend (`LabSubscriptionBanner.jsx`) utiliza un enlace hardcodeado (`LAB_PRO_PLAN_ID`) hacia MercadoPago, lo que impide la trazabilidad correcta del laboratorio que se está suscribiendo (falta inyectar el `external_reference` o email del laboratorio en la URL de checkout).

### 2.3. Infraestructura y Despliegue (Vercel & Supabase)
* **Vercel:** El proyecto está desplegado correctamente. El archivo `vercel.json` tiene una política CSP (Content Security Policy) robusta, pero **falta incluir los dominios de MercadoPago** (`https://*.mercadopago.com` o `https://*.mercadopago.cl`) en las directivas `connect-src` y `script-src` si se planea usar el SDK frontend de MP en el futuro.
* **Supabase:** La base de datos está activa. El análisis de seguridad (vía MCP) arrojó advertencias importantes:
  * Varias funciones RPC (`get_my_clinic_admin`, `get_my_role`, `get_occupied_slots`) están definidas como `SECURITY DEFINER` y pueden ser ejecutadas por el rol `anon` (público), lo que representa un riesgo de exposición de datos.
  * El bucket público `clinic-logos` permite listar todos sus archivos, lo que no es necesario y podría exponer información.
  * Múltiples políticas RLS (Row Level Security) tienen advertencias de rendimiento (`Auth RLS Initialization Plan`) porque evalúan `auth.email()` o `current_setting()` por cada fila. Deben optimizarse envolviéndolas en un `(select auth.email())`.

## 3. Pendientes y Oportunidades de Mejora

Basado en el archivo `PENDIENTES.md` y el análisis de código, aquí están las prioridades de desarrollo:

### 3.1. Prioridad Alta (Seguridad y Cumplimiento)
* **Gestión de Archivos de Laboratorio:** Actualmente, los archivos STL/DICOM se suben a un bucket público, lo que viola la Ley 19.628 de protección de datos sensibles en Chile. Se debe implementar urgentemente la creación del bucket privado `lab-work-files` con URLs firmadas (signed URLs) y validación de *magic bytes*.
* **Refactorización de RLS:** Optimizar las políticas RLS para evitar problemas de rendimiento en tablas críticas (`clinical_evolutions`, `team`, `settings`, `audit_logs`).

### 3.2. Prioridad Media (Funcionalidad Core)
* **Completar Webhook de MercadoPago:** Implementar la Edge Function `mercadopago-webhook` para conciliar los pagos de citas médicas y actualizar el estado en la tabla `appointments`.
* **Configuración de Correos (Resend):** La Edge Function `send-reminders` está implementada pero depende de que se configuren las variables `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en Supabase, lo cual requiere la compra y verificación de un dominio propio (ej. `shiningclouddental.cl`).
* **Suscripción de Clínicas:** El componente `SystemModals.jsx` maneja el alta de clínicas con un parámetro de URL `?pago=exitoso` sin validación del lado del servidor. Esto es vulnerable y debe reemplazarse por una validación mediante webhook similar al de los laboratorios.

### 3.3. Limpieza de Código (Deuda Técnica)
* **Eliminar Código Obsoleto:** El archivo `api/webhook.js` es una ruta legacy de Vercel que ya no se alinea con la arquitectura basada en Supabase Edge Functions. Debe ser eliminado.
* **Sincronización Offline:** El componente `NetworkMonitor.jsx` filtra correctamente campos sensibles antes de guardar en local, pero la lógica de reconexión y sincronización de citas con pagos pendientes debe ser revisada.

## 4. Recomendaciones para Próximos Pasos

1. **Resolver el flujo de pago de citas:** Crea la Edge Function para el webhook de MP y actualiza `PublicBooking.jsx` para hacer polling o usar Supabase Realtime para detectar cuando la cita cambie de `pending_payment` a `agendado`.
2. **Asegurar el almacenamiento:** Implementa el bucket privado para `lab_works` con signed URLs.
3. **Comprar Dominio y Configurar Resend:** Esto desbloqueará los recordatorios automáticos de citas y las invitaciones a laboratorios, funcionalidades clave para el valor del SaaS.
4. **Optimizar Seguridad en Supabase:** Revisa los permisos de las funciones RPC (`SECURITY DEFINER`) y optimiza las políticas RLS según las recomendaciones del linter de Supabase.
