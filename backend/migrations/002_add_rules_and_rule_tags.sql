CREATE TABLE rules (
  id                UUID PRIMARY KEY,
  config_version_id TEXT NOT NULL REFERENCES config_versions(id) ON DELETE CASCADE,
  code              TEXT NOT NULL,
  classification    TEXT NOT NULL,
  description       TEXT NOT NULL,
  resolution        TEXT NOT NULL,
  recency_window    INTEGER NOT NULL,
  x_threshold       INTEGER NOT NULL,
  y_window          INTEGER NOT NULL,
  counter_max_jump  INTEGER NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  sds_link          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        TEXT NOT NULL
);

CREATE UNIQUE INDEX ux_rules_config_version_code
  ON rules (config_version_id, code);

CREATE INDEX idx_rules_code
  ON rules (code);

CREATE INDEX idx_rules_enabled
  ON rules (config_version_id, enabled);

CREATE TABLE rule_tags (
  rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (rule_id, tag)
);

CREATE INDEX idx_rule_tags_tag
  ON rule_tags (tag);