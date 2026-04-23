-- 010_maintenance_incidents.sql
-- Incidentes de mantenimiento: suprimen alertas hasta ser cerrados

CREATE TABLE IF NOT EXISTS maintenance_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_serial TEXT REFERENCES maintenance_devices(serial) ON DELETE CASCADE,
    component_type TEXT NOT NULL,
    incident_number TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'open', -- 'open' | 'closed'
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_device ON maintenance_incidents(device_serial);
CREATE INDEX IF NOT EXISTS idx_maintenance_incidents_open ON maintenance_incidents(device_serial, component_type, status);
