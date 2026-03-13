"""Seed initial configuration from config.json into the database.

Run from project root. If config_versions already has at least one row, does nothing.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Ensure project root is on path when running as script
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from infrastructure.json_config_validator import JsonConfigValidator
from infrastructure.repositories.config_repository import ConfigRepository


def main() -> None:
    config_path = _REPO_ROOT / "config.json"
    if not config_path.exists():
        print("config.json not found at project root. Aborting.")
        sys.exit(1)

    payload = json.loads(config_path.read_text(encoding="utf-8"))
    validator = JsonConfigValidator()
    validator.validate(payload)

    repo = ConfigRepository()
    if repo.get_latest() is not None:
        print("Config already exists. Skipping seed.")
        return

    version = repo.create_version(payload, created_by="seed")
    print(f"Seeded config as version {version.version_number} (id={version.id})")


if __name__ == "__main__":
    main()
