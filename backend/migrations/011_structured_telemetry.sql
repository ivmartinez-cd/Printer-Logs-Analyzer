-- 011_structured_telemetry.sql
-- Structured per-device telemetry history for health degradation tracking

CREATE TABLE IF NOT EXISTS device_telemetry_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_serial       TEXT NOT NULL,
    saved_analysis_id   UUID REFERENCES saved_analyses(id) ON DELETE SET NULL,
    code                TEXT NOT NULL,
    classification      TEXT,
    severity            TEXT NOT NULL DEFAULT 'INFO',
    occurrences         INTEGER NOT NULL DEFAULT 1,
    counter             INTEGER NOT NULL DEFAULT 0,
    event_time          TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indices for efficient device health evaluation and telemetry queries
CREATE INDEX IF NOT EXISTS idx_device_telemetry_serial_time ON device_telemetry_events (device_serial, event_time DESC, counter DESC);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_serial_code ON device_telemetry_events (device_serial, code);
