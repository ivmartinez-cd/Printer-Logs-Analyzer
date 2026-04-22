
import unittest
from unittest.mock import MagicMock, patch
from backend.application.services.email_service import EmailService

class TestEmailService(unittest.TestCase):
    def setUp(self):
        self.service = EmailService()
        self.service.settings = MagicMock()
        self.service.settings.smtp_host = "smtp.test.com"
        self.service.settings.smtp_port = 587
        self.service.settings.smtp_from = "test@analyzer.com"
        self.service.settings.smtp_user = "user"
        self.service.settings.smtp_password = "password"

    @patch("smtplib.SMTP")
    def test_send_email_success(self, mock_smtp):
        # Setup mock server context manager
        mock_server = mock_smtp.return_value.__enter__.return_value
        
        self.service.send_email(["to@test.com"], "Subject", "<h1>Body</h1>")
        
        # Verify SMTP interaction
        mock_smtp.assert_called_with("smtp.test.com", 587)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_with("user", "password")
        mock_server.send_message.assert_called_once()
        
        # Check message content
        msg = mock_server.send_message.call_args[0][0]
        self.assertEqual(msg['To'], "to@test.com")
        self.assertEqual(msg['Subject'], "Subject")

    @patch("smtplib.SMTP")
    def test_send_maintenance_alert_template(self, mock_smtp):
        mock_server = mock_smtp.return_value.__enter__.return_value
        
        self.service.send_maintenance_alert(
            serial="SERIAL123",
            component="Fuser",
            current_counter=100000,
            next_change=110000,
            remaining=10000,
            recipients=["admin@test.com"]
        )
        
        msg = mock_server.send_message.call_args[0][0]
        # Get the first part (the HTML body) and decode it from bytes to string
        body = msg.get_payload()[0].get_payload(decode=True).decode('utf-8')
    
        self.assertIn("SERIAL123", body)
        self.assertIn("Fuser", body)
        self.assertIn("100,000", body) # Testing formatting with commas
        self.assertIn("10,000", body)

    def test_send_email_no_host_skips(self):
        self.service.settings.smtp_host = None
        with patch("smtplib.SMTP") as mock_smtp:
            self.service.send_email(["to@test.com"], "Subject", "Body")
            mock_smtp.assert_not_called()

if __name__ == "__main__":
    unittest.main()
