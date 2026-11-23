-- Cleanup de policies duplicadas detectadas en auditoría
-- Ejecutar manualmente en Supabase SQL Editor cuando
-- se haya verificado que las policies nuevas funcionan correctamente

-- catalog
DROP POLICY IF EXISTS "master_catalog_auth" ON catalog;

-- team
DROP POLICY IF EXISTS "Aislamiento total del Equipo" ON team;
DROP POLICY IF EXISTS "master_team_auth" ON team;

-- settings
DROP POLICY IF EXISTS "master_settings_auth" ON settings;

-- clinical_evolutions: eliminar redundantes
-- (prohibir_update y prohibir_delete son útiles, dejarlas)
DROP POLICY IF EXISTS "Aislamiento total de Evoluciones" ON clinical_evolutions;
DROP POLICY IF EXISTS "crear_mis_evoluciones" ON clinical_evolutions;
DROP POLICY IF EXISTS "ver_mis_evoluciones" ON clinical_evolutions;

-- Verificación final
SELECT
    tablename,
    policyname,
    cmd AS operacion
FROM pg_policies
WHERE tablename IN ('team', 'settings', 'catalog', 'clinical_evolutions', 'financials')
ORDER BY tablename, cmd;
