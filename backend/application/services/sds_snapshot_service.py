"""Automated SDS log snapshot capture service.

Runs twice a day (see scheduler.py) to refresh the HP SDS cache for every
device tracked in saved_analyses, extract current event logs, parse them, and
persist a new dated snapshot.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from backend.application.parsers.log_parser import LogParser
from backend.application.services.analysis_service import AnalysisService
from backend.application.services.insight_service import get_device_info
from backend.application.services.sds_web_service import (
    SDSWebSession,
    extract_help_urls,
    get_session,
    html_to_tsv,
)
from backend.infrastructure.config import get_settings
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.repositories.saved_analysis_repository import SavedAnalysisRepository
from backend.infrastructure.repositories.telemetry_repository import (
    TelemetryEvent,
    TelemetryRepository,
)
from backend.interface.utils import (
    enrich_events_with_catalog,
    extract_serial_number,
    incident_to_summary,
    normalize_log_text,
)

_logger = logging.getLogger(__name__)


class SdsSnapshotService:
    """Captures automated SDS snapshots for all tracked devices."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def capture_all_devices(self, refresh_cache: bool = True) -> None:
        """Entry point for the scheduler; iterates all unique serials and captures."""
        if not (self.settings.sds_web_username and self.settings.sds_web_password):
            _logger.warning("SDS credentials not configured — skipping automated snapshot capture")
            return

        repo = SavedAnalysisRepository()
        serials = list({
            extract_serial_number(s.equipment_identifier)
            for s in repo.list()
            if s.equipment_identifier and extract_serial_number(s.equipment_identifier)
        })

        if not serials:
            _logger.info("No tracked devices in saved_analyses — skipping snapshot capture")
            return

        _logger.info("Automated SDS snapshot capture starting for %d device(s)", len(serials))

        sds = get_session(self.settings)
        parser = LogParser()
        analysis_service = AnalysisService()
        error_repo = ErrorCodeRepository()
        telemetry_repo = TelemetryRepository()

        for serial in serials:
            try:
                self._capture_device(
                    serial, sds, parser, analysis_service, error_repo, repo, telemetry_repo,
                    refresh_cache=refresh_cache,
                )
            except Exception as exc:
                _logger.error("Snapshot capture failed for %s: %s", serial, exc)

        _logger.info("Automated SDS snapshot capture finished")

    def _capture_device(
        self,
        serial: str,
        sds: SDSWebSession,
        parser: LogParser,
        analysis_service: AnalysisService,
        error_repo: ErrorCodeRepository,
        repo: SavedAnalysisRepository,
        telemetry_repo: TelemetryRepository,
        refresh_cache: bool,
    ) -> None:
        try:
            info = get_device_info(
                self.settings.insight_portal_url,
                self.settings.insight_api_key,
                self.settings.insight_api_secret,
                serial,
            )
            device_id = str(info["device_id"])
        except Exception as exc:
            _logger.warning("Insight API failed for %s: %s — using hash fallback", serial, exc)
            device_id = str(sum(ord(c) for c in serial))

        if refresh_cache:
            try:
                sds.refresh_hp_data_cache(device_id)
                _logger.info("HP cache refreshed for %s", serial)
            except Exception as exc:
                _logger.warning("Cache refresh failed for %s: %s — proceeding with extraction", serial, exc)

        raw_html = sds.fetch_event_logs_html(device_id, days=30)
        tsv_text = html_to_tsv(raw_html)

        try:
            for code, data in extract_help_urls(raw_html).items():
                try:
                    error_repo.upsert(code=code, solution_url=data["url"], description=data.get("description"))
                except Exception:
                    pass
        except Exception:
            pass

        report = parser.parse_text(normalize_log_text(tsv_text))
        unique_codes = list(dict.fromkeys(e.code for e in report.events))
        catalog_map = error_repo.get_by_codes(unique_codes)
        events = enrich_events_with_catalog(report.events, catalog_map)
        analysis = analysis_service.analyze(events)

        if not analysis.incidents:
            _logger.info("No incidents parsed for %s — skipping snapshot", serial)
            return

        now = datetime.now(timezone.utc)
        hour_label = "mañana" if now.hour < 14 else "tarde"
        name = f"Auto - {serial} - {now.strftime('%d %b %Y')} ({hour_label})"
        incidents_payload = [incident_to_summary(i) for i in analysis.incidents]

        snap = repo.create(
            name=name,
            equipment_identifier=serial,
            incidents=incidents_payload,
            global_severity=analysis.global_severity,
        )

        telemetry_repo.add_events([
            TelemetryEvent(
                device_serial=serial,
                saved_analysis_id=snap.id,
                code=inc.code,
                classification=inc.classification,
                severity=inc.severity,
                occurrences=inc.occurrences,
                counter=inc.counter_range[-1] if inc.counter_range else 0,
                event_time=inc.last_event_time or inc.end_time,
            )
            for inc in analysis.incidents
        ])
        _logger.info("Snapshot '%s' created for device %s", name, serial)
