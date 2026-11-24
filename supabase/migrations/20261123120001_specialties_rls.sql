-- =================================================================
-- ShiningCloud Dental — Migración 2026-11-23 #2
-- RLS de especialidades + esterilización, coherente con el
-- modelo del resto del sistema (my_clinic_admin del sprint 1).
-- Reemplaza apply_rls_specialties.sql, que solo contemplaba al
-- admin y dejaba fuera al equipo (dentistas / asistentes).
-- Idempotente. Sin bloques DO anidados (los $$ internos rompen
-- la ejecución en el SQL Editor del Dashboard).
-- =================================================================

ALTER TABLE public.orthodontics_tracking  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implantology_tracking  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endodontics_tracking   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sterilization_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orthodontics_tracking_all_team  ON public.orthodontics_tracking;
DROP POLICY IF EXISTS implantology_tracking_all_team  ON public.implantology_tracking;
DROP POLICY IF EXISTS endodontics_tracking_all_team   ON public.endodontics_tracking;

CREATE POLICY orthodontics_tracking_all_team ON public.orthodontics_tracking
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = orthodontics_tracking.patient_id
        AND p.admin_email = public.my_clinic_admin()
        AND p.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = orthodontics_tracking.patient_id
        AND p.admin_email = public.my_clinic_admin()
        AND p.deleted_at IS NULL
    )
  );

CREATE POLICY implantology_tracking_all_team ON public.implantology_tracking
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = implantology_tracking.patient_id
        AND p.admin_email = public.my_clinic_admin()
        AND p.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = implantology_tracking.patient_id
        AND p.admin_email = public.my_clinic_admin()
        AND p.deleted_at IS NULL
    )
  );

CREATE POLICY endodontics_tracking_all_team ON public.endodontics_tracking
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = endodontics_tracking.patient_id
        AND p.admin_email = public.my_clinic_admin()
        AND p.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = endodontics_tracking.patient_id
        AND p.admin_email = public.my_clinic_admin()
        AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "ster_inventory_all_team" ON public.sterilization_inventory;
CREATE POLICY "ster_inventory_all_team" ON public.sterilization_inventory
  FOR ALL TO authenticated
  USING (clinic_email = public.my_clinic_admin())
  WITH CHECK (clinic_email = public.my_clinic_admin());

-- NOTA (2026-11-24): la política "ster_cycles_all_team" sobre
-- public.sterilization_cycles se eliminó de esta migración. La tabla
-- sterilization_cycles NO existe en producción y ningún archivo de
-- src/ la usa (el código solo usa sterilization_inventory y
-- sterilization); crear una política sobre una tabla inexistente
-- haría fallar esta migración en un rebuild limpio (psql aborta en el
-- primer error y el resto de políticas no se aplicaría). Si la tabla
-- se llega a necesitar, se crea y se asegura en una migración propia
-- (CREATE TABLE IF NOT EXISTS + RLS), nunca solo con la política.
