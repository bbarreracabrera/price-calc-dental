-- Tabla de Seguimiento de Ortodoncia
CREATE TABLE IF NOT EXISTS orthodontics_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    treatment_type TEXT,
    torque_angulation TEXT,
    archwire_type TEXT,
    archwire_change_date DATE,
    elastomers TEXT,
    activation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Tabla de Seguimiento de Implantología
CREATE TABLE IF NOT EXISTS implantology_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Tabla de Seguimiento de Endodoncia
CREATE TABLE IF NOT EXISTS endodontics_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    tooth_number TEXT,
    diagnosis TEXT,
    working_length TEXT,
    instruments_used TEXT,
    irrigation_solution TEXT,
    intracanal_medication TEXT,
    obturation_material TEXT,
    radiographic_follow_up BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Tabla de Inventario de Esterilización
CREATE TABLE IF NOT EXISTS sterilization_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_email TEXT,
    item_name TEXT NOT NULL,
    category TEXT, -- 'Instrumental', 'Kits', 'Materiales'
    total_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    in_sterilization_quantity INTEGER DEFAULT 0,
    last_sterilized_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Ciclos de Esterilización
CREATE TABLE IF NOT EXISTS sterilization_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_email TEXT,
    cycle_number TEXT,
    autoclave_id TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    temperature TEXT,
    pressure TEXT,
    operator TEXT,
    items JSONB, -- Lista de items y cantidades en este ciclo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
