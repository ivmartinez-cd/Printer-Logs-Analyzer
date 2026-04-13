"""Configuration helpers loading environment variables safely."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

_logger = logging.getLogger(__name__)

# Cargar .env desde la raíz del repo (backend/ está dentro del repo)
_repo_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_repo_root / ".env")


class Settings(BaseModel):
    """Application-wide configuration loaded from the environment."""

    db_url: str = Field(..., alias="DB_URL")
    api_key: str = Field("dev", alias="API_KEY")
    anthropic_api_key: Optional[str] = Field(None, alias="ANTHROPIC_API_KEY")

    # EKM Insight / SDS portal integration (optional)
    insight_portal_url: Optional[str] = Field(None, alias="INSIGHT_PORTAL_URL")
    insight_api_key: Optional[str] = Field(None, alias="INSIGHT_API_KEY")
    insight_api_secret: Optional[str] = Field(None, alias="INSIGHT_API_SECRET")

    @classmethod
    def from_env(cls) -> "Settings":
        """Load configuration and raise informative errors when missing."""
        values = {field.alias: os.getenv(field.alias) for field in cls.model_fields.values()}
        try:
            instance = cls(**values)
        except ValidationError as exc:
            missing = ", ".join(sorted(err["loc"][0] for err in exc.errors()))
            raise RuntimeError(f"Missing or invalid environment variables: {missing}") from exc
        if instance.api_key == "dev" and os.getenv("ENV") == "production":
            _logger.warning(
                "⚠️ ADVERTENCIA: Usando API key por defecto 'dev' en producción"
            )
        return instance


def get_settings(cache: dict = {}) -> Settings:
    """Return cached settings to avoid re-parsing values in hot paths."""
    if "settings" not in cache:
        cache["settings"] = Settings.from_env()
    return cache["settings"]
