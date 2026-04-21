-- 009_refactor_maintenance_rules.sql
-- Migración para estructurar reglas de mantenimiento por Familia de Modelos

-- 1. Eliminar la tabla anterior (se asume que no hay datos de producción o ya se eliminaron los de prueba)
DROP TABLE IF EXISTS maintenance_rules CASCADE;

-- 2. Catálogo maestro de reglas por familia de modelo
CREATE TABLE IF NOT EXISTS maintenance_model_rules (
    id SERIAL PRIMARY KEY,
    model_family TEXT NOT NULL,
    component_type TEXT NOT NULL,
    expected_life INTEGER NOT NULL,
    alert_margin INTEGER NOT NULL DEFAULT 5000,
    email_recipients TEXT,
    UNIQUE(model_family, component_type)
);

-- 3. Estado de componentes por dispositivo (Contadores)
CREATE TABLE IF NOT EXISTS maintenance_device_state (
    id SERIAL PRIMARY KEY,
    device_serial TEXT REFERENCES maintenance_devices(serial) ON DELETE CASCADE,
    component_type TEXT NOT NULL,
    last_change_counter INTEGER NOT NULL DEFAULT 0,
    UNIQUE(device_serial, component_type)
);

-- 4. Re-insertar datos semilla usando la nueva estructura
INSERT INTO maintenance_model_rules (model_family, component_type, expected_life, alert_margin, email_recipients)
VALUES ('HP LaserJet M600 Series', 'Fuser Kit', 225000, 10000, 'soporte@ejemplo.com')
ON CONFLICT (model_family, component_type) DO NOTHING;

INSERT INTO maintenance_device_state (device_serial, component_type, last_change_counter)
VALUES ('BRBSN9YYHQ', 'Fuser Kit', 0)
ON CONFLICT (device_serial, component_type) DO NOTHING;
