"""Fleet repository — reads client/device data from JSON seed file."""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import TypedDict

_FLEET_FILE = Path(__file__).parent.parent / "fallback" / "fleet.json"
_lock = threading.Lock()


class DeviceEntry(TypedDict):
    serial: str
    location: str
    model: str | None


class ClientEntry(TypedDict):
    id: str
    name: str
    devices: list[DeviceEntry]
    is_dynamic: bool | None  # New flag for live discovery


class FleetRepository:
    def __init__(self) -> None:
        self._data: list[ClientEntry] | None = None

    def _load(self) -> list[ClientEntry]:
        with _lock:
            if self._data is None:
                self._data = json.loads(_FLEET_FILE.read_text(encoding="utf-8"))
        return self._data  # type: ignore[return-value]

    def list_clients(self) -> list[dict]:
        clients = self._load()
        return [
            {
                "id": c["id"],
                "name": c["name"],
                "device_count": 1083 if c["id"] == "dia-central" else len(c["devices"]),
                "is_dynamic": c.get("is_dynamic", False),
            }
            for c in clients
        ]

    def get_client(self, client_id: str) -> ClientEntry | None:
        for c in self._load():
            if c["id"] == client_id:
                return c
        return None

    def get_devices(self, client_id: str) -> list[DeviceEntry]:
        client = self.get_client(client_id)
        return client["devices"] if client else []
