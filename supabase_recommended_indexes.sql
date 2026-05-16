-- ShiningCloud Dental — Índices recomendados para Supabase
-- Aplicar manualmente en el SQL Editor de Supabase cuando sea necesario.
-- Todos usan IF NOT EXISTS para ser idempotentes.

-- patients: acelera la carga inicial por clínica, ignorando borrados lógicos
CREATE INDEX IF NOT EXISTS idx_patients_admin_active
    ON patients(admin_email)
    WHERE deleted_at IS NULL;

-- appointments: acelera la agenda por clínica y rango de fechas
CREATE INDEX IF NOT EXISTS idx_appointments_admin_date
    ON appointments(admin_email, (data->>'date'))
    WHERE deleted_at IS NULL;

-- financials: acelera los reportes financieros por clínica y rango de fechas
CREATE INDEX IF NOT EXISTS idx_financials_admin_date
    ON financials(admin_email, (data->>'date'))
    WHERE deleted_at IS NULL;

-- inventory: acelera la vista de inventario por clínica
CREATE INDEX IF NOT EXISTS idx_inventory_admin
    ON inventory(admin_email)
    WHERE deleted_at IS NULL;

-- audit_logs: acelera la consulta del historial de auditoría por usuario y tiempo
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time
    ON audit_logs(user_email, timestamp DESC);
