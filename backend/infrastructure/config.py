"""Configuration helpers loading environment variables safely."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

# Cargar .env desde la raíz del repo (backend/ está dentro del repo)
_repo_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_repo_root / ".env")


class Settings(BaseModel):
    """Application-wide configuration loaded from the environment."""

    db_url: str = Field(..., alias="DB_URL")
    api_key: str = Field("dev", alias="API_KEY")
    recency_window: int = Field(3600, alias="RECENCY_WINDOW", ge=0)
    max_concurrent_analysis: int = Field(5, alias="MAX_CONCURRENT_ANALYSIS", ge=1)
    analysis_timeout: int = Field(30, alias="ANALYSIS_TIMEOUT", ge=1)

    @classmethod
    def from_env(cls) -> "Settings":
        """Load configuration and raise informative errors when missing."""
        values = {field.alias: os.getenv(field.alias) for field in cls.model_fields.values()}
        try:
            return cls(**values)
        except ValidationError as exc:
            missing = ", ".join(sorted(err["loc"][0] for err in exc.errors()))
            raise RuntimeError(f"Missing or invalid environment variables: {missing}") from exc


def get_settings(cache: dict = {}) -> Settings:
    """Return cached settings to avoid re-parsing values in hot paths."""
    if "settings" not in cache:
        cache["settings"] = Settings.from_env()
    return cache["settings"]
