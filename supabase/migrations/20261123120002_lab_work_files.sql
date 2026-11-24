-- =================================================================
-- ShiningCloud Dental — Migración 2026-11-23 #3
-- lab_work_files: múltiples archivos por trabajo de laboratorio.
-- (Versión ordenada del antiguo supabase_lab_files.sql, idéntica
-- en comportamiento, con índice de auditoría por created_by.)
-- Idempotente.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.lab_work_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_work_id TEXT NOT NULL REFERENCES public.lab_works(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    content_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

ALTER TABLE public.lab_work_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_files_select_clinic" ON public.lab_work_files;
DROP POLICY IF EXISTS "lab_files_select_lab" ON public.lab_work_files;
DROP POLICY IF EXISTS "lab_files_insert_authorized" ON public.lab_work_files;
DROP POLICY IF EXISTS "lab_files_delete_creator_or_admin" ON public.lab_work_files;

CREATE POLICY "lab_files_select_clinic" ON public.lab_work_files
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lab_works lw
      WHERE lw.id = lab_work_files.lab_work_id
        AND (
          lw.admin_email = auth.jwt()->>'email'
          OR EXISTS (
            SELECT 1 FROM public.team t
            WHERE t.admin_email = lw.admin_email
              AND t.data->>'email' = auth.jwt()->>'email'
              AND t.deleted_at IS NULL
          )
        )
    )
  );

CREATE POLICY "lab_files_select_lab" ON public.lab_work_files
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lab_works lw
      WHERE lw.id = lab_work_files.lab_work_id
        AND lw.lab_email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "lab_files_insert_authorized" ON public.lab_work_files
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lab_works lw
      WHERE lw.id = lab_work_files.lab_work_id
        AND (
          lw.admin_email = auth.jwt()->>'email'
          OR lw.lab_email = auth.jwt()->>'email'
          OR EXISTS (
            SELECT 1 FROM public.team t
            WHERE t.admin_email = lw.admin_email
              AND t.data->>'email' = auth.jwt()->>'email'
              AND t.deleted_at IS NULL
          )
        )
    )
  );

CREATE POLICY "lab_files_delete_creator_or_admin" ON public.lab_work_files
  FOR DELETE TO authenticated
  USING (
    created_by = auth.jwt()->>'email'
    OR EXISTS (
      SELECT 1 FROM public.lab_works lw
      WHERE lw.id = lab_work_files.lab_work_id
        AND lw.admin_email = auth.jwt()->>'email'
    )
  );

CREATE INDEX IF NOT EXISTS idx_lab_work_files_work_id  ON public.lab_work_files(lab_work_id);
CREATE INDEX IF NOT EXISTS idx_lab_work_files_creator  ON public.lab_work_files(created_by, created_at DESC);
