"""Service for interacting with the HP SDS / EKM Insight Portal Web interface."""

from __future__ import annotations

import logging
import re
import time
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

import requests
from lxml import html

from backend.infrastructure.config import Settings

_logger = logging.getLogger(__name__)

class SDSWebError(Exception):
    """Base exception for SDS Web service."""
    pass

class SDSWebAuthError(SDSWebError):
    """Raised when authentication fails."""
    pass

class SDSWebSession:
    """Manages a session with the HP SDS portal web interface."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.session: Optional[requests.Session] = None
        self.last_login: float = 0
        self.base_url = "https://hp-sds-latam.insightportal.net/PortalWeb"
        # Session TTL: Web sessions usually expire in 30 mins to 2 hours.
        # We'll re-login if it's been more than 20 minutes just to be safe.
        self.session_ttl = 20 * 60 

    def _ensure_session(self):
        """Ensure we have a valid session."""
        now = time.monotonic()
        if self.session is None or (now - self.last_login) > self.session_ttl:
            self._login()

    def _login(self):
        """Perform login to the portal."""
        if not self.settings.sds_web_username or not self.settings.sds_web_password:
            raise SDSWebAuthError("SDS_WEB_USERNAME and SDS_WEB_PASSWORD must be configured")

        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9,ro;q=0.8",
        })

        # 1. Get login page for initial cookie
        t_start = time.perf_counter()
        try:
            self.session.get(f"{self.base_url}/login", timeout=15)
            _logger.info("Phase: Login page fetch took %.2fs", time.perf_counter() - t_start)
        except requests.RequestException as e:
            raise SDSWebError(f"Failed to reach login page: {e}")

        # 2. Post credentials
        t_post_start = time.perf_counter()
        try:
            resp = self.session.post(
                f"{self.base_url}/login",
                data={
                    "username": self.settings.sds_web_username,
                    "password": self.settings.sds_web_password
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Origin": "https://hp-sds-latam.insightportal.net",
                    "Referer": f"{self.base_url}/login",
                },
                allow_redirects=True,
                timeout=10,
            )
            _logger.info("Phase: Login POST took %.2fs", time.perf_counter() - t_post_start)
        except requests.RequestException as e:
            raise SDSWebError(f"Login request failed: {e}")

        if resp.status_code != 200 or "login" in resp.url.lower():
            self.session = None
            raise SDSWebAuthError("Authentication failed: invalid credentials or portal error")

        self.last_login = time.monotonic()
        _logger.info("Successfully logged into SDS Web portal as %s", self.settings.sds_web_username)

    def search_device(self, serial: str) -> Dict[str, str]:
        """Search for a device by serial and return its numeric ID and model name."""
        self._ensure_session()
        serial = serial.strip().upper()
        
        t_search_start = time.perf_counter()
        try:
            resp = self.session.get(
                f"{self.base_url}/search",
                params=[("src", "powerSearch"), ("q", serial), ("s", "devices")],
                allow_redirects=True,
                timeout=15,
            )
            _logger.info("Phase: Device search (%s) took %.2fs", serial, time.perf_counter() - t_search_start)
        except requests.RequestException as e:
            raise SDSWebError(f"Search request failed: {e}")

        # Try to find Model Name in HTML using the class provided by user
        model_name = "Generico / Desconocido"
        try:
            tree = html.fromstring(resp.text)
            # Match the class "entity-name model"
            model_links = tree.xpath('//a[contains(@class, "entity-name") and contains(@class, "model")]')
            if model_links:
                model_name = model_links[0].text_content().strip()
                # Clean up multiple spaces/newlines
                model_name = " ".join(model_name.split())
        except Exception as e:
            _logger.warning("Failed to extract model name from SDS response: %s", e)

        # If it redirected to a device page, extract ID from URL
        device_id = None
        if "/devices/" in resp.url:
            match = re.search(r'/devices/(\d+)', resp.url)
            if match:
                device_id = match.group(1)

        # Otherwise, try to find it in the response text (it might be a list of results)
        if not device_id:
            matches = list(set(re.findall(r'/devices/(\d+)', resp.text)))
            if matches:
                device_id = matches[0]

        if not device_id:
            raise SDSWebError(f"Device with serial {serial} not found in portal")
        
        return {"id": device_id, "model_name": model_name}

    def fetch_event_logs_html(self, device_id: str, days: int = 30) -> str:
        """Fetch event logs for a device in HTML (AJAX response) format."""
        self._ensure_session()
        
        date_from = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        t_fetch_start = time.perf_counter()
        try:
            resp = self.session.get(
                f"{self.base_url}/devices/{device_id}/hpsmart/eventlogs",
                params=[
                    ("from", date_from),
                    ("eventLevel", "info"),
                    ("eventLevel", "warning"),
                    ("eventLevel", "error")
                ],
                headers={
                    "x-ekm-usage": "dialog",
                    "x-requested-with": "XMLHttpRequest",
                    "Accept": "*/*",
                },
                timeout=25,
            )
            _logger.info("Phase: Events fetch (%s, %dd) took %.2fs", device_id, days, time.perf_counter() - t_fetch_start)
        except requests.RequestException as e:
            raise SDSWebError(f"Failed to fetch event logs: {e}")

        if resp.status_code != 200:
            raise SDSWebError(f"Error fetching event logs ({resp.status_code}): {resp.text[:200]}")

        return resp.text

def html_to_tsv(raw_xml_html: str) -> str:
    """Extract table from EKM AJAX response and convert to TSV format."""
    # The response is XML with CDATA containing HTML
    try:
        # The response is an XML-like structure <ekm-ajax-response>
        # with <content><![CDATA[...]]></content>
        try:
            # Try parsing as XML first to get the content tag
            from lxml import etree
            root = etree.fromstring(raw_xml_html.encode('utf-8'))
            content_node = root.find('content')
            if content_node is not None and content_node.text:
                html_content = content_node.text
            else:
                # Fallback to regex if XML parsing fails or node is empty
                match = re.search(r'<content>\s*<!\[CDATA\[(.*?)\]\]>\s*</content>', raw_xml_html, re.DOTALL)
                html_content = match.group(1) if match else raw_xml_html
        except Exception:
            # Robust fallback: find the largest CDATA block (usually the content)
            cdatas = re.findall(r'<!\[CDATA\[(.*?)\]\]>', raw_xml_html, re.DOTALL)
            html_content = max(cdatas, key=len) if cdatas else raw_xml_html
        
        if not html_content or not html_content.strip():
            return ""

        tree = html.fromstring(html_content)
        table = tree.xpath('//table[@class="data"]')
        if not table:
            # Fallback for any table if class data is missing
            table = tree.xpath('//table')
            
        if not table:
            return ""
            
        rows = []
        # Header (explicitly use the same header as samples/hp_log.txt for compatibility if possible,
        # but the LogParser is flexible as long as keywords match in the first 3 lines)
        header = ["Tipo de evento", "Código de evento", "Fecha de evento", "N.º total de impresiones", "Versión del firmware", "Ayuda"]
        rows.append("\t".join(header))
        
        for tr in table[0].xpath('.//tbody/tr'):
            cells = []
            for td in tr.xpath('./td'):
                # Extract text, handling potential links in the 'Help' column
                text = td.text_content().strip()
                # Clean up multiple whitespaces/newlines
                text = " ".join(text.split())
                cells.append(text)
            
            if cells:
                # Ensure we have 6 columns
                while len(cells) < 6:
                    cells.append("")
                rows.append("\t".join(cells[:6]))
                
        return "\n".join(rows)
    except Exception as e:
        _logger.error("Error parsing SDS HTML to TSV: %s", e)
        raise SDSWebError(f"Failed to parse log data: {e}")

_session_cache: Optional[SDSWebSession] = None

def get_session(settings: Settings) -> SDSWebSession:
    """Get or create singleton session."""
    global _session_cache
    if _session_cache is None:
        _session_cache = SDSWebSession(settings)
    return _session_cache
