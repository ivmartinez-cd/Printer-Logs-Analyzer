import logging
from typing import List, Optional

from backend.domain.entities import (
    MaintenanceAlert,
    MaintenanceDevice,
    MaintenanceDeviceState,
    MaintenanceHistory,
    MaintenanceIncident,
    MaintenanceModelRule,
)
from backend.infrastructure.repositories.base_repository import BaseRepository

_logger = logging.getLogger(__name__)

class MaintenanceRepository(BaseRepository[MaintenanceDevice, str]):
    def __init__(self, database=None):
        super().__init__(database)
        self.resource_name = "Maintenance"

    # --- Devices ---
    def get_all_devices(self) -> List[MaintenanceDevice]:
        return self._execute_with_fallback(self._get_all_devices_db, self._get_all_devices_local)

    def _get_all_devices_db(self) -> List[MaintenanceDevice]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT serial, model_family, last_sync_counter, last_sync_at, is_active FROM maintenance_devices")
                return [MaintenanceDevice(serial=r[0], model_family=r[1], last_sync_counter=r[2], last_sync_at=r[3], is_active=r[4]) for r in cur.fetchall()]

    def _get_all_devices_local(self) -> List[MaintenanceDevice]:
        return []

    def upsert_device(self, device: MaintenanceDevice) -> None:
        self._execute_with_fallback(self._upsert_device_db, lambda d: None, device)

    def _upsert_device_db(self, device: MaintenanceDevice) -> None:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO maintenance_devices (serial, model_family, last_sync_counter, last_sync_at, is_active)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (serial) DO UPDATE SET
                        model_family = EXCLUDED.model_family,
                        last_sync_counter = EXCLUDED.last_sync_counter,
                        last_sync_at = EXCLUDED.last_sync_at,
                        is_active = EXCLUDED.is_active
                """, (device.serial, device.model_family, device.last_sync_counter, device.last_sync_at, device.is_active))
            conn.commit()

    # --- Model Rules ---
    def get_model_rules(self, model_family: str) -> List[MaintenanceModelRule]:
        return self._execute_with_fallback(self._get_model_rules_db, lambda s: [], model_family)

    def _get_model_rules_db(self, model_family: str) -> List[MaintenanceModelRule]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, model_family, component_type, expected_life, alert_margin, email_recipients
                    FROM maintenance_model_rules WHERE model_family = %s
                """, (model_family,))
                return [MaintenanceModelRule(id=r[0], model_family=r[1], component_type=r[2],
                                       expected_life=r[3], alert_margin=r[4], email_recipients=r[5]) for r in cur.fetchall()]

    def upsert_model_rule(self, rule: MaintenanceModelRule) -> None:
        self._execute_with_fallback(self._upsert_model_rule_db, lambda r: None, rule)

    def _upsert_model_rule_db(self, rule: MaintenanceModelRule) -> None:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO maintenance_model_rules (model_family, component_type, expected_life, alert_margin, email_recipients)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (model_family, component_type) DO UPDATE SET
                        expected_life = EXCLUDED.expected_life,
                        alert_margin = EXCLUDED.alert_margin,
                        email_recipients = EXCLUDED.email_recipients
                """, (rule.model_family, rule.component_type, rule.expected_life, rule.alert_margin, rule.email_recipients))
            conn.commit()

    def get_all_model_families(self) -> List[str]:
        return self._execute_with_fallback(self._get_all_model_families_db, lambda: [])

    def _get_all_model_families_db(self) -> List[str]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT DISTINCT model_family FROM maintenance_model_rules")
                return [r[0] for r in cur.fetchall()]

    # --- Device State ---
    def get_device_state(self, serial: str) -> List[MaintenanceDeviceState]:
        return self._execute_with_fallback(self._get_device_state_db, lambda s: [], serial)

    def _get_device_state_db(self, serial: str) -> List[MaintenanceDeviceState]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, device_serial, component_type, last_change_counter
                    FROM maintenance_device_state WHERE device_serial = %s
                """, (serial,))
                return [MaintenanceDeviceState(id=r[0], device_serial=r[1], component_type=r[2], last_change_counter=r[3]) for r in cur.fetchall()]

    def upsert_device_state(self, state: MaintenanceDeviceState) -> None:
        self._execute_with_fallback(self._upsert_device_state_db, lambda s: None, state)

    def _upsert_device_state_db(self, state: MaintenanceDeviceState) -> None:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO maintenance_device_state (device_serial, component_type, last_change_counter)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (device_serial, component_type) DO UPDATE SET
                        last_change_counter = EXCLUDED.last_change_counter
                """, (state.device_serial, state.component_type, state.last_change_counter))
            conn.commit()

    # --- Alerts ---
    def get_last_alert(self, serial: str, component_type: str) -> Optional[MaintenanceAlert]:
        return self._execute_with_fallback(self._get_last_alert_db, lambda s, c: None, serial, component_type)

    def _get_last_alert_db(self, serial: str, component_type: str) -> Optional[MaintenanceAlert]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, device_serial, component_type, triggered_at, counter_at_alert, status
                    FROM maintenance_alerts
                    WHERE device_serial = %s AND component_type = %s
                    ORDER BY triggered_at DESC LIMIT 1
                """, (serial, component_type))
                r = cur.fetchone()
                if r:
                    return MaintenanceAlert(id=r[0], device_serial=r[1], component_type=r[2], triggered_at=r[3], counter_at_alert=r[4], status=r[5])
                return None

    def create_alert(self, alert: MaintenanceAlert) -> None:
        self._execute_with_fallback(self._create_alert_db, lambda a: None, alert)

    def _create_alert_db(self, alert: MaintenanceAlert) -> None:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO maintenance_alerts (device_serial, component_type, triggered_at, counter_at_alert, status)
                    VALUES (%s, %s, %s, %s, %s)
                """, (alert.device_serial, alert.component_type, alert.triggered_at, alert.counter_at_alert, alert.status))
            conn.commit()

    def delete_alerts_for_component(self, serial: str, component_type: str) -> None:
        self._execute_with_fallback(self._delete_alerts_db, lambda s, c: None, serial, component_type)

    def _delete_alerts_db(self, serial: str, component_type: str) -> None:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM maintenance_alerts WHERE device_serial = %s AND component_type = %s", (serial, component_type))
            conn.commit()

    # --- History ---
    def get_history(self, serial: str) -> List[MaintenanceHistory]:
        return self._execute_with_fallback(self._get_history_db, lambda s: [], serial)

    def _get_history_db(self, serial: str) -> List[MaintenanceHistory]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, device_serial, component_type, change_counter, incident_number, technician_notes, changed_at
                    FROM maintenance_history WHERE device_serial = %s
                    ORDER BY changed_at DESC
                """, (serial,))
                return [MaintenanceHistory(
                    id=r[0], device_serial=r[1], component_type=r[2],
                    change_counter=r[3], incident_number=r[4],
                    technician_notes=r[5], changed_at=r[6]
                ) for r in cur.fetchall()]

    def create_history_record(self, record: MaintenanceHistory) -> None:
        self._execute_with_fallback(self._create_history_record_db, lambda r: None, record)

    def _create_history_record_db(self, record: MaintenanceHistory) -> None:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO maintenance_history (device_serial, component_type, change_counter, incident_number, technician_notes, changed_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (record.device_serial, record.component_type, record.change_counter, record.incident_number, record.technician_notes, record.changed_at))
            conn.commit()

    # --- Incidents ---
    def get_open_incident(self, serial: str, component_type: str) -> Optional[MaintenanceIncident]:
        return self._execute_with_fallback(self._get_open_incident_db, lambda s, c: None, serial, component_type)

    def _get_open_incident_db(self, serial: str, component_type: str) -> Optional[MaintenanceIncident]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, device_serial, component_type, incident_number, notes, status, opened_at, closed_at
                    FROM maintenance_incidents
                    WHERE device_serial = %s AND component_type = %s AND status = 'open'
                    ORDER BY opened_at DESC LIMIT 1
                """, (serial, component_type))
                r = cur.fetchone()
                if r:
                    return MaintenanceIncident(id=str(r[0]), device_serial=r[1], component_type=r[2],
                                              incident_number=r[3], notes=r[4], status=r[5],
                                              opened_at=r[6], closed_at=r[7])
                return None

    def get_incident_by_id(self, incident_id: str) -> Optional[MaintenanceIncident]:
        return self._execute_with_fallback(self._get_incident_by_id_db, lambda i: None, incident_id)

    def _get_incident_by_id_db(self, incident_id: str) -> Optional[MaintenanceIncident]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, device_serial, component_type, incident_number, notes, status, opened_at, closed_at
                    FROM maintenance_incidents WHERE id = %s
                """, (incident_id,))
                r = cur.fetchone()
                if r:
                    return MaintenanceIncident(id=str(r[0]), device_serial=r[1], component_type=r[2],
                                              incident_number=r[3], notes=r[4], status=r[5],
                                              opened_at=r[6], closed_at=r[7])
                return None

    def create_incident(self, incident: MaintenanceIncident) -> MaintenanceIncident:
        return self._execute_with_fallback(self._create_incident_db, lambda i: i, incident)

    def _create_incident_db(self, incident: MaintenanceIncident) -> MaintenanceIncident:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO maintenance_incidents (device_serial, component_type, incident_number, notes, status)
                    VALUES (%s, %s, %s, %s, 'open')
                    RETURNING id, opened_at
                """, (incident.device_serial, incident.component_type, incident.incident_number, incident.notes))
                row = cur.fetchone()
            conn.commit()
        return MaintenanceIncident(
            id=str(row[0]),
            device_serial=incident.device_serial,
            component_type=incident.component_type,
            incident_number=incident.incident_number,
            notes=incident.notes,
            status="open",
            opened_at=row[1],
        )

    def close_incident(self, incident_id: str) -> None:
        self._execute_with_fallback(self._close_incident_db, lambda i: None, incident_id)

    def _close_incident_db(self, incident_id: str) -> None:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE maintenance_incidents
                    SET status = 'closed', closed_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (incident_id,))
            conn.commit()

    def get_incidents(self, serial: str) -> List[MaintenanceIncident]:
        return self._execute_with_fallback(self._get_incidents_db, lambda s: [], serial)

    def _get_incidents_db(self, serial: str) -> List[MaintenanceIncident]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, device_serial, component_type, incident_number, notes, status, opened_at, closed_at
                    FROM maintenance_incidents WHERE device_serial = %s
                    ORDER BY opened_at DESC
                """, (serial,))
                return [MaintenanceIncident(
                    id=str(r[0]), device_serial=r[1], component_type=r[2],
                    incident_number=r[3], notes=r[4], status=r[5],
                    opened_at=r[6], closed_at=r[7],
                ) for r in cur.fetchall()]

    def rename_model_family(self, old_family: str, new_family: str):
        self._execute_with_fallback(self._rename_model_family_db, lambda o, n: None, old_family, new_family)

    def _rename_model_family_db(self, old_family: str, new_family: str):
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE maintenance_model_rules SET model_family = %s WHERE model_family = %s", (new_family, old_family))
                cur.execute("UPDATE maintenance_devices SET model_family = %s WHERE model_family = %s", (new_family, old_family))
            conn.commit()

    def delete_devices_by_family(self, family: str):
        self._execute_with_fallback(self._delete_devices_by_family_db, lambda f: None, family)

    def _delete_devices_by_family_db(self, family: str):
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM maintenance_devices WHERE model_family = %s", (family,))
            conn.commit()
