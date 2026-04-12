-- Migración 007: Tabla de soluciones técnicas extraídas de CPMDs (Customer
-- Product Maintenance Documents) de HP. Almacena pasos técnicos, FRUs y
-- metadatos de origen por código de error y modelo de impresora.

CREATE TABLE IF NOT EXISTS error_solutions (
    id                SERIAL PRIMARY KEY,
    model_id          UUID NOT NULL REFERENCES printer_models(id) ON DELETE CASCADE,
    code              VARCHAR(20) NOT NULL,
    title             TEXT,
    cause             TEXT,
    technician_steps  JSONB NOT NULL DEFAULT '[]'::jsonb,
    frus              JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_audience   VARCHAR(20),  -- 'service' | 'customers'
    source_page       INTEGER,
    cpmd_hash         VARCHAR(64),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (model_id, code)
);

CREATE INDEX IF NOT EXISTS idx_error_solutions_model_code ON error_solutions(model_id, code);
