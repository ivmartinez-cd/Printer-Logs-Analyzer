from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from backend.domain.entities import MaintenanceDevice, MaintenanceModelRule, MaintenanceDeviceState, MaintenanceHistory
from backend.application.services.maintenance_service import MaintenanceService
from backend.interface.auth import authenticate

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

def get_maintenance_service():
    return MaintenanceService()

@router.post("/models/rename")
def rename_family(req: RenameFamilyRequest, service: MaintenanceService = Depends(get_maintenance_service)):
    service.rename_family(req.old_name, req.new_name)
    return {"status": "ok"}

@router.delete("/models/{model_family}/devices")
def clear_devices(model_family: str, service: MaintenanceService = Depends(get_maintenance_service)):
    service.clear_family_devices(model_family)
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

@router.get("/devices/{serial}/state", response_model=List[MaintenanceDeviceState])
def get_device_state(serial: str, service: MaintenanceService = Depends(get_maintenance_service)):
    return service.repo.get_device_state(serial)

@router.post("/check-now")
def check_now(background_tasks: BackgroundTasks, service: MaintenanceService = Depends(get_maintenance_service)):
    """Force an immediate maintenance sync and check (runs in background)."""
    background_tasks.add_task(service.sync_and_check_all)
    return {"status": "triggered"}

@router.get("/history/{serial}", response_model=List[MaintenanceHistory])
def get_history(serial: str, service: MaintenanceService = Depends(get_maintenance_service)):
    return service.get_history(serial)

@router.post("/record-change")
def record_change(req: RecordChangeRequest, service: MaintenanceService = Depends(get_maintenance_service)):
    try:
        history = service.record_change(req.serial, req.component_type, req.incident_number, req.notes)
        return {"status": "ok", "history_id": history.id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
