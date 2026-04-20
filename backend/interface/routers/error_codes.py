from backend.application.services.sds_web_service import get_session as get_sds_session
from backend.infrastructure.config import get_settings
from backend.infrastructure.content_fetcher import fetch_solution_content, validate_ssrf_url
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.interface.auth import authenticate
from backend.interface.deps import get_error_code_repo
from backend.interface.rate_limiter import limiter
from backend.interface.schemas.error_code import ErrorCodeUpsertRequest
from fastapi import APIRouter, Depends, HTTPException, Request

router = APIRouter(prefix="/error-codes", tags=["Catalog"])


@router.post(
    "/upsert",
    dependencies=[Depends(authenticate)],
    summary="Add or update an error code in the manual catalog",
    response_description="The upserted error code metadata including optional warning.",
)
@limiter.limit("30/minute")
async def upsert_error_code(
    request: Request,
    body: ErrorCodeUpsertRequest,
    repo: ErrorCodeRepository = Depends(get_error_code_repo),
) -> dict:
    solution_content = None
    warning = None
    if body.solution_url and body.solution_url.strip():
        url = body.solution_url.strip()
        validate_ssrf_url(url)

        # For KaaS URLs use the full SDS session (handles token refresh automatically)
        session = None
        sds_session = None
        if "kaas.hpcloud.hp.com" in url:
            try:
                settings = get_settings()
                if settings.sds_web_username and settings.sds_web_password:
                    sds_session = get_sds_session(settings)
            except Exception as e:
                warning = f"Error al preparar sesión SDS: {e}"

        solution_content = await fetch_solution_content(
            url, session=session, sds_session=sds_session
        )
        if solution_content is None and not warning:
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


@router.get(
    "/{code}/solution-proxy",
    dependencies=[Depends(authenticate)],
    summary="Fetch the live solution content using SDS credentials",
)
async def get_solution_proxy(
    code: str,
    repo: ErrorCodeRepository = Depends(get_error_code_repo),
) -> dict:
    results = repo.get_by_codes([code])
    ec = results.get(code)
    if not ec or not ec.solution_url:
        raise HTTPException(status_code=404, detail="Código o URL de solución no encontrados.")

    url = ec.solution_url.strip()
    validate_ssrf_url(url)

    sds_session = None
    if "kaas.hpcloud.hp.com" in url:
        settings = get_settings()
        if settings.sds_web_username and settings.sds_web_password:
            sds_session = get_sds_session(settings)

    content = await fetch_solution_content(url, sds_session=sds_session)
    if not content:
        # Fallback to stored content if fetch fails
        return {"content": ec.solution_content, "source": "cache", "url": url}

    return {"content": content, "source": "live", "url": url}
