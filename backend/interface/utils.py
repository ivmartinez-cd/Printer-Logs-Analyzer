import re
from typing import Dict, List

from backend.domain.entities import EnrichedEvent, Event, Incident, ErrorSolution
from backend.infrastructure.repositories.error_code_repository import ErrorCode


def normalize_log_text(text: str) -> str:
    """Replace runs of 2+ spaces with a single tab (HP portal copies tabs as spaces)."""
    lines = text.splitlines()
    normalized = [re.sub(r" {2,}", "\t", line) for line in lines]
    return "\n".join(normalized)


def extract_serial_number(value: str | None) -> str | None:
    """Extract serial number from value, resolving formats like 'Model Name (SERIAL)'."""
    if not value:
        return None
    val = value.strip()
    match = re.search(r"\(([^)]+)\)", val)
    if match:
        return match.group(1).strip().upper()
    return val.upper()



def enrich_events_with_catalog(
    events: List[Event],
    catalog_map: Dict[str, ErrorCode],
    cpmd_map: Dict[str, ErrorSolution] = None,
) -> List[EnrichedEvent]:
    enriched: List[EnrichedEvent] = []
    cpmd_map = cpmd_map or {}
    for evt in events:
        row = catalog_map.get(evt.code)
        cpmd_sol = cpmd_map.get(evt.code)
        data = evt.model_dump()
        if row:
            data["code_severity"] = row.severity
            data["code_description"] = row.description
            data["code_solution_url"] = row.solution_url
            data["code_solution_content"] = row.solution_content
        
        if cpmd_sol:
            cpmd_text = f"--- HP CPMD SERVICE MANUAL SOLUTION ---\n"
            if cpmd_sol.title:
                cpmd_text += f"[Title]: {cpmd_sol.title}\n"
            if cpmd_sol.cause:
                cpmd_text += f"[Cause]:\n{cpmd_sol.cause}\n\n"
            if cpmd_sol.technician_steps:
                cpmd_text += "[Technician Steps]:\n"
                for idx, step in enumerate(cpmd_sol.technician_steps, 1):
                    cpmd_text += f"{idx}. {step}\n"
                cpmd_text += "\n"
            if cpmd_sol.frus:
                cpmd_text += "[Replacement Parts (FRUs)]:\n"
                for fru in cpmd_sol.frus:
                    cpmd_text += f"- {fru.part_number}: {fru.description}\n"
                cpmd_text += "\n"
            
            data["cpmd_solution_content"] = cpmd_text
            
            if not data.get("code_solution_url"):
                data["code_solution_url"] = f"cpmd://{cpmd_sol.model_family}/{cpmd_sol.code}"

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
