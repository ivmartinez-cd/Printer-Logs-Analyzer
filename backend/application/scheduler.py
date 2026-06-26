import logging

from apscheduler.schedulers.background import BackgroundScheduler
from backend.application.services.maintenance_service import MaintenanceService
from backend.application.services.sds_snapshot_service import SdsSnapshotService

_logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = BackgroundScheduler()


def start_scheduler():
    if not scheduler.running:
        _logger.info("Initializing APScheduler...")

        maintenance_service = MaintenanceService()
        sds_snapshot_service = SdsSnapshotService()

        # Maintenance check every 30 minutes
        scheduler.add_job(
            maintenance_service.sync_and_check_all,
            "interval",
            minutes=30,
            id="maintenance_check",
            replace_existing=True,
            kwargs={"discover": True},
        )

        # Automated SDS log snapshots twice a day (08:00 and 20:00 UTC)
        scheduler.add_job(
            sds_snapshot_service.capture_all_devices,
            "cron",
            hour=8,
            minute=0,
            id="sds_snapshot_morning",
            replace_existing=True,
        )
        scheduler.add_job(
            sds_snapshot_service.capture_all_devices,
            "cron",
            hour=20,
            minute=0,
            id="sds_snapshot_evening",
            replace_existing=True,
        )

        scheduler.start()
        _logger.info("APScheduler started.")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        _logger.info("APScheduler shut down.")
