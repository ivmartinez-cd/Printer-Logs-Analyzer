-- Migration 005: Saved analyses (incidents) for comparison.
CREATE TABLE IF NOT EXISTS saved_analyses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    equipment_identifier TEXT,
    model_name          TEXT,  -- MODERN: uses string instead of UUID
    incidents           JSONB NOT NULL DEFAULT '[]',
    global_severity     TEXT NOT NULL DEFAULT 'INFO',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_analyses_created_at ON saved_analyses (created_at DESC);
