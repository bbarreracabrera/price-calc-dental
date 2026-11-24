# Migraciones Supabase — orden de aplicación

## Línea base (ya aplicadas en producción, solo referencia)

Los archivos en `archive/` corresponden a SQL que ya se aplicó
manualmente en el proyecto (SQL Editor) y se conserva como
referencia histórica. NO re-aplicar sin revisar.

## Migraciones activas (2026-11-23)

Aplicar en orden, en el SQL Editor de Supabase (o con
`supabase db push` cuando el CLI esté vinculado). Todas son
idempotentes: seguras de re-ejecutar.

1. `20261123120000_specialties_tracking_tables.sql`
   Crea/garantiza orthodontics_tracking, implantology_tracking,
   endodontics_tracking (nombres que usa el código), índices y
   respaldo automático si existiera una tabla *_records con datos.
2. `20261123120001_specialties_rls.sql`
   RLS de especialidades + esterilización con my_clinic_admin(),
   coherente con el sprint 1 (incluye al equipo, no solo al admin).
3. `20261123120002_lab_work_files.sql`
   Tabla de múltiples archivos por trabajo de laboratorio con RLS.

## Migraciones activas (2026-11-24)

4. `20261124120000_cleanup_and_public.sql`
   Segunda pasada, en dos partes:
   a. DROP de orthodontics_records, implantology_records y
      endodontics_records (tablas vacías con RLS viejo; el código usa
      exclusivamente las nuevas *_tracking). CASCADE elimina con ellas
      sus políticas y dependencias; no hay riesgo de datos porque
      estaban en 0 filas en producción (verificado con pg_dump).
   b. Recreación de las dos vistas que consulta PublicBooking.jsx
      de forma anónima desde la landing (?reserva=):
      - public_appointments_availability: solo admin_email / date /
        time / duration de citas NO eliminadas (deleted_at IS NULL) de
        clínicas con publicSlug. Sin ningún dato del paciente.
      - public_clinic_info: lista blanca cerrada sobre settings.data
        (name, phone, address, schedule, publicSlug,
        require_payment_at_booking, appointment_price,
        require_email_for_booking). Sin mp_access_token ni ningún
        token/precio interno.

   Ambas con security_barrier = true y security_invoker = false, y
   GRANT SELECT solo a anon. Las vistas son de solo lectura: el grep
   de src/ confirma que PublicBooking.jsx solo hace SELECT en ambas;
   sus escrituras anónimas van contra appointments (INSERT) y
   patients (UPSERT), riesgo documentado para una tanda futura.

   DECISIÓN sobre sterilization_cycles: la política
   "ster_cycles_all_team" que esta misma carpeta tenía (20261123120001)
   se eliminó de esa migración porque la tabla sterilization_cycles no
   existe en producción y nadie en src/ la usa; una política sobre
   tabla inexistente rompe un rebuild limpio. Ver el comentario dentro
   de 20261123120001_specialties_rls.sql.

## Pendiente (próxima sesión)

- `pg_dump --schema-only` para capturar la línea base completa de
  las tablas sin versionar (patients, appointments, financials,
  catalog, settings, team, audit_logs, lab_works, saas_*,
  lab_subscriptions, supply_*, public_*, reminder_log,
  evolution_templates, packs, clinic_config).
