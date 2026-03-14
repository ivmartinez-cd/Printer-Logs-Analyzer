"""In-memory catalog of error codes for enrichment. Replace with DB-backed implementation when needed."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List


@dataclass
class ErrorCode:
    """Single error code row from the catalog."""

    id: str
    code: str
    severity: str | None
    description: str | None
    solution_url: str | None
    created_at: datetime
    updated_at: datetime


class ErrorCodeRepository:
    """In-memory repository. Use DB-backed implementation for persistence."""

    def __init__(self) -> None:
        self._by_code: Dict[str, ErrorCode] = {}

    def get_by_codes(self, codes: List[str]) -> Dict[str, ErrorCode]:
        """Return a map code -> ErrorCode for all given codes that exist in the catalog."""
        return {c: self._by_code[c] for c in codes if c in self._by_code}

    def upsert(
        self,
        code: str,
        severity: str | None = None,
        description: str | None = None,
        solution_url: str | None = None,
    ) -> ErrorCode:
        """Insert or update an error code. Returns the saved row."""
        now = datetime.utcnow()
        if code in self._by_code:
            existing = self._by_code[code]
            ec = ErrorCode(
                id=existing.id,
                code=code,
                severity=severity if severity is not None else existing.severity,
                description=description if description is not None else existing.description,
                solution_url=solution_url if solution_url is not None else existing.solution_url,
                created_at=existing.created_at,
                updated_at=now,
            )
        else:
            ec = ErrorCode(
                id=f"ec-{code}",
                code=code,
                severity=severity,
                description=description,
                solution_url=solution_url,
                created_at=now,
                updated_at=now,
            )
        self._by_code[code] = ec
        return ec
