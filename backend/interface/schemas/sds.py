from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ExtractSdsLogsRequest(BaseModel):
    """Body for POST /sds/extract-logs."""

    serial: str
    days: int = 30

    model_config = {"json_schema_extra": {"examples": [{"serial": "CND1234567", "days": 15}]}}


class ResolveDeviceResponse(BaseModel):
    """Response of GET /sds/resolve-device."""

    serial: str
    device_id: str
    model_name_sds: str
    firmware: Optional[str] = None
    suggested_model_id: Optional[UUID] = None
    suggested_model_name: Optional[str] = None


class RemoteEwsResponse(BaseModel):
    """Response of GET /sds/devices/{serial}/remote-ews."""

    serial: str
    device_id: str
    ews_url: str


class RefreshHpCacheResponse(BaseModel):
    """Response of POST /sds/devices/{serial}/refresh-cache."""

    serial: str
    device_id: str
    status: str = "requested"
    message: str
    # Pre-refresh "sent" timestamps of the cache operations, so the client can
    # poll /hp-operations and detect when a newer run completes.
    baseline: List[Dict[str, str]] = Field(default_factory=list)


class HpOperation(BaseModel):
    """One row of the device's HP Smart operations table."""

    operation: str
    sent: Optional[str] = None
    sent_by: Optional[str] = None
    last_known_state: Optional[str] = None
    last_state_updated: Optional[str] = None
    last_state_requested: Optional[str] = None


class HpOperationsResponse(BaseModel):
    """Response of GET /sds/devices/{serial}/hp-operations."""

    serial: str
    device_id: str
    operations: List[HpOperation] = Field(default_factory=list)


class ExtractSdsLogsResponse(BaseModel):
    """Full response for SDS extraction including model info."""

    serial: str
    device_id: str
    model_name_sds: str
    firmware: Optional[str] = None
    suggested_model_id: Optional[UUID] = None
    logs_text: str
    event_count: int
    realtime_consumables: List[Dict[str, Any]] = Field(default_factory=list)
