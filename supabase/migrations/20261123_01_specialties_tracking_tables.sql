-- =================================================================
-- ShiningCloud Dental — Migración 2026-11-23 #1
-- Tablas de especialidades con el nombre que usa el código
-- (*_tracking). Idempotente: segura de re-ejecutar.
--
-- Historia: SPECIALTIES_TABLES.sql creaba estas tablas como
-- *_tracking, pero PatientWorkspace y sus 3 tabs consultaban
-- *_records (tablas inexistentes). Se estandariza el código a
-- *_tracking; esta migración garantiza que existan con ese nombre.
-- =================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --- Ortodoncia ---
CREATE TABLE IF NOT EXISTS public.orthodontics_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    treatment_type TEXT,
    torque_angulation TEXT,
    archwire_type TEXT,
    archwire_change_date DATE,
    elastomers TEXT,
    activation_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

-- --- Implantología ---
CREATE TABLE IF NOT EXISTS public.implantology_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    implant_brand TEXT,
    implant_model TEXT,
    diameter TEXT,
    length TEXT,
    insertion_torque TEXT,
    placement_date DATE,
    stage TEXT,
    abutment_type TEXT,
    crown_type TEXT,
    bone_graft BOOLEAN DEFAULT FALSE,
    bone_graft_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

-- --- Endodoncia ---
CREATE TABLE IF NOT EXISTS public.endodontics_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    tooth_number TEXT,
    diagnosis TEXT,
    working_length TEXT,
    instruments_used TEXT,
    irrigation_solution TEXT,
    intracanal_medication TEXT,
    obturation_material TEXT,
    radiographic_follow_up BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_ortho_track_patient   ON public.orthodontics_tracking(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_implanto_track_patient ON public.implantology_tracking(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_endo_track_patient     ON public.endodontics_tracking(patient_id, created_at DESC);

-- Índice que acelera el JOIN de las políticas (patient_id -> admin_email)
CREATE INDEX IF NOT EXISTS idx_patients_id_admin ON public.patients(id, admin_email);

-- =================================================================
-- Respaldo si existiera una tabla *_records con datos reales
-- =================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['orthodontics','implantology','endodontics'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name = t || '_records') THEN
      EXECUTE format(
        'INSERT INTO public.%I_tracking SELECT * FROM public.%I_records ON CONFLICT DO NOTHING;',
        t, t);
      RAISE NOTICE 'Migrados datos de %_records a %_tracking', t, t;
    END IF;
  END LOOP;
END $$;
