-- =================================================================
-- ShiningCloud Dental — Migración 2026-11-24
-- Segunda pasada: limpieza de tablas de especialidades antiguas y
-- vistas públicas de la landing de reservas.
--
-- Modo seguro: NO toca datos de producción. Solo:
--   1) Elimina orthodontics_records / implantology_records /
--      endodontics_records (vacías, con políticas RLS viejas; el
--      código usa exclusivamente *_tracking desde el sprint 1).
--   2) (Re)crea las dos vistas que consulta src/components/PublicBooking.jsx
--      de forma ANÓNIMA (rol anon desde la landing):
--        - public_appointments_availability
--        - public_clinic_info
--
-- Idempotente: segura de re-ejecutar (DROP IF EXISTS +
-- CREATE OR REPLACE VIEW + ALTER VIEW SET).
--
-- Seguridad de las vistas: una view SQL NO aplica RLS de las tablas
-- subyacentes; la protección aquí es estructural:
--   - security_barrier = true: impide que los filtros que el cliente
--     (PostgREST) añade empujen filas fuera de la definición de la
--     vista hacia el usuario (no se puede "escapar" de la cláusula
--     WHERE interna para leer filas que la vista no expone).
--   - security_invoker = false (semántica definer, el default de
--     Postgres): la vista se ejecuta con los permisos del propietario,
--     así no depende de políticas RLS sobre settings/appointments.
--   - La lista de columnas es explícita y mínima (jsonb_build_object):
--     no se puede pedir por select() una columna que la vista no tiene.
-- =================================================================


-- -----------------------------------------------------------------
-- 1. Tablas de especialidades antiguas
-- -----------------------------------------------------------------
-- En producción coexistían *_records (vacías, con políticas RLS
-- antiguas) y las nuevas *_tracking creadas el 2026-11-23. El código
-- (PatientWorkspace.jsx, *TrackingTab.jsx) usa solo *_tracking.
-- CASCADE elimina también sus políticas y dependencias; las tablas
-- están vacías (0 filas), así que no hay riesgo de pérdida de datos.
DROP TABLE IF EXISTS public.orthodontics_records CASCADE;
DROP TABLE IF EXISTS public.implantology_records  CASCADE;
DROP TABLE IF EXISTS public.endodontics_records   CASCADE;


-- -----------------------------------------------------------------
-- 2. public_appointments_availability
-- -----------------------------------------------------------------
-- La única consulta del código (PublicBooking.jsx, handleDateSelect):
--   .from('public_appointments_availability')
--   .select('time, duration')
--   .eq('admin_email', adminEmail)
--   .eq('date', dateStr)
-- Es de solo lectura y sirve para marcar las franjas de 30 min ya
-- ocupadas del día elegido.
--
-- Qué expone: SOLO admin_email, fecha, hora y duración de citas NO
-- eliminadas (deleted_at IS NULL). Nada del paciente (sin name, phone,
-- email, treatment, cancel_token ni consent_*): solo "esta franja está
-- ocupada", que es lo mínimo que la landing necesita.
--
-- Tipos: data->>'date' y data->>'duration' se exponen como TEXT.
--   - date: PostgREST compara .eq('date', 'YYYY-MM-DD') textualmente
--     sin problema; un cast ::date haría fallar la vista completa si
--     alguna fila histórica tuviera otro formato. El componente
--     valida el año antes de consultar (2000-2100).
--   - duration: se mantiene TEXT a propósito. La view vieja de
--     producción ya la definía como text y CREATE OR REPLACE VIEW no
--     permite cambiar el tipo de una columna existente (fallaría con
--     "cannot change type of view column"). El componente ya hace
--     Number(appt.duration), así que el tipo text es transparente.
-- Si en una tanda futura se normaliza el formato en escritura,
-- puede castearse a ::date / ::integer (requiere DROP VIEW + CREATE).
--
-- Filtro interno: solo clínicas con enlace público activo
-- (settings.id = 'general' con publicSlug no vacío), igual que en el
-- diseño original: una clínica sin landing pública no expone agenda.
CREATE OR REPLACE VIEW public.public_appointments_availability AS
SELECT
    a.admin_email,
    a.data->>'date'                          AS date,
    a.data->>'time'                          AS "time",
    a.data->>'duration'                      AS duration
FROM public.appointments a
WHERE a.deleted_at IS NULL
  AND a.admin_email IN (
        SELECT s.admin_email
        FROM public.settings s
        WHERE s.id = 'general'
          AND s.data->>'publicSlug' IS NOT NULL
          AND s.data->>'publicSlug' <> ''
  );

