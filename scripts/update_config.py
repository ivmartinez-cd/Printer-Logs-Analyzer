"""Update active config in Neon from config.json (creates a new version)."""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from infrastructure.json_config_validator import JsonConfigValidator
from infrastructure.repositories.config_repository import AuditRecord, AuditRepository, ConfigRepository


def main() -> None:
    config_path = _REPO_ROOT / "config.json"
    if not config_path.exists():
        print("config.json not found at project root. Aborting.")
        sys.exit(1)

    payload = json.loads(config_path.read_text(encoding="utf-8"))
    validator = JsonConfigValidator()
    validator.validate(payload)

    repo = ConfigRepository()
    audit = AuditRepository()

    version = repo.create_version(payload, created_by="update_config")
    audit.log(
        AuditRecord(
            user="update_config",
            action="CONFIG_UPDATE",
            version_number=version.version_number,
            timestamp=datetime.utcnow(),
        )
    )

    print(f"Config updated. New version: {version.version_number} (id={version.id})")
    print("Rules loaded:", [r.get("code") for r in payload.get("global_rules", [])])


if __name__ == "__main__":
    main()
