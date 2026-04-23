import logging
import threading
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from backend.application.services.email_service import EmailService
from backend.application.services.insight_service import (
    get_device_info,
    get_device_meters,
    search_devices_by_model,
)
from backend.domain.entities import (
    MaintenanceAlert,
    MaintenanceDevice,
    MaintenanceDeviceState,
    MaintenanceHistory,
    MaintenanceIncident,
    MaintenanceModelRule,
)
from backend.infrastructure.config import get_settings
from backend.infrastructure.repositories.maintenance_repository import MaintenanceRepository

_logger = logging.getLogger(__name__)

from backend.application.services.job_tracker import (
    create_job as create_sync_job,
)
from backend.application.services.job_tracker import (
    get_job as get_sync_job,
)
from backend.application.services.job_tracker import (
    update_job as _update_sync_job,
)


class MaintenanceService:
    def __init__(
        self,
        repository: Optional[MaintenanceRepository] = None,
        email_service: Optional[EmailService] = None,
    ):
        self.repo = repository or MaintenanceRepository()
        self.email = email_service or EmailService()
        self.settings = get_settings()

    def sync_and_check_all(
        self,
        discover: bool = False,
        model_family: Optional[str] = None,
        send_emails: bool = True,
        job_id: Optional[str] = None,
    ):
        """Main entry point for the scheduler and manual sync."""
        _logger.info(
            "Starting maintenance sync and check process (discover=%s, family=%s, send_emails=%s)...",
            discover,
            model_family,
            send_emails,
        )

        if discover:
            self.discover_new_devices()

        devices = self.repo.get_all_devices()
        active_devices = [d for d in devices if d.is_active]
        if model_family:
            active_devices = [d for d in active_devices if d.model_family == model_family]

        from concurrent.futures import ThreadPoolExecutor

        processed = [0]
        errors_count = [0]
        counter_lock = threading.Lock()

        def _safe_process(device):
            try:
                self.process_device(device, send_emails=send_emails)
            except Exception as e:
                _logger.error("Error processing maintenance for device %s: %s", device.serial, e)
                with counter_lock:
                    errors_count[0] += 1
            finally:
                with counter_lock:
                    processed[0] += 1
                if job_id:
                    _update_sync_job(job_id, processed[0], errors_count[0])

        with ThreadPoolExecutor(max_workers=5) as executor:
            executor.map(_safe_process, active_devices)

        if job_id:
            _update_sync_job(job_id, processed[0], errors_count[0], status="completed")
        _logger.info("Maintenance sync and check completed.")

    def process_device(self, device: MaintenanceDevice, send_emails: bool = True):
        device_id = self._resolve_device_id(device.serial)
        device_info = get_device_info(
            self.settings.insight_portal_url,
            self.settings.insight_api_key,
            self.settings.insight_api_secret,
            device.serial,
        )
        meters = get_device_meters(
            self.settings.insight_portal_url,
            self.settings.insight_api_key,
            self.settings.insight_api_secret,
            device_id,
        )

        current_counter = 0
        if meters:
            # Sort meters by date descending to get the most recent reading first
            sorted_meters = sorted(
                meters,
                key=lambda x: (
                    x.get("readingDateTime") or x.get("readingDate") or x.get("date") or ""
                ),
                reverse=True,
            )

            for m in sorted_meters:
                # 1. Check for nested structure: {"date": "...", "meters": [{"name": "...", "value": ...}]}
                nested_meters = m.get("meters", [])
                if nested_meters:
                    # Look for specific names
                    names_to_find = [
                        "Ciclos de trabajo",
                        "Engine Cycles",
                        "Total Impressions",
                        "Total Value",
                        "Páginas monocromáticas",
                    ]
                    found_value = None
                    for name in names_to_find:
                        for nm in nested_meters:
                            if nm.get("name") == name:
                                found_value = int(nm.get("value") or 0)
                                break
                        if found_value:
                            break

                    if found_value:
                        current_counter = found_value
                        break

                # 2. Check for flat structure
                if m.get("engineCycles"):
                    current_counter = int(m["engineCycles"])
                    break
                if m.get("totalValue"):
                    current_counter = int(m["totalValue"])
                    break

        # Fallback: check device_info metadata if meters are empty or didn't yield a value
        if current_counter == 0:
            metadata = device_info.get("extendedFields", {})
            # Common fields for total counters in Insight
            current_counter = int(
                metadata.get("engineCycles")
                or metadata.get("workCycles")
                or metadata.get("ciclos_motor")
                or metadata.get("totalCounter")
                or metadata.get("total_counter")
                or metadata.get("total_value")
                or 0
            )

        if current_counter == 0:
            _logger.warning("No meters found for device %s", device.serial)
            return

        device_update = MaintenanceDevice(
            serial=device.serial,
            model_family=device.model_family,
            last_sync_counter=current_counter,
            last_sync_at=datetime.utcnow(),
            is_active=device.is_active,
        )
        self.repo.upsert_device(device_update)

        # Combine model rules with device states
        model_rules = self.repo.get_model_rules(device.model_family)
        device_states = self.repo.get_device_state(device.serial)
        state_map = {s.component_type: s for s in device_states}

        for rule in model_rules:
            state = state_map.get(rule.component_type)
            if not state:
                # FIRST TIME we see this component: initialize baseline to current counter
                # This prevents old devices from triggering alerts on their first sync
                _logger.info(
                    "Initializing baseline for %s - %s at %s pages",
                    device.serial,
                    rule.component_type,
                    current_counter,
                )
                state = MaintenanceDeviceState(
                    device_serial=device.serial,
                    component_type=rule.component_type,
                    last_change_counter=current_counter,
                )
                self.repo.upsert_device_state(state)

            last_change = state.last_change_counter
            self._evaluate_rule(device, rule, last_change, current_counter, send_emails=send_emails)

    def _evaluate_rule(
        self,
        device: MaintenanceDevice,
        rule: MaintenanceModelRule,
        last_change_counter: int,
        current_counter: int,
        send_emails: bool = True,
    ):
        next_change = last_change_counter + rule.expected_life
        remaining = next_change - current_counter

        if remaining <= rule.alert_margin:
            # Open incident suppresses all further alerts
            open_incident = self.repo.get_open_incident(device.serial, rule.component_type)
            if open_incident:
                _logger.info(
                    "Alert suppressed for %s - %s: open incident %s",
                    device.serial,
                    rule.component_type,
                    open_incident.incident_number,
                )
                return

            last_alert = self.repo.get_last_alert(device.serial, rule.component_type)
            COOLDOWN_PAGES = 500
            if not last_alert or (current_counter - last_alert.counter_at_alert >= COOLDOWN_PAGES):
                _logger.info(
                    "ALERT TRIGGERED for %s - %s (Remaining: %s)",
                    device.serial,
                    rule.component_type,
                    remaining,
                )

                recipients = [
                    r.strip() for r in (rule.email_recipients or "").split(",") if r.strip()
                ]
                email_sent = False

                if recipients and self.settings.maintenance_emails_enabled and send_emails:
                    self.email.send_maintenance_alert(
                        serial=device.serial,
                        component=rule.component_type,
                        current_counter=current_counter,
                        next_change=next_change,
                        remaining=remaining,
                        recipients=recipients,
                    )
                    email_sent = True
                elif recipients:
                    _logger.info(
                        "Emails are globally disabled. Skipping email for %s", device.serial
                    )

                self.repo.create_alert(
                    MaintenanceAlert(
                        device_serial=device.serial,
                        component_type=rule.component_type,
                        counter_at_alert=current_counter,
                        status="SENT" if email_sent else "SKIPPED",
                    )
                )

    def sync_single_device(self, serial: str, send_emails: bool = True) -> MaintenanceDevice:
        """Syncs a single device and returns the updated MaintenanceDevice."""
        devices = self.repo.get_all_devices()
        device = next((d for d in devices if d.serial == serial), None)
        if not device:
            raise ValueError(f"Device {serial} not found")
        self.process_device(device, send_emails=send_emails)
        updated_devices = self.repo.get_all_devices()
        return next((d for d in updated_devices if d.serial == serial), device)

    def record_change(
        self,
        serial: str,
        component_type: str,
        incident_number: Optional[str] = None,
        notes: Optional[str] = None,
    ):
        """Records a component change, resets the rule counter and clears alerts."""
        _logger.info("Recording maintenance change for %s - %s", serial, component_type)

        devices = self.repo.get_all_devices()
        device = next((d for d in devices if d.serial == serial), None)
        if not device:
            raise ValueError(f"Device {serial} not found")

        current_counter = device.last_sync_counter

        model_rules = self.repo.get_model_rules(device.model_family)
        rule = next((r for r in model_rules if r.component_type == component_type), None)
        if not rule:
            raise ValueError(f"Rule for {component_type} not found on model {device.model_family}")

        new_state = MaintenanceDeviceState(
            device_serial=serial, component_type=component_type, last_change_counter=current_counter
        )
        self.repo.upsert_device_state(new_state)

        history = MaintenanceHistory(
            device_serial=serial,
            component_type=component_type,
            change_counter=current_counter,
            incident_number=incident_number,
            technician_notes=notes,
        )
        self.repo.create_history_record(history)
        self.repo.delete_alerts_for_component(serial, component_type)

        return history

    def get_history(self, serial: str) -> List[MaintenanceHistory]:
        return self.repo.get_history(serial)

    def open_incident(
        self, serial: str, component_type: str, incident_number: str, notes: Optional[str] = None
    ) -> MaintenanceIncident:
        incident = MaintenanceIncident(
            device_serial=serial,
            component_type=component_type,
            incident_number=incident_number,
            notes=notes,
        )
        return self.repo.create_incident(incident)

    def close_incident(self, incident_id: str, notes: Optional[str] = None) -> MaintenanceHistory:
        incident = self.repo.get_incident_by_id(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        if incident.status != "open":
            raise ValueError(f"Incident {incident_id} is already closed")
        history = self.record_change(
            incident.device_serial, incident.component_type, incident.incident_number, notes
        )
        self.repo.close_incident(incident_id)
        return history

    def get_incidents(self, serial: str) -> List[MaintenanceIncident]:
        return self.repo.get_incidents(serial)

    def _resolve_device_id(self, serial: str) -> int:
        info = get_device_info(
            self.settings.insight_portal_url,
            self.settings.insight_api_key,
            self.settings.insight_api_secret,
            serial,
        )
        return info.get("device_id")

    def discover_new_devices(self):
        """
        Queries the Insight API for all devices belonging to the families
        we have rules for, and adds them to our monitoring list.
        """
        families = self.repo.get_all_model_families()
        _logger.info("Discovering devices for families: %s", families)
        for family in families:
            self.discover_family(family)

    def discover_family(self, family: str):
        """Discovers devices for a specific model family."""
        try:
            found_devices = search_devices_by_model(
                self.settings.insight_portal_url,
                self.settings.insight_api_key,
                self.settings.insight_api_secret,
                family,
            )

            _logger.info("Found %s devices for family %s", len(found_devices), family)
            for d in found_devices:
                serial = d.get("serialNumber")
                if not serial:
                    continue

                # Strict local filter: ensure the family name is actually in the model string
                extended = d.get("extendedFields", {})
                model_name = (extended.get("model") or d.get("modelName") or "").lower()
                family_lower = family.lower()

                if family_lower not in model_name:
                    _logger.debug(
                        "Skipping device %s: model '%s' does not match family '%s'",
                        serial,
                        model_name,
                        family,
                    )
                    continue

                device = MaintenanceDevice(
                    serial=serial, model_family=family, last_sync_counter=0, is_active=True
                )
                self.repo.upsert_device(device)
                _logger.debug("Discovered/Updated device %s for family %s", serial, family)
        except Exception as e:
            _logger.error("Error discovering devices for family %s: %s", family, e)

    def manual_update_state(self, serial: str, component_type: str, last_change_counter: int):
        """Manually updates the last change counter for a specific device component."""
        _logger.info(
            "Manually updating state for %s - %s to %s", serial, component_type, last_change_counter
        )
        new_state = MaintenanceDeviceState(
            device_serial=serial,
            component_type=component_type,
            last_change_counter=last_change_counter,
        )
        self.repo.upsert_device_state(new_state)
        return new_state

    def rename_family(self, old_family: str, new_family: str):
        _logger.info("Renaming family from %s to %s", old_family, new_family)
        self.repo.rename_model_family(old_family, new_family)

    def clear_family_devices(self, family: str):
        _logger.info("Clearing devices for family %s", family)
        self.repo.delete_devices_by_family(family)
