"""API key authentication dependency."""

from __future__ import annotations

from fastapi import Header, HTTPException

from backend.infrastructure.config import get_settings


def authenticate(x_api_key: str = Header(...)) -> None:
    """Validate the x-api-key header. Raises 401 if missing or incorrect."""
    settings = get_settings()
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
