"""Runtime caching and management of rule configurations."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from psycopg2 import extras

from infrastructure.database import Database
from infrastructure.json_config_validator import ConfigDocument, GlobalRuleModel, JsonConfigValidator
from infrastructure.repositories.config_repository import (
    AuditRecord,
    AuditRepository,
    ConfigRepository,
    ConfigVersion,
)
from infrastructure.snapshots import SnapshotStore


@dataclass
class ActiveConfig:
    """In-memory representation of the active configuration."""

    version_id: str
    version_number: int
    payload: ConfigDocument
    created_at: datetime
    created_by: str


@dataclass
class ConfigHistoryEntry:
    """History element enriched with a short diff summary."""

    version_number: int
    created_at: datetime
    created_by: str
    diff: Dict[str, List[str]]


class RuntimeConfig:
    """Caches the active configuration without requiring backend restarts."""

    def __init__(self, repository: ConfigRepository, validator: JsonConfigValidator) -> None:
        self.repository = repository
        self.validator = validator
        self._cache: Optional[ActiveConfig] = None
        self._db = Database()

    def get(self) -> ActiveConfig:
        """Return the cached configuration, loading from DB if needed."""
        if self._cache is None:
            self._cache = self._load()
        return self._cache

    def _load(self) -> ActiveConfig:
        version = self.repository.get_latest()
        if not version:
            raise RuntimeError("No configuration versions found in the database")

        # 1) Validar documento completo desde JSON como hasta ahora
        raw_payload = self.validator.validate(version.config_json)

        rules_rows: List[dict] = []
        # 2) Intentar cargar reglas normalizadas desde tablas rules / rule_tags
        with self._db.connect() as conn, conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id,
                       code,
                       classification,
                       description,
                       resolution,
                       recency_window,
                       x_threshold,
                       y_window,
                       counter_max_jump,
                       enabled,
                       sds_link
                FROM rules
                WHERE config_version_id = %s
                ORDER BY code
                """,
                (version.id,),
            )
            rules_rows = cur.fetchall() or []

            if rules_rows:
                rules: List[GlobalRuleModel] = []
                for row in rules_rows:
                    cur.execute(
                        "SELECT tag FROM rule_tags WHERE rule_id = %s ORDER BY tag",
                        (row["id"],),
                    )
                    tag_rows = cur.fetchall() or []
                    tags = [t["tag"] for t in tag_rows]

                    rule_dict = {
                        "code": row["code"],
                        "classification": row["classification"],
                        "description": row["description"],
                        "resolution": row["resolution"],
                        "recency_window": row["recency_window"],
                        "X": row["x_threshold"],
                        "Y": row["y_window"],
                        "counter_max_jump": row["counter_max_jump"],
                        "severity_weight": None,
                        "enabled": row["enabled"],
                        "tags": tags,
                        "sds_link": row["sds_link"],
                    }
                    rules.append(GlobalRuleModel.model_validate(rule_dict))

                payload = ConfigDocument(
                    metadata=raw_payload.metadata,
                    defaults=raw_payload.defaults,
                    models=raw_payload.models,
                    global_rules=rules,
                )
            else:
                # Fallback limpio al JSON legacy
                payload = raw_payload

        rules_codes = [r.code for r in payload.global_rules]
        source = "rules_table" if rules_rows else "config_json"
        print(
            "[RuntimeConfig._load] fuente=%s version_number=%s rules.code=%s"
            % (source, version.version_number, rules_codes)
        )
        return ActiveConfig(
            version_id=version.id,
            version_number=version.version_number,
            payload=payload,
            created_at=version.created_at,
            created_by=version.created_by,
        )

    def refresh(self) -> ActiveConfig:
        """Force a reload from the database."""
        self._cache = None
        return self.get()

    def force_reload(self) -> None:
        """Clear cache so next get() loads from the database again."""
        self._cache = None


class ConfigService:
    """Facade coordinating versioning, validation, auditing, and caching."""

    def __init__(
        self,
        repository: ConfigRepository,
        audit_repository: AuditRepository,
        runtime_config: RuntimeConfig,
        validator: JsonConfigValidator,
        snapshot_store: Optional[SnapshotStore] = None,
    ) -> None:
        self.repository = repository
        self.audit_repository = audit_repository
        self.runtime_config = runtime_config
        self.validator = validator
        self.snapshot_store = snapshot_store or SnapshotStore(Path("snapshots/config_versions"))
        self._db = Database()

    def get_active(self) -> ActiveConfig:
        return self.runtime_config.get()

    def update(self, payload: dict, actor: str) -> ActiveConfig:
        validated = self.validator.validate(payload)
        version = self.repository.create_version(validated.model_dump(), created_by=actor)
        self.audit_repository.log(
            AuditRecord(user=actor, action="CONFIG_UPDATE", version_number=version.version_number, timestamp=datetime.utcnow())
        )
        self.snapshot_store.save(f"config_v{version.version_number}", version.config_json)

        # Escritura híbrida: insertar reglas en tablas rules + rule_tags
        with self._db.connect() as conn, conn.cursor() as cur:
            for rule in validated.global_rules:
                rule_id = str(uuid.uuid4())
                cur.execute(
                    """
                    INSERT INTO rules (
                        id,
                        config_version_id,
                        code,
                        classification,
                        description,
                        resolution,
                        recency_window,
                        x_threshold,
                        y_window,
                        counter_max_jump,
                        enabled,
                        sds_link,
                        created_by
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        rule_id,
                        version.id,
                        rule.code,
                        rule.classification,
                        rule.description,
                        rule.resolution,
                        rule.recency_window,
                        rule.X,
                        rule.Y,
                        rule.counter_max_jump,
                        rule.enabled,
                        getattr(rule, "sds_link", None),
                        actor,
                    ),
                )
                for tag in rule.tags:
                    cur.execute(
                        "INSERT INTO rule_tags (rule_id, tag) VALUES (%s, %s)",
                        (rule_id, tag),
                    )
            conn.commit()

        return self.runtime_config.refresh()

    def history(self, limit: int = 20) -> List[ConfigHistoryEntry]:
        versions = self.repository.fetch_history(limit)
        history: List[ConfigHistoryEntry] = []
        previous: Optional[ConfigVersion] = None
        for version in versions:
            diff = self._diff(version.config_json, previous.config_json if previous else None)
            history.append(
                ConfigHistoryEntry(
                    version_number=version.version_number,
                    created_at=version.created_at,
                    created_by=version.created_by,
                    diff=diff,
                )
            )
            previous = version
        return history

    @staticmethod
    def _diff(current: dict, previous: Optional[dict]) -> Dict[str, List[str]]:
        current_rules = {rule["code"]: rule for rule in current.get("global_rules", [])}
        previous_rules = {rule["code"]: rule for rule in (previous or {}).get("global_rules", [])}

        added = sorted(set(current_rules) - set(previous_rules))
        removed = sorted(set(previous_rules) - set(current_rules))
        changed = sorted(
            code
            for code in set(current_rules).intersection(previous_rules)
            if current_rules[code] != previous_rules[code]
        )

        return {"added": added, "removed": removed, "updated": changed}
