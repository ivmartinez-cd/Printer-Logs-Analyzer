-- Migration 004: MODERN Technical solutions from CPMDs (uses model_family string).
CREATE TABLE IF NOT EXISTS error_solutions (
    id                SERIAL PRIMARY KEY,
    model_family      TEXT NOT NULL,
    code              VARCHAR(20) NOT NULL,
    title             TEXT,
    cause             TEXT,
    technician_steps  JSONB NOT NULL DEFAULT '[]'::jsonb,
    frus              JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_audience   VARCHAR(20),  -- 'service' | 'customers'
    source_page       INTEGER,
    cpmd_hash         VARCHAR(64),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (model_family, code)
);

CREATE INDEX IF NOT EXISTS idx_error_solutions_family_code ON error_solutions(model_family, code);
