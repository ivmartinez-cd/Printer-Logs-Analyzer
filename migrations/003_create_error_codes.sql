-- Migration 003: Catalog of error codes for enrichment (used by POST /error-codes/upsert).
-- Matches infrastructure/repositories/error_code_repository.py.

CREATE TABLE IF NOT EXISTS error_codes (
    id          TEXT PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,
    severity    TEXT,
    description TEXT,
    solution_url TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_codes_code ON error_codes (code);
