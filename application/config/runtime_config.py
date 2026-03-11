"""Runtime caching and management of rule configurations."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from infrastructure.json_config_validator import ConfigDocument, JsonConfigValidator
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

    def get(self) -> ActiveConfig:
        """Return the cached configuration, loading from DB if needed."""
        if self._cache is None:
            self._cache = self._load()
        return self._cache

    def refresh(self) -> ActiveConfig:
        """Force a reload from the database."""
        self._cache = None
        return self.get()

    def _load(self) -> ActiveConfig:
        version = self.repository.get_latest()
        if not version:
            raise RuntimeError("No configuration versions found in the database")
        payload = self.validator.validate(version.config_json)
        return ActiveConfig(
            version_id=version.id,
            version_number=version.version_number,
            payload=payload,
            created_at=version.created_at,
            created_by=version.created_by,
        )


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

    def get_active(self) -> ActiveConfig:
        return self.runtime_config.get()

    def update(self, payload: dict, actor: str) -> ActiveConfig:
        validated = self.validator.validate(payload)
        version = self.repository.create_version(validated.model_dump(), created_by=actor)
        self.audit_repository.log(
            AuditRecord(user=actor, action="CONFIG_UPDATE", version_number=version.version_number, timestamp=datetime.utcnow())
        )
        self.snapshot_store.save(f"config_v{version.version_number}", version.config_json)
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
