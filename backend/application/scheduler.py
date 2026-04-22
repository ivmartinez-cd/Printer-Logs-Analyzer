import logging

from apscheduler.schedulers.background import BackgroundScheduler
from backend.application.services.maintenance_service import MaintenanceService

_logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = BackgroundScheduler()

def start_scheduler():
    if not scheduler.running:
        _logger.info("Initializing APScheduler...")

        service = MaintenanceService()

        # Add maintenance check task (every 30 minutes)
        scheduler.add_job(
            service.sync_and_check_all,
            'interval',
            minutes=30,
            id='maintenance_check',
            replace_existing=True,
            kwargs={'discover': True}
        )

        scheduler.start()
        _logger.info("APScheduler started.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        _logger.info("APScheduler shut down.")
