from fastapi import APIRouter, Depends, Request
from backend.interface.schemas.error_code import ErrorCodeUpsertRequest
from backend.interface.deps import get_error_code_repo
from backend.interface.auth import authenticate
from backend.interface.rate_limiter import limiter
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.content_fetcher import fetch_solution_content, validate_ssrf_url

router = APIRouter(prefix="/error-codes", tags=["Catalog"])

@router.post("/upsert", dependencies=[Depends(authenticate)])
@limiter.limit("30/minute")
async def upsert_error_code(
    request: Request, 
    body: ErrorCodeUpsertRequest,
    repo: ErrorCodeRepository = Depends(get_error_code_repo)
) -> dict:
    solution_content = None
    warning = None
    if body.solution_url and body.solution_url.strip():
        validate_ssrf_url(body.solution_url.strip())
        solution_content = await fetch_solution_content(body.solution_url.strip())
        if solution_content is None:
            warning = "No se pudo obtener el contenido de la página."

    ec = repo.upsert(
        code=body.code,
        severity=body.severity,
        description=body.description,
        solution_url=body.solution_url,
        solution_content=solution_content,
    )
    
    res = {
        "id": ec.id,
        "code": ec.code,
        "severity": ec.severity,
        "description": ec.description,
        "solution_url": ec.solution_url,
        "created_at": ec.created_at.isoformat(),
        "updated_at": ec.updated_at.isoformat(),
    }
    if warning:
        res["warning"] = warning
    return res
