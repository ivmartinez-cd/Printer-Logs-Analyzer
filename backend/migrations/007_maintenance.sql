-- 007_maintenance.sql
-- Tablas para el Sistema de Alertas de Consumibles por Contador

-- Registro de equipos a monitorear
CREATE TABLE IF NOT EXISTS maintenance_devices (
    serial TEXT PRIMARY KEY,
    model_family TEXT,
    last_sync_counter INTEGER DEFAULT 0,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Reglas de mantenimiento por componente
CREATE TABLE IF NOT EXISTS maintenance_rules (
    id SERIAL PRIMARY KEY,
    device_serial TEXT REFERENCES maintenance_devices(serial) ON DELETE CASCADE,
    component_type TEXT NOT NULL, -- 'Fuser', 'Maintenance Kit', etc.
    last_change_counter INTEGER NOT NULL DEFAULT 0,
    expected_life INTEGER NOT NULL, -- Vida útil en páginas
    alert_margin INTEGER NOT NULL DEFAULT 5000, -- Páginas antes del vencimiento para alertar
    email_recipients TEXT, -- Lista separada por comas
    UNIQUE(device_serial, component_type)
);

-- Registro de alertas disparadas para evitar duplicados (cooldown)
CREATE TABLE IF NOT EXISTS maintenance_alerts (
    id SERIAL PRIMARY KEY,
    device_serial TEXT REFERENCES maintenance_devices(serial) ON DELETE CASCADE,
    component_type TEXT NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    counter_at_alert INTEGER NOT NULL,
    status TEXT DEFAULT 'SENT' -- 'PENDING', 'SENT', 'RESOLVED'
);

-- Semilla inicial para pruebas
INSERT INTO maintenance_devices (serial, model_family) 
VALUES ('BRBSN9YYHQ', 'HP LaserJet M600 Series')
ON CONFLICT (serial) DO NOTHING;

INSERT INTO maintenance_rules (device_serial, component_type, last_change_counter, expected_life, alert_margin, email_recipients)
VALUES ('BRBSN9YYHQ', 'Fuser Kit', 0, 225000, 10000, 'soporte@ejemplo.com')
ON CONFLICT (device_serial, component_type) DO NOTHING;
