"""Snapshot storage abstractions (JSON for MVP, extensible later)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


class SnapshotStore:
    """Persist analysis snapshots for reproducibility."""

    def __init__(self, base_path: Path) -> None:
        self.base_path = base_path
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, name: str, payload: Dict[str, Any]) -> Path:
        """Persist a JSON snapshot and return its path."""
        target = self.base_path / f"{name}.json"
        target.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return target

    def load(self, name: str) -> Dict[str, Any]:
        """Load a saved snapshot."""
        target = self.base_path / f"{name}.json"
        data = target.read_text(encoding="utf-8")
        return json.loads(data)
