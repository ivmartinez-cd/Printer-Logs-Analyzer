import threading
from typing import List, Optional

from backend.application.services.maintenance_service import (
    MaintenanceService,
    create_sync_job,
    get_sync_job,
)
from backend.domain.entities import (
    MaintenanceDevice,
    MaintenanceDeviceState,
    MaintenanceHistory,
    MaintenanceIncident,
    MaintenanceModelRule,
)
from backend.interface.auth import authenticate
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/maintenance", tags=["Maintenance"], dependencies=[Depends(authenticate)])

class RecordChangeRequest(BaseModel):
    serial: str
    component_type: str
    incident_number: Optional[str] = None
    notes: Optional[str] = None

class UpdateStateRequest(BaseModel):
    serial: str
    component_type: str
    last_change_counter: int

class RenameFamilyRequest(BaseModel):
    old_name: str
    new_name: str

class CheckNowRequest(BaseModel):
    model_family: Optional[str] = None
    send_emails: bool = True

class OpenIncidentRequest(BaseModel):
    serial: str
    component_type: str
    incident_number: str
    notes: Optional[str] = None

class CloseIncidentRequest(BaseModel):
    notes: Optional[str] = None

class SendAlertRequest(BaseModel):
    serial: str
    component_type: str

def get_maintenance_service():
    return MaintenanceService()

@router.post("/send-alert")
def send_alert_manual(req: SendAlertRequest, service: MaintenanceService = Depends(get_maintenance_service)):
    """Fuerza el envío inmediato de una alerta de mantenimiento por email para un equipo y componente específico."""
    try:
        # Buscar el dispositivo entre todos los disponibles
        all_devices = service.repo.get_all_devices()
        device = next((d for d in all_devices if d.serial == req.serial), None)
        if not device:
            raise HTTPException(status_code=404, detail=f"Equipo {req.serial} no encontrado")

        rule = next((r for r in service.repo.get_model_rules(device.model_family or '') if r.component_type == req.component_type), None)
        if not rule:
            raise HTTPException(status_code=404, detail=f"No existe regla para {req.component_type} en este modelo")

        recipients = [r.strip() for r in (rule.email_recipients or '').split(',') if r.strip()]
        if not recipients:
            raise HTTPException(status_code=422, detail="La regla no tiene destinatarios de email configurados")

        # Obtener el estado del componente para calcular remaining
        all_states = service.repo.get_device_state(req.serial)
        state = next((s for s in all_states if s.component_type == req.component_type), None)
        current_counter = device.last_sync_counter or 0
        last_change_counter = state.last_change_counter if state else current_counter
        next_change = last_change_counter + rule.expected_life
        remaining = next_change - current_counter

        service.email.send_maintenance_alert(
            serial=device.serial,
            component=rule.component_type,
            current_counter=current_counter,
            next_change=next_change,
            remaining=remaining,
            recipients=recipients,
        )
        return {"status": "sent", "recipients": recipients}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/models/rename")
def rename_family(req: RenameFamilyRequest, service: MaintenanceService = Depends(get_maintenance_service)):
    service.rename_family(req.old_name, req.new_name)
    return {"status": "ok"}

@router.delete("/models/{model_family}/devices")
def clear_devices(model_family: str, service: MaintenanceService = Depends(get_maintenance_service)):
    service.clear_family_devices(model_family)
    return {"status": "ok"}

@router.delete("/models/{model_family}")
def delete_family(model_family: str, service: MaintenanceService = Depends(get_maintenance_service)):
    service.repo.delete_family(model_family)
    return {"status": "ok"}

@router.post("/models/{model_family}/discover")
def discover_family(model_family: str, service: MaintenanceService = Depends(get_maintenance_service)):
    service.discover_family(model_family)
    return {"status": "ok"}

@router.post("/devices/state")
def update_device_state(req: UpdateStateRequest, service: MaintenanceService = Depends(get_maintenance_service)):
    service.manual_update_state(req.serial, req.component_type, req.last_change_counter)
    return {"status": "ok"}

