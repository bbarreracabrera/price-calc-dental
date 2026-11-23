# Migraciones Supabase — orden de aplicación

## Línea base (ya aplicadas en producción, solo referencia)

Los archivos en `archive/` corresponden a SQL que ya se aplicó
manualmente en el proyecto (SQL Editor) y se conserva como
referencia histórica. NO re-aplicar sin revisar.

## Migraciones activas (2026-11-23)

Aplicar en orden, en el SQL Editor de Supabase (o con
`supabase db push` cuando el CLI esté vinculado). Todas son
idempotentes: seguras de re-ejecutar.

1. `20261123_01_specialties_tracking_tables.sql`
   Crea/garantiza orthodontics_tracking, implantology_tracking,
   endodontics_tracking (nombres que usa el código), índices y
   respaldo automático si existiera una tabla *_records con datos.
2. `20261123_02_specialties_rls.sql`
   RLS de especialidades + esterilización con my_clinic_admin(),
   coherente con el sprint 1 (incluye al equipo, no solo al admin).
3. `20261123_03_lab_work_files.sql`
   Tabla de múltiples archivos por trabajo de laboratorio con RLS.

## Pendiente (próxima sesión)

- `pg_dump --schema-only` para capturar la línea base completa de
  las tablas sin versionar (patients, appointments, financials,
  catalog, settings, team, audit_logs, lab_works, saas_*,
  lab_subscriptions, supply_*, public_*, reminder_log,
  evolution_templates, packs, clinic_config).
