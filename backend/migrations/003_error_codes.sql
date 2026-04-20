-- Migration 003: Catalog of error codes and enriched content.
CREATE TABLE IF NOT EXISTS error_codes (
    id          SERIAL PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,
    severity    TEXT,
    description TEXT,
    solution_url TEXT,
    solution_content TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_codes_code ON error_codes (code);
