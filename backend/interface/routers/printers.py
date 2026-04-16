import asyncio
import logging
from typing import Any, Dict, List
from uuid import UUID

import psycopg2.errors
from backend.application.services.cpmd_ingest import ingest_cpmd
from backend.application.services.pdf_extraction_service import extract_model_from_pdf
from backend.infrastructure.config import Settings
from backend.infrastructure.repositories.error_solution_repository import ErrorSolutionRepository
from backend.infrastructure.repositories.printer_model_repository import PrinterModelRepository
from backend.interface.auth import authenticate
from backend.interface.deps import get_error_solution_repo, get_printer_model_repo, get_settings
from backend.interface.rate_limiter import limiter
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

router = APIRouter(tags=["Printers & CPMD"])
_logger = logging.getLogger(__name__)

_PDF_MAX_BYTES = 10 * 1024 * 1024
_CPMD_MAX_BYTES = 20 * 1024 * 1024


@router.get(
    "/printer-models",
    response_model=List[Dict[str, Any]],
    dependencies=[Depends(authenticate)],
    summary="List all printer models in the catalog",
    response_description="A list of models with metadata and CPMD availability.",
)
def list_printer_models(
    repo: PrinterModelRepository = Depends(get_printer_model_repo),
    error_solution_repo: ErrorSolutionRepository = Depends(get_error_solution_repo),
) -> list:
    models = repo.list_models()
    try:
        model_ids_with_cpmd = error_solution_repo.get_model_ids_with_solutions()
    except Exception:
        model_ids_with_cpmd = set()
    return [
        {
            "id": str(m.id),
            "model_name": m.model_name,
            "model_code": m.model_code,
            "family": m.family,
            "has_cpmd": str(m.id) in model_ids_with_cpmd,
            "created_at": m.created_at.isoformat(),
            "updated_at": m.updated_at.isoformat(),
        }
        for m in models
    ]


@router.get(
    "/models/{model_id}/error-solutions/{code}",
    dependencies=[Depends(authenticate)],
    summary="Get a specific error solution for a model",
    response_description="Detailed solution including technician steps and FRUs.",
)
def get_error_solution(
    model_id: str,
    code: str,
    repo: PrinterModelRepository = Depends(get_printer_model_repo),
    error_solution_repo: ErrorSolutionRepository = Depends(get_error_solution_repo),
) -> dict:
    uid = UUID(model_id)
    model = repo.get_by_id(uid)
    if not model:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")

    solution = error_solution_repo.get_by_model_and_code(uid, code)
    if not solution:
        raise HTTPException(status_code=404, detail="Solución no encontrada")

    return {
        "id": solution.id,
        "model_id": str(solution.model_id),
        "code": solution.code,
        "title": solution.title,
        "cause": solution.cause,
        "technician_steps": solution.technician_steps,
        "frus": [
            {"part_number": f.part_number, "description": f.description} for f in solution.frus
        ],
        "source_audience": solution.source_audience,
        "source_page": solution.source_page,
        "cpmd_hash": solution.cpmd_hash,
    }


@router.post(
    "/printer-models/upload-pdf",
    dependencies=[Depends(authenticate)],
    summary="Upload a printer model PDF to extract product data",
    response_description="Stats about created models and consumables.",
)
@limiter.limit("10/minute")
async def upload_printer_model_pdf(
    request: Request,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    repo: PrinterModelRepository = Depends(get_printer_model_repo),
) -> dict:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > _PDF_MAX_BYTES:
        raise HTTPException(status_code=400, detail="El PDF supera el límite de 10 MB")

    api_key = settings.anthropic_api_key
    if not api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada.")

    extracted = await extract_model_from_pdf(pdf_bytes, api_key)
    created, skipped = [], []
    total_consumables = 0

    for model_dict in extracted.get("models", []):
        model_code = model_dict.get("model_code", "")
        consumables = model_dict.pop("consumables", []) or []
        try:
            repo.create_with_consumables(model_dict, consumables)
            created.append(model_code)
            total_consumables += len(consumables)
        except psycopg2.errors.UniqueViolation:
            skipped.append(model_code)

    return {"created": created, "skipped": skipped, "total_consumables": total_consumables}


@router.post(
    "/models/{model_id}/cpmd",
    dependencies=[Depends(authenticate)],
    summary="Ingest a CPMD (Service Manual) PDF for a model",
    response_description="A report of extracted error solutions from the manual.",
)
async def ingest_cpmd_endpoint(
    model_id: str,
    request: Request,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    repo: PrinterModelRepository = Depends(get_printer_model_repo),
    error_solution_repo: ErrorSolutionRepository = Depends(get_error_solution_repo),
) -> dict:
    uid = UUID(model_id)
    if not repo.get_by_id(uid):
        raise HTTPException(status_code=404, detail="Modelo no encontrado")

    if file is None:
        raise HTTPException(status_code=400, detail="Se requiere un archivo PDF")
    content_type = file.content_type or ""
    filename = file.filename or ""
    if content_type != "application/pdf" and not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")

    api_key = settings.anthropic_api_key
    if not api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > _CPMD_MAX_BYTES:
        raise HTTPException(status_code=413, detail="El PDF supera el límite de 20 MB")

    report = await asyncio.to_thread(
        ingest_cpmd,
        [uid],
        pdf_bytes,
        api_key,
        error_solution_repo,
    )

    return {
        "model_id": str(report.model_id),
        "cpmd_hash": report.cpmd_hash,
        "total_blocks": report.total_blocks,
        "extracted": report.extracted,
        "regex_ok": report.regex_ok,
        "llm_ok": report.llm_ok,
        "failed": report.failed,
        "skipped": report.skipped,
        "reason": report.reason,
    }
