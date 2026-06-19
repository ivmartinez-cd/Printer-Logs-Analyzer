"""Lightweight router for CPMD PDF lookup by model family."""

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from backend.interface.auth import authenticate

router = APIRouter(prefix="/cpmd", tags=["cpmd"], dependencies=[Depends(authenticate)])

_MANIFEST_PATH = Path(__file__).parent.parent.parent.parent / "data" / "cpmd" / "manifest.json"
_manifest_cache: Optional[list] = None


def _load_manifest() -> list:
    global _manifest_cache
    if _manifest_cache is not None:
        return _manifest_cache
    if not _MANIFEST_PATH.exists():
        return []
    with open(_MANIFEST_PATH, encoding="utf-8") as f:
        data = json.load(f)
    _manifest_cache = data.get("mappings", [])
    return _manifest_cache


@router.get("/pdf-url")
def get_cpmd_pdf_url(model_family: str):
    """Return the static PDF URL for a model family, or 404."""
    query = model_family.upper()
    for entry in _load_manifest():
        if any(kw.upper() in query for kw in entry["keywords"]):
            return {"url": f"/static/cpmd/{entry['pdf']}", "label": entry["label"]}
    raise HTTPException(status_code=404, detail="No CPMD manual found for this model family")