ALTER VIEW public.public_appointments_availability SET (security_barrier = true);
ALTER VIEW public.public_appointments_availability SET (security_invoker = false);

-- La landing llama con el rol anon. No se otorga más (sin INSERT/
-- UPDATE/DELETE: la vista es de solo lectura por diseño).
GRANT SELECT ON public.public_appointments_availability TO anon;

COMMENT ON VIEW public.public_appointments_availability IS
'Vista pública de franjas ocupadas para la landing de reservas. Solo admin_email/date/time/duration de citas no eliminadas de clínicas con publicSlug. Sin datos de pacientes. Consultada por PublicBooking.jsx (SELECT anon).';


-- -----------------------------------------------------------------
-- 3. public_clinic_info
-- -----------------------------------------------------------------
-- La única consulta del código (PublicBooking.jsx, fetchClinicData):
--   .from('public_clinic_info')
--   .select('admin_email, data')
--   .eq('data->>publicSlug', clinicId)
--   .maybeSingle()
-- clinicConfig se usa en el componente EXACTAMENTE para:
--   - name      -> título "Agenda tu Cita en {name}" y clinic_name
--                  para la Edge Function notify-booking
--   - phone     -> clinic_phone para notify-booking
--   - address   -> clinic_address para notify-booking
--   - schedule  -> generateTimeSlots / dayConfig (start1,end1,start2,
--                  end2,active por día); es objeto JSONB, no texto
--   - publicSlug -> necesario para que el filtro eq(data->>publicSlug)
--                  funcione sobre la vista
--   - require_payment_at_booking -> decide flujo MercadoPago (acepta
--                  boolean o string; se preserva el valor JSONB tal cual)
--   - appointment_price -> monto del pago (Number(...)); se preserva tal cual
--   - require_email_for_booking -> hace el email obligatorio
--
-- NO se expone: logo y specialty (PublicBooking no los renderiza ni
-- los lee en ninguna parte del componente; si una tanda futura usa el
-- logo en la landing, se agrega aquí explícitamente), ni mp_access_token,
-- mp_refresh_token, mp_user_id, mp_public_key, laboratories, rut, rnpi,
-- university, sensorModel, precios internos, ni ninguna key de
-- integraciones. La lista blanca es cerrada: cualquier campo nuevo
-- debe agregarse a mano en jsonb_build_object.
CREATE OR REPLACE VIEW public.public_clinic_info AS
SELECT
    s.admin_email,
    jsonb_build_object(
        'name',                       s.data->>'name',
        'phone',                      s.data->>'phone',
        'address',                    s.data->>'address',
        'schedule',                   s.data->'schedule',
        'publicSlug',                 s.data->>'publicSlug',
        'require_payment_at_booking', s.data->'require_payment_at_booking',
        'appointment_price',          s.data->'appointment_price',
        'require_email_for_booking',  s.data->'require_email_for_booking'
    ) AS data
FROM public.settings s
WHERE s.id = 'general'
  AND s.data->>'publicSlug' IS NOT NULL
  AND s.data->>'publicSlug' <> '';

ALTER VIEW public.public_clinic_info SET (security_barrier = true);
ALTER VIEW public.public_clinic_info SET (security_invoker = false);

GRANT SELECT ON public.public_clinic_info TO anon;

COMMENT ON VIEW public.public_clinic_info IS
'Vista pública de datos de la clínica para la landing de reservas. Lista blanca cerrada: name/phone/address/schedule/publicSlug/require_payment_at_booking/appointment_price/require_email_for_booking. Sin tokens ni datos de pacientes. Consultada por PublicBooking.jsx (SELECT anon).';


-- -----------------------------------------------------------------
-- 4. Verificación de escrituras (documento, no ejecuta nada)
-- -----------------------------------------------------------------
-- Grep sobre src/ confirma que ambas vistas SOLO se usan en SELECT:
--   PublicBooking.jsx:42-44  SELECT public_clinic_info (anon)
--   PublicBooking.jsx:121-123 SELECT public_appointments_availability (anon)
-- Ningún .update()/.upsert()/.insert() apunta a estas vistas, lo que
-- es coherente con que solo tienen GRANT SELECT. Las escrituras
-- anónimas de PublicBooking van contra appointments (INSERT) y
-- patients (UPSERT), y son un riesgo documentado separado que se
-- aborda en una tanda futura.
