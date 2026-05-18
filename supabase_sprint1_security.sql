-- =================================================================
-- ShiningCloud Dental — Sprint 1: Hardening de Seguridad
-- Aplicar en: Supabase Dashboard > SQL Editor
-- Orden: ejecutar completo, una sola vez
-- =================================================================


-- ══════════════════════════════════════════════════════════════
-- S1-A: Función server-side para rol del usuario autenticado
-- ══════════════════════════════════════════════════════════════
-- Retorna el rol del usuario actual consultando la tabla team.
-- Si no está en team, asume 'admin' (es propietario de su clínica).
-- SECURITY DEFINER para acceso a auth.email() sin permisos extra.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT data->>'role'
      FROM team
      WHERE data->>'email' = auth.email()
        AND deleted_at IS NULL
      LIMIT 1
    ),
    'admin'
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- S1-A: Políticas de escritura en tabla "team"
-- Solo el admin propietario puede gestionar su equipo
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "team_insert_admin_only" ON team;
DROP POLICY IF EXISTS "team_update_admin_only" ON team;
DROP POLICY IF EXISTS "team_delete_admin_only" ON team;

CREATE POLICY "team_insert_admin_only" ON team
  FOR INSERT TO authenticated
  WITH CHECK (admin_email = auth.email());

CREATE POLICY "team_update_admin_only" ON team
  FOR UPDATE TO authenticated
  USING  (admin_email = auth.email())
  WITH CHECK (admin_email = auth.email());

CREATE POLICY "team_delete_admin_only" ON team
  FOR DELETE TO authenticated
  USING (admin_email = auth.email());


-- ══════════════════════════════════════════════════════════════
-- S1-A: Políticas de escritura en tabla "settings"
-- Solo el admin puede modificar la configuración de su clínica
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "settings_insert_admin_only" ON settings;
DROP POLICY IF EXISTS "settings_update_admin_only" ON settings;

CREATE POLICY "settings_insert_admin_only" ON settings
  FOR INSERT TO authenticated
  WITH CHECK (admin_email = auth.email());

CREATE POLICY "settings_update_admin_only" ON settings
  FOR UPDATE TO authenticated
  USING  (admin_email = auth.email())
  WITH CHECK (admin_email = auth.email());


-- ══════════════════════════════════════════════════════════════
-- S1-A: Políticas de escritura en tabla "catalog"
-- Solo admin puede crear/modificar el catálogo de tratamientos
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "catalog_insert_admin_only" ON catalog;
DROP POLICY IF EXISTS "catalog_update_admin_only" ON catalog;
DROP POLICY IF EXISTS "catalog_delete_admin_only" ON catalog;

CREATE POLICY "catalog_insert_admin_only" ON catalog
  FOR INSERT TO authenticated
  WITH CHECK (admin_email = auth.email());

CREATE POLICY "catalog_update_admin_only" ON catalog
  FOR UPDATE TO authenticated
  USING  (admin_email = auth.email())
  WITH CHECK (admin_email = auth.email());

CREATE POLICY "catalog_delete_admin_only" ON catalog
  FOR DELETE TO authenticated
  USING (admin_email = auth.email());


-- ══════════════════════════════════════════════════════════════
-- S1-D: Registro append-only en "clinical_evolutions" (Ley 20.584)
-- Evoluciones clínicas: INSERT permitido, UPDATE/DELETE bloqueados
-- ══════════════════════════════════════════════════════════════

ALTER TABLE clinical_evolutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evo_select_team"  ON clinical_evolutions;
DROP POLICY IF EXISTS "evo_insert_team"  ON clinical_evolutions;
DROP POLICY IF EXISTS "evo_no_update"    ON clinical_evolutions;
DROP POLICY IF EXISTS "evo_no_delete"    ON clinical_evolutions;

-- Helper inline para obtener el admin de la clínica del usuario actual
-- (duplica lógica de get_my_role para evitar dependencia circular)
CREATE OR REPLACE FUNCTION public.my_clinic_admin()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT admin_email FROM team WHERE data->>'email' = auth.email() AND deleted_at IS NULL LIMIT 1),
    auth.email()
  )
$$;

GRANT EXECUTE ON FUNCTION public.my_clinic_admin() TO authenticated;

-- Lectura: solo miembros de la misma clínica
CREATE POLICY "evo_select_team" ON clinical_evolutions
  FOR SELECT TO authenticated
  USING (clinic_email = my_clinic_admin());

-- Inserción: cualquier miembro autenticado de la clínica
CREATE POLICY "evo_insert_team" ON clinical_evolutions
  FOR INSERT TO authenticated
  WITH CHECK (clinic_email = my_clinic_admin());

-- UPDATE y DELETE: sin policy → rechazados automáticamente por RLS
-- Esto implementa el registro inmutable exigido por Ley 20.584 (Chile):
-- "Los prestadores deberán mantener un sistema de registro de las
--  evoluciones que no admita la eliminación de registros anteriores."


-- ══════════════════════════════════════════════════════════════
-- VERIFICACIÓN (ejecutar después de aplicar las policies)
-- ══════════════════════════════════════════════════════════════

-- SELECT get_my_role();                  -- debe retornar 'admin' si eres admin
-- SELECT my_clinic_admin();              -- debe retornar tu propio email si eres admin
-- SELECT pg_policies.policyname, pg_policies.cmd
--   FROM pg_policies
--   WHERE tablename IN ('team', 'settings', 'catalog', 'clinical_evolutions')
--   ORDER BY tablename, cmd;
