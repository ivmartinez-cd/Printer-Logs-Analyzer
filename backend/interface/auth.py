"""API key authentication dependency."""

from __future__ import annotations

from backend.infrastructure.config import Settings, get_settings
from fastapi import Depends, Header, HTTPException


def authenticate(x_api_key: str = Header(...), settings: Settings = Depends(get_settings)) -> None:
    """Validate the x-api-key header. Raises 401 if missing or incorrect."""
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
