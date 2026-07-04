-- Tabla para múltiples archivos por trabajo de laboratorio
CREATE TABLE IF NOT EXISTS public.lab_work_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_work_id TEXT NOT NULL REFERENCES public.lab_works(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    content_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT -- Email del usuario que subió el archivo
);

-- Habilitar RLS
ALTER TABLE public.lab_work_files ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
-- 1. Los admins y dentistas de la clínica pueden ver archivos de sus trabajos
CREATE POLICY "Clínica puede ver sus archivos de laboratorio" 
ON public.lab_work_files FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.lab_works lw 
        WHERE lw.id = lab_work_files.lab_work_id 
        AND lw.admin_email = auth.jwt()->>'email'
    )
    OR 
    EXISTS (
        SELECT 1 FROM public.lab_works lw
        JOIN public.team t ON lw.admin_email = t.admin_email
        WHERE lw.id = lab_work_files.lab_work_id
        AND t.data->>'email' = auth.jwt()->>'email'
        AND t.deleted_at IS NULL
    )
);

-- 2. El laboratorio asignado puede ver los archivos
CREATE POLICY "Laboratorio puede ver sus archivos asignados" 
ON public.lab_work_files FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.lab_works lw 
        WHERE lw.id = lab_work_files.lab_work_id 
        AND lw.lab_email = auth.jwt()->>'email'
    )
);

-- 3. Permitir inserción a quienes tienen acceso al trabajo
CREATE POLICY "Usuarios autorizados pueden subir archivos" 
ON public.lab_work_files FOR INSERT 
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

-- 4. Permitir borrado al creador del archivo o admin de la clínica
CREATE POLICY "Creador o admin pueden borrar archivos" 
ON public.lab_work_files FOR DELETE 
USING (
    created_by = auth.jwt()->>'email'
    OR EXISTS (
        SELECT 1 FROM public.lab_works lw 
        WHERE lw.id = lab_work_files.lab_work_id 
        AND lw.admin_email = auth.jwt()->>'email'
    )
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_lab_work_files_work_id ON public.lab_work_files(lab_work_id);
