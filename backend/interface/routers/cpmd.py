"""Lightweight router for CPMD PDF lookup and upload."""

import json
import re
from pathlib import Path
from typing import Optional

from backend.interface.auth import authenticate
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

router = APIRouter(prefix="/cpmd", tags=["cpmd"], dependencies=[Depends(authenticate)])

_CPMD_DIR = Path(__file__).parent.parent.parent.parent / "data" / "cpmd"
_MANIFEST_PATH = _CPMD_DIR / "manifest.json"
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


def _save_manifest(mappings: list) -> None:
    global _manifest_cache
    _CPMD_DIR.mkdir(parents=True, exist_ok=True)
    with open(_MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump({"mappings": mappings}, f, ensure_ascii=False, indent=2)
    _manifest_cache = mappings


def _sanitize_filename(name: str) -> str:
    stem = Path(name).stem
    clean = re.sub(r"[^\w\-.]", "_", stem)
    return f"{clean}.pdf"


@router.get("/pdf-url")
def get_cpmd_pdf_url(model_family: str):
    """Return the static PDF URL for a model family, or 404."""
    query = model_family.upper()
    for entry in _load_manifest():
        if any(kw.upper() in query for kw in entry["keywords"]):
            return {"url": f"/static/cpmd/{entry['pdf']}", "label": entry["label"]}
    raise HTTPException(status_code=404, detail="No CPMD manual found for this model family")


@router.post("/upload")
async def upload_cpmd_pdf(
    file: UploadFile = File(...),
    keywords: str = Form(...),
    label: str = Form(...),
):
    """Upload a CPMD PDF and register it in the manifest."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    safe_name = _sanitize_filename(file.filename)
    _CPMD_DIR.mkdir(parents=True, exist_ok=True)
    dest = _CPMD_DIR / safe_name
    content = await file.read()
    dest.write_bytes(content)

    kw_list = [k.strip() for k in keywords.split(",") if k.strip()]
    if not kw_list:
        raise HTTPException(status_code=400, detail="At least one keyword is required")

    mappings = _load_manifest().copy()
    mappings.append({"keywords": kw_list, "pdf": safe_name, "label": label.strip()})
    _save_manifest(mappings)

    return {"url": f"/static/cpmd/{safe_name}", "label": label.strip()}
