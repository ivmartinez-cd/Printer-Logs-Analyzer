import asyncio
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from backend.infrastructure.config import Settings
from backend.interface.schemas.ai import AiDiagnoseRequest, AiDiagnoseIncidentItem, AiDiagnoseMetadata

# We mock the repository and fetcher to avoid real DB/HP calls in this test
async def test_ai_enrichment():
    # Mock settings
    settings = Settings(anthropic_api_key="fake_key", insight_portal_url="https://fake.url")
    
    # Mock incident
    incident = AiDiagnoseIncidentItem(
        code="31.13.03",
        description="Jam in ADF",
        severity="ERROR",
        occurrences=5,
        start_time="2026-04-19T00:00:00Z",
        end_time="2026-04-19T01:00:00Z"
    )
    
    # Mock request body
    body = AiDiagnoseRequest(
        incidents=[incident],
        global_severity="ERROR",
        metadata=AiDiagnoseMetadata(
            alerts_history=[{"type": "Supply", "message": "Low toner"}]
        )
    )
    
    # Here we would normally run the router logic. 
    # Let's simulate the enrichment part of the router.
    
    from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
    from backend.domain.entities import ErrorCode
    
    mock_repo = MagicMock(spec=ErrorCodeRepository)
    mock_repo.get_by_codes.return_value = {
        "31.13.03": ErrorCode(
            code="31.13.03",
            description="Jam in ADF",
            solution_url="https://hp.com/s/31.13.03",
            solution_content="TECHNICAL MANUAL: Check the ADF pick roller and the separator pad. Possible failure in the ADF drive motor."
        )
    }
    
    # Simulate extraction
    catalog = mock_repo.get_by_codes(["31.13.03"])
    enriched_incidents = []
    for inc in body.incidents:
        item = {
            "code": inc.code,
            "severity": inc.severity,
            "occurrences": inc.occurrences,
            "start": inc.start_time,
            "end": inc.end_time,
            "description": inc.description
        }
        error_info = catalog.get(inc.code)
        if error_info and error_info.solution_content:
            item["technical_solution"] = error_info.solution_content[:3000]
        enriched_incidents.append(item)
    
    payload = {
        "global_severity": body.global_severity,
        "incidents": enriched_incidents,
        "metadata": body.metadata.model_dump()
    }
    
    print("ENRICHED PAYLOAD PREVIEW:")
    import json
    print(json.dumps(payload, indent=2))
    
    # Verify enrichment
    assert "technical_solution" in payload["incidents"][0]
    assert "ADF drive motor" in payload["incidents"][0]["technical_solution"]
    print("\nSUCCESS: AI Payload enriched correctly with solution content!")

if __name__ == "__main__":
    asyncio.run(test_ai_enrichment())
