from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PrinterModelBase(BaseModel):
    model_name: str
    model_code: str
    family: Optional[str] = None
    ampv: Optional[int] = None
    engine_life_pages: Optional[int] = None
    notes: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "model_name": "HP LaserJet M406",
                    "model_code": "M406",
                    "family": "LaserJet",
                    "ampv": 5000,
                    "engine_life_pages": 150000,
                    "notes": "Office printer"
                }
            ]
        }
    }


class PrinterModelCreate(PrinterModelBase):
    pass


class PrinterModelResponse(PrinterModelBase):
    id: UUID
    has_cpmd: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "model_name": "HP LaserJet M406",
                    "model_code": "M406",
                    "family": "LaserJet",
                    "ampv": 5000,
                    "engine_life_pages": 150000,
                    "notes": "Office printer",
                    "has_cpmd": True,
                    "created_at": "2026-04-16T12:00:00Z",
                    "updated_at": "2026-04-16T12:00:00Z"
                }
            ]
        }
    }
