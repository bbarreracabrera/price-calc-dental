-- Habilitar RLS en las tablas de especialidades
ALTER TABLE orthodontics_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE implantology_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE endodontics_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE sterilization_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sterilization_cycles ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para obtener el email del admin de la clínica del usuario actual
-- Esta función ya debería existir o basarse en la lógica de 'settings' o 'team'
-- Asumimos que el admin_email se puede obtener de la tabla 'patients' a través de patient_id

-- Políticas para orthodontics_tracking
CREATE POLICY "Clínicas pueden ver sus propios registros de ortodoncia"
ON orthodontics_tracking FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = orthodontics_tracking.patient_id
        AND patients.admin_email = (SELECT auth.email())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = orthodontics_tracking.patient_id
        AND patients.admin_email = (SELECT auth.email())
    )
);

-- Políticas para implantology_tracking
CREATE POLICY "Clínicas pueden ver sus propios registros de implantología"
ON implantology_tracking FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = implantology_tracking.patient_id
        AND patients.admin_email = (SELECT auth.email())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = implantology_tracking.patient_id
        AND patients.admin_email = (SELECT auth.email())
    )
);

-- Políticas para endodontics_tracking
CREATE POLICY "Clínicas pueden ver sus propios registros de endodoncia"
ON endodontics_tracking FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = endodontics_tracking.patient_id
        AND patients.admin_email = (SELECT auth.email())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM patients
        WHERE patients.id = endodontics_tracking.patient_id
        AND patients.admin_email = (SELECT auth.email())
    )
);

-- Políticas para sterilization_inventory
CREATE POLICY "Clínicas pueden ver su propio inventario de esterilización"
ON sterilization_inventory FOR ALL
TO authenticated
USING (clinic_email = (SELECT auth.email()))
WITH CHECK (clinic_email = (SELECT auth.email()));

-- Políticas para sterilization_cycles
CREATE POLICY "Clínicas pueden ver sus propios ciclos de esterilización"
ON sterilization_cycles FOR ALL
TO authenticated
USING (clinic_email = (SELECT auth.email()))
WITH CHECK (clinic_email = (SELECT auth.email()));
