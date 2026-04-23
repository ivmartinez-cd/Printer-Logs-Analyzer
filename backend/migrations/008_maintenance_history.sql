-- 008_maintenance_history.sql
-- Historial de intervenciones técnicas

CREATE TABLE IF NOT EXISTS maintenance_history (
    id SERIAL PRIMARY KEY,
    device_serial TEXT REFERENCES maintenance_devices(serial) ON DELETE CASCADE,
    component_type TEXT NOT NULL,
    change_counter INTEGER NOT NULL,
    incident_number TEXT,
    technician_notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_maintenance_history_device ON maintenance_history(device_serial);
