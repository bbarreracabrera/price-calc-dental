-- =================================================================
-- ShiningCloud Dental — Migración 2026-11-23 #2
-- RLS de especialidades + esterilización, coherente con el
-- modelo del resto del sistema (my_clinic_admin del sprint 1).
-- Reemplaza apply_rls_specialties.sql, que solo contemplaba al
-- admin y dejaba fuera al equipo (dentistas / asistentes).
-- Idempotente.
-- =================================================================

ALTER TABLE public.orthodontics_tracking  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implantology_tracking  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endodontics_tracking   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sterilization_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sterilization_cycles    ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas (nombres viejos y nuevos) para idempotencia
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['orthodontics_tracking','implantology_tracking','endodontics_tracking'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %L ON public.%I', t || '_select_team', t);
    EXECUTE format('DROP POLICY IF EXISTS %L ON public.%I', t || '_all_owner', t);
    EXECUTE format('DROP POLICY IF EXISTS %L ON public.%I', t || '_all_team', t);
    EXECUTE format('DROP POLICY IF EXISTS %L ON public.%I', 'Clínicas pueden ver sus propios registros de ' ||
      CASE t WHEN 'orthodontics_tracking' THEN 'ortodoncia' WHEN 'implantology_tracking' THEN 'implantología' ELSE 'endodoncia' END, t);
  END LOOP;
  EXECUTE 'DROP POLICY IF EXISTS "Clínicas pueden ver su propio inventario de esterilización" ON public.sterilization_inventory';
  EXECUTE 'DROP POLICY IF EXISTS "Clínicas pueden ver sus propios ciclos de esterilización" ON public.sterilization_cycles';
END $$;

-- --- Tablas por paciente: acceso por membresía de clínica ---
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['orthodontics_tracking','implantology_tracking','endodontics_tracking'] LOOP
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.patients p
            WHERE p.id = %I.patient_id
              AND p.admin_email = public.my_clinic_admin()
              AND p.deleted_at IS NULL
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.patients p
            WHERE p.id = %I.patient_id
              AND p.admin_email = public.my_clinic_admin()
              AND p.deleted_at IS NULL
          )
        );
    $f$, t || '_all_team', t, t, t);
  END LOOP;
END $$;

-- --- Esterilización: por clinic_email (mismo modelo que sprint 1) ---
CREATE POLICY "ster_inventory_all_team" ON public.sterilization_inventory
  FOR ALL TO authenticated
  USING (clinic_email = public.my_clinic_admin())
  WITH CHECK (clinic_email = public.my_clinic_admin());

CREATE POLICY "ster_cycles_all_team" ON public.sterilization_cycles
  FOR ALL TO authenticated
  USING (clinic_email = public.my_clinic_admin())
  WITH CHECK (clinic_email = public.my_clinic_admin());
