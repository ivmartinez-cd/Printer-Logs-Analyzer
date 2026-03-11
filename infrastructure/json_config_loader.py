"""Utility to load JSON-based configuration or rule definitions."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def load_json_config(config_path: Path) -> Dict[str, Any]:
    """Read JSON files with helpful error messages."""
    if not config_path.exists():
        raise FileNotFoundError(f"JSON config not found: {config_path}")

    with config_path.open(encoding="utf-8") as handle:
        return json.load(handle)