@router.get("/devices", response_model=List[MaintenanceDevice])
def list_devices(service: MaintenanceService = Depends(get_maintenance_service)):
    return service.repo.get_all_devices()

@router.post("/devices")
def upsert_device(device: MaintenanceDevice, service: MaintenanceService = Depends(get_maintenance_service)):
    service.repo.upsert_device(device)
    return {"status": "ok"}

@router.get("/models/{model_family}/rules", response_model=List[MaintenanceModelRule])
def list_model_rules(model_family: str, service: MaintenanceService = Depends(get_maintenance_service)):
    return service.repo.get_model_rules(model_family)

@router.post("/models/rules")
def upsert_model_rule(rule: MaintenanceModelRule, service: MaintenanceService = Depends(get_maintenance_service)):
    service.repo.upsert_model_rule(rule)
    return {"status": "ok"}

@router.get("/models/families", response_model=List[str])
def list_families(service: MaintenanceService = Depends(get_maintenance_service)):
    return service.repo.get_all_model_families()

@router.get("/devices/{serial}/state", response_model=List[MaintenanceDeviceState])
def get_device_state(serial: str, service: MaintenanceService = Depends(get_maintenance_service)):
    return service.repo.get_device_state(serial)

@router.post("/check-now")
def check_now(req: CheckNowRequest, service: MaintenanceService = Depends(get_maintenance_service)):
    """Start background maintenance sync. Returns job_id for polling."""
    devices = service.repo.get_all_devices()
    active = [d for d in devices if d.is_active]
    if req.model_family:
        active = [d for d in active if d.model_family == req.model_family]

    job_id = create_sync_job(len(active))

    def _run():
        try:
            service.sync_and_check_all(
                discover=False,
                model_family=req.model_family,
                send_emails=req.send_emails,
                job_id=job_id,
            )
        except Exception as e:
            from backend.application.services.maintenance_service import _update_sync_job
            _update_sync_job(job_id, 0, 0, status="failed")

    threading.Thread(target=_run, daemon=True).start()
    return {"job_id": job_id, "total": len(active), "status": "running"}

@router.get("/sync-status/{job_id}")
def sync_status(job_id: str):
    """Poll progress of a running sync job."""
    job = get_sync_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/devices/{serial}/sync", response_model=MaintenanceDevice)
def sync_device(serial: str, send_emails: bool = True, service: MaintenanceService = Depends(get_maintenance_service)):
    """Sync a single device and return the updated state."""
    try:
        return service.sync_single_device(serial, send_emails=send_emails)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e

@router.get("/history/{serial}", response_model=List[MaintenanceHistory])
def get_history(serial: str, service: MaintenanceService = Depends(get_maintenance_service)):
    return service.get_history(serial)

@router.get("/devices/{serial}/incidents", response_model=List[MaintenanceIncident])
def get_incidents(serial: str, service: MaintenanceService = Depends(get_maintenance_service)):
    return service.get_incidents(serial)

@router.post("/incidents", response_model=MaintenanceIncident)
def open_incident(req: OpenIncidentRequest, service: MaintenanceService = Depends(get_maintenance_service)):
    return service.open_incident(req.serial, req.component_type, req.incident_number, req.notes)

@router.post("/incidents/{incident_id}/close")
def close_incident(incident_id: str, req: CloseIncidentRequest, service: MaintenanceService = Depends(get_maintenance_service)):
    try:
        history = service.close_incident(incident_id, req.notes)
        return {"status": "ok", "history_id": history.id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e

@router.post("/record-change")
def record_change(req: RecordChangeRequest, service: MaintenanceService = Depends(get_maintenance_service)):
    try:
        history = service.record_change(req.serial, req.component_type, req.incident_number, req.notes)
        return {"status": "ok", "history_id": history.id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
