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
