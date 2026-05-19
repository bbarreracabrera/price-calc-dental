-- =================================================================
-- ShiningCloud Dental — Fase A Lab: Migración a schema híbrido
-- Aplicar en: Supabase Dashboard > SQL Editor
-- =================================================================

-- 1. Agregar columna data JSONB (si no existe)
ALTER TABLE lab_works
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- 2. Migrar datos existentes desde columnas flat → data
UPDATE lab_works
SET data = jsonb_strip_nulls(jsonb_build_object(
    'patientId', "patientId",
    'patientName', "patientName",
    'workType', "workType",
    'tooth', tooth,
    'labName', "labName",
    'sendDate', "sendDate",
    'expectedDate', "expectedDate",
    'shade', shade,
    'notes', notes,
    'file_name', file_name,
    'file_url', file_url,
    'created_by', created_by
))
WHERE data IS NULL OR data = '{}'::jsonb;

-- 3. Normalizar status legacy (received → recibido, etc.)
UPDATE lab_works
SET status = CASE
    WHEN status = 'received' THEN 'recibido'
    WHEN status = 'sent' THEN 'recibido'
    WHEN status = 'enviado' THEN 'recibido'
    WHEN status = 'in_progress' THEN 'cad_cam'
    WHEN status = 'completed' THEN 'listo'
    WHEN status = 'shipped' THEN 'despachado'
    WHEN status IN ('recibido', 'cad_cam', 'ceramica', 'listo', 'despachado') THEN status
    ELSE 'recibido'
END
WHERE status IS NOT NULL;

-- 4. Crear índices para performance del kanban
CREATE INDEX IF NOT EXISTS idx_lab_works_lab_email_status
ON lab_works(lab_email, status)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lab_works_admin_email
ON lab_works(admin_email)
WHERE deleted_at IS NULL;

-- 5. Crear tabla lab_pricing para "Mi Arancel"
CREATE TABLE IF NOT EXISTS lab_pricing (
    id TEXT PRIMARY KEY,
    lab_email TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_pricing_lab_email
ON lab_pricing(lab_email)
WHERE deleted_at IS NULL;

ALTER TABLE lab_pricing ENABLE ROW LEVEL SECURITY;

-- Policies para lab_pricing: solo el lab dueño puede gestionar
DROP POLICY IF EXISTS "pricing_select_own" ON lab_pricing;
DROP POLICY IF EXISTS "pricing_insert_own" ON lab_pricing;
DROP POLICY IF EXISTS "pricing_update_own" ON lab_pricing;
DROP POLICY IF EXISTS "pricing_delete_own" ON lab_pricing;

CREATE POLICY "pricing_select_own" ON lab_pricing
    FOR SELECT TO authenticated
    USING (lab_email = auth.email());

CREATE POLICY "pricing_insert_own" ON lab_pricing
    FOR INSERT TO authenticated
    WITH CHECK (lab_email = auth.email());

CREATE POLICY "pricing_update_own" ON lab_pricing
    FOR UPDATE TO authenticated
    USING (lab_email = auth.email())
    WITH CHECK (lab_email = auth.email());

CREATE POLICY "pricing_delete_own" ON lab_pricing
    FOR DELETE TO authenticated
    USING (lab_email = auth.email());

-- Verificación
SELECT
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE data IS NOT NULL AND data != '{}'::jsonb) as con_data_migrada,
    COUNT(DISTINCT status) as estados_distintos
FROM lab_works
WHERE deleted_at IS NULL;

-- Listar estados después de normalizar
SELECT status, COUNT(*)
FROM lab_works
WHERE deleted_at IS NULL
GROUP BY status;
