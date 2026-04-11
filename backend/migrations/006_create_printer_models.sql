-- Migración 006: Modelos de impresora, consumibles y códigos relacionados.
-- Habilita el feature de warnings de vida útil de consumibles basados
-- en el contador del log.

-- Tabla de modelos de impresora.
-- Cada submodelo (E60055, E60065, etc.) es una fila separada.
CREATE TABLE IF NOT EXISTS printer_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL UNIQUE,
    model_code TEXT NOT NULL UNIQUE,
    family TEXT,
    ampv INTEGER,
    engine_life_pages INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_printer_models_code
    ON printer_models(model_code);

-- Tabla de consumibles por modelo.
CREATE TABLE IF NOT EXISTS printer_consumables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES printer_models(id) ON DELETE CASCADE,
    part_number TEXT NOT NULL,
    sku TEXT,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    life_pages INTEGER,
    mttr_minutes INTEGER,
    voltage TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(model_id, part_number)
);

CREATE INDEX IF NOT EXISTS idx_printer_consumables_model
    ON printer_consumables(model_id);

-- Tabla intermedia: códigos de error que indican necesidad de
-- revisar/cambiar un consumible. Soporta wildcard 'z' en los patrones.
CREATE TABLE IF NOT EXISTS consumable_related_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumable_id UUID NOT NULL REFERENCES printer_consumables(id) ON DELETE CASCADE,
    code_pattern TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(consumable_id, code_pattern)
);

CREATE INDEX IF NOT EXISTS idx_consumable_related_codes_pattern
    ON consumable_related_codes(code_pattern);

-- Asociar un modelo al snapshot de análisis guardado.
-- Nullable para mantener compatibilidad con análisis existentes.
ALTER TABLE saved_analyses
    ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES printer_models(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_saved_analyses_model
    ON saved_analyses(model_id);
