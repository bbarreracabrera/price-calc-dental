-- =================================================================
-- ShiningCloud Dental — Fix: limpiar accepted_at incorrecto
-- del backfill que marcó labs pendientes como activos.
--
-- Aplica SOLO si corriste el backfill antes del fix del 2026-05-19.
-- Seguro de re-ejecutar (idempotente).
-- =================================================================

UPDATE settings
SET data = jsonb_set(
    data,
    '{laboratories}',
    (
        SELECT jsonb_agg(
            CASE
                -- Lab con last_invite_sent_at reciente (< 30 días)
                -- y accepted_at igual al fallback del backfill (2026-01-01):
                -- limpiarlo a null → vuelve a mostrarse como Pendiente
                WHEN (lab->>'last_invite_sent_at')::timestamptz > NOW() - INTERVAL '30 days'
                    AND (lab->>'accepted_at')::timestamptz < '2026-02-01'::timestamptz
                THEN lab || '{"accepted_at": null}'::jsonb
                ELSE lab
            END
        )
        FROM jsonb_array_elements(data->'laboratories') AS lab
    )
)
WHERE admin_email IS NOT NULL
  AND data ? 'laboratories';

-- Verificación: mostrar estado final de cada lab
SELECT
    admin_email,
    lab->>'name'               AS lab_name,
    lab->>'email'              AS lab_email,
    lab->>'invited_at'         AS invited_at,
    lab->>'accepted_at'        AS accepted_at,
    lab->>'last_invite_sent_at' AS last_invite_sent_at
FROM settings,
     jsonb_array_elements(data->'laboratories') AS lab
WHERE data ? 'laboratories'
ORDER BY admin_email, lab->>'name';
