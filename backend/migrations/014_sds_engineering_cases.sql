-- 014_sds_engineering_cases.sql
-- Cola de incidentes de ingeniería del portal HP SDS + veredictos de IA.
-- Clave natural: (device_id, incident_id). hp_action_id (UUID de HP) solo aparece
-- en el detalle, por eso es nullable y secundario.

CREATE TABLE IF NOT EXISTS sds_engineering_cases (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id              TEXT NOT NULL,
    incident_id            TEXT NOT NULL,
    hp_action_id           TEXT,
    customer_id            TEXT,
    customer_name          TEXT,
    contract_id            TEXT,
    monitor_name           TEXT,
    serial                 TEXT NOT NULL,
    model                  TEXT,
    firmware               TEXT,
    state                  TEXT NOT NULL,
    severity               TEXT,
    case_type              TEXT,
    code                   TEXT NOT NULL,
    probability            SMALLINT,
    lead_days              INTEGER,
    median_days_to_failure INTEGER,
    created_at_portal      TIMESTAMP WITH TIME ZONE,
    updated_at_portal      TIMESTAMP WITH TIME ZONE,
    detail                 JSONB,
    detail_fetched_at      TIMESTAMP WITH TIME ZONE,
    first_seen_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_seen_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uq_sds_eng_case UNIQUE (device_id, incident_id)
);

CREATE INDEX IF NOT EXISTS idx_sds_eng_cases_open      ON sds_engineering_cases (state, severity, updated_at_portal DESC);
CREATE INDEX IF NOT EXISTS idx_sds_eng_cases_code      ON sds_engineering_cases (code);
CREATE INDEX IF NOT EXISTS idx_sds_eng_cases_serial    ON sds_engineering_cases (serial);
CREATE INDEX IF NOT EXISTS idx_sds_eng_cases_device    ON sds_engineering_cases (device_id);
CREATE INDEX IF NOT EXISTS idx_sds_eng_cases_hp_action ON sds_engineering_cases (hp_action_id) WHERE hp_action_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS sds_engineering_analyses (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id                UUID NOT NULL REFERENCES sds_engineering_cases(id) ON DELETE CASCADE,
    run_id                 TEXT,
    group_key              TEXT NOT NULL,
    veredicto              TEXT NOT NULL,
    confianza              TEXT NOT NULL,
    corroboracion_logs     TEXT,
    motivo_cierre_sugerido TEXT,
    causa_raiz             TEXT,
    analysis               JSONB NOT NULL,
    context_digest         TEXT NOT NULL,
    source                 TEXT NOT NULL DEFAULT 'ai',
    model                  TEXT NOT NULL,
    tokens                 JSONB,
    cost_usd               NUMERIC(10,6),
    created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sds_eng_analyses_case   ON sds_engineering_analyses (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sds_eng_analyses_run    ON sds_engineering_analyses (run_id);
CREATE INDEX IF NOT EXISTS idx_sds_eng_analyses_digest ON sds_engineering_analyses (case_id, context_digest);
