import threading
import uuid
from datetime import datetime, timedelta

# --- Job tracker ---
_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()

def create_job(total: int) -> str:
    job_id = str(uuid.uuid4())
    cutoff = datetime.utcnow() - timedelta(hours=1)
    with _jobs_lock:
        # Cleanup stale jobs
        stale = [k for k, v in _jobs.items() if v.get("started_at", datetime.utcnow()) < cutoff]
        for k in stale:
            del _jobs[k]
        _jobs[job_id] = {
            "status": "running", 
            "processed": 0, 
            "total": total, 
            "errors": 0, 
            "started_at": datetime.utcnow(),
            "results": None
        }
    return job_id

def get_job(job_id: str) -> dict | None:
    with _jobs_lock:
        job = _jobs.get(job_id)
        return dict(job) if job else None

def update_job(job_id: str, processed: int, errors: int, status: str = "running", results: any = None):
    with _jobs_lock:
        if job_id in _jobs:
            _jobs[job_id]["processed"] = processed
            _jobs[job_id]["errors"] = errors
            _jobs[job_id]["status"] = status
            if results is not None:
                _jobs[job_id]["results"] = results
