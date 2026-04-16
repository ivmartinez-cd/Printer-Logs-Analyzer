from __future__ import annotations
from typing import Optional
from pydantic import BaseModel

class ErrorCodeUpsertRequest(BaseModel):
    """Body for POST /error-codes/upsert."""
    code: str
    severity: Optional[str] = None
    description: Optional[str] = None
    solution_url: Optional[str] = None
