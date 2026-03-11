"""Strict validation for rule configuration documents."""

from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field, ValidationError


class GlobalRuleModel(BaseModel):
    """Strongly typed definition for a single rule."""

    code: str
    classification: str
    description: str
    resolution: str
    recency_window: int = Field(ge=1)
    X: int = Field(ge=1, description="Minimum occurrences threshold")
    Y: int = Field(ge=1, description="Window minutes threshold")
    counter_max_jump: int = Field(ge=1)
    severity_weight: int = Field(ge=1)
    enabled: bool
    tags: List[str]


class ConfigDocument(BaseModel):
    """Full configuration document schema."""

    metadata: Dict[str, Any]
    defaults: Dict[str, Any]
    models: Dict[str, Any]
    global_rules: List[GlobalRuleModel]


class JsonConfigValidator:
    """Centralized validator so all entry points share the same schema."""

    def validate(self, payload: Dict[str, Any]) -> ConfigDocument:
        """Validate incoming JSON and raise descriptive errors."""
        try:
            return ConfigDocument.model_validate(payload)
        except ValidationError as exc:
            raise ValueError(f"Invalid configuration payload: {exc}") from exc
