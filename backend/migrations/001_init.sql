-- Migration 001: Initial schema for config versioning and audit.
CREATE TABLE IF NOT EXISTS config_versions (
    id          TEXT PRIMARY KEY,
    version_number INTEGER NOT NULL,
    config_json   JSONB NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_config_versions_version_number ON config_versions (version_number DESC);

CREATE TABLE IF NOT EXISTS audit_log (
    "user"    TEXT NOT NULL,
    action    TEXT NOT NULL,
    version   INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log (timestamp DESC);
