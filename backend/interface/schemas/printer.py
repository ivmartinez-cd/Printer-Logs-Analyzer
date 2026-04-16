from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class PrinterModelBase(BaseModel):
    model_name: str
    model_code: str
    family: Optional[str] = None
    ampv: Optional[int] = None
    engine_life_pages: Optional[int] = None
    notes: Optional[str] = None

class PrinterModelCreate(PrinterModelBase):
    pass

class PrinterModelResponse(PrinterModelBase):
    id: UUID
    has_cpmd: bool = False
    created_at: datetime
    updated_at: datetime
