import re
from typing import Dict, List

from backend.domain.entities import EnrichedEvent, Event, Incident
from backend.infrastructure.repositories.error_code_repository import ErrorCode


def normalize_log_text(text: str) -> str:
    """Replace runs of 2+ spaces with a single tab (HP portal copies tabs as spaces)."""
    lines = text.splitlines()
    normalized = [re.sub(r" {2,}", "\t", line) for line in lines]
    return "\n".join(normalized)


def enrich_events_with_catalog(
    events: List[Event], catalog_map: Dict[str, ErrorCode]
) -> List[EnrichedEvent]:
    enriched: List[EnrichedEvent] = []
    for evt in events:
        row = catalog_map.get(evt.code)
        data = evt.model_dump()
        if row:
            data["code_severity"] = row.severity
            data["code_description"] = row.description
            data["code_solution_url"] = row.solution_url
            data["code_solution_content"] = row.solution_content
        enriched.append(EnrichedEvent(**data))
    return enriched


def incident_to_summary(inc: Incident) -> dict:
    """Build summary dict for JSONB."""
    end_iso = inc.end_time.isoformat() if inc.end_time else None
    start_iso = inc.start_time.isoformat() if inc.start_time else None
    return {
        "code": inc.code,
        "classification": inc.classification,
        "severity": inc.severity,
        "occurrences": inc.occurrences,
        "start_time": start_iso,
        "end_time": end_iso,
        "counter_range": list(inc.counter_range),
        "sds_link": inc.sds_link,
        "last_event_time": end_iso,
    }
