"""Pydantic schemas for fleet monitor endpoints."""

from __future__ import annotations

from pydantic import BaseModel


class ClientSummary(BaseModel):
    id: str
    name: str
    device_count: int
    is_dynamic: bool = False


class DeviceSummary(BaseModel):
    serial: str
    location: str
    model: str | None = None


class ClientDetail(BaseModel):
    id: str
    name: str
    devices: list[DeviceSummary]


class ScanRequest(BaseModel):
    client_id: str
    days: int = 30
    models: list[str] | None = None


class RollerComponent(BaseModel):
    label: str
    percent: float


class FleetTopError(BaseModel):
    code: str
    count: int


class FleetTimelinePoint(BaseModel):
    date: str
    errors: int
    warnings: int


class DeviceScanResult(BaseModel):
    serial: str
    location: str
    # "ok" | "warning" | "critical" | "unreachable"
    status: str
    error_count: int
    warning_count: int
    model_name: str | None
    firmware: str | None
    last_event_date: str | None
    fuser_life_percent: float | None = None
    black_toner_percent: float | None = None
    roller_components: list[RollerComponent] = []
    active_alerts_count: int = 0
    active_alerts_max_severity: str | None = None  # "ERROR" | "WARNING" | "INFO"
    error_message: str | None = None
    top_errors: list[FleetTopError] = []
    timeline_data: list[FleetTimelinePoint] = []
