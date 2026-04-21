import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from backend.infrastructure.config import get_settings

_logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.settings = get_settings()

    def send_email(self, recipients: List[str], subject: str, body_html: str):
        if not self.settings.smtp_host:
            _logger.warning("SMTP_HOST not configured. Email NOT sent. Subject: %s", subject)
            _logger.info("Body (HTML): %s", body_html[:200])
            return

        msg = MIMEMultipart()
        msg['From'] = self.settings.smtp_from
        msg['To'] = ", ".join(recipients)
        msg['Subject'] = subject

        msg.attach(MIMEText(body_html, 'html'))

        try:
            with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port) as server:
                if self.settings.smtp_user and self.settings.smtp_password:
                    server.starttls()
                    server.login(self.settings.smtp_user, self.settings.smtp_password)
                server.send_message(msg)
            _logger.info("Email sent to %s: %s", recipients, subject)
        except Exception as e:
            _logger.error("Failed to send email to %s: %s", recipients, e)

    def send_maintenance_alert(self, serial: str, component: str, current_counter: int, next_change: int, remaining: int, recipients: List[str]):
        subject = f"⚠️ ALERTA: Mantenimiento Preventivo - {serial} - {component}"
        
        body = f"""
        <html>
        <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #d32f2f;">Alerta de Mantenimiento Preventivo</h2>
            <p>El equipo con serie <strong>{serial}</strong> requiere atención en el componente <strong>{component}</strong>.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <ul style="list-style: none; padding: 0;">
                    <li>📉 <strong>Contador Actual:</strong> {current_counter:,} págs.</li>
                    <li>📅 <strong>Próximo Cambio:</strong> {next_change:,} págs. (est.)</li>
                    <li>⏳ <strong>Páginas Restantes:</strong> <span style="color: #d32f2f; font-weight: bold;">{remaining:,}</span></li>
                </ul>
            </div>
            
            <p>Por favor, coordine el reemplazo del componente para evitar interrupciones en el servicio.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8em; color: #777;">Este es un aviso automático generado por HP Logs Analyzer.</p>
        </body>
        </html>
        """
        self.send_email(recipients, subject, body)
