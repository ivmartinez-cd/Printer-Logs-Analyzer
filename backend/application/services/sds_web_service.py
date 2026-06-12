"""Service for interacting with the HP SDS / EKM Insight Portal Web interface."""

from __future__ import annotations

import logging
import re
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Optional

import requests
from backend.infrastructure.config import Settings
from lxml import etree as _etree
from lxml import html

_logger = logging.getLogger(__name__)
_login_lock = threading.Lock()


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
        """Ensure we have a valid session with thread safety."""
        now = time.monotonic()
        if self.session is None or (now - self.last_login) > self.session_ttl:
            with _login_lock:
                # Double-check inside the lock
                now = time.monotonic()
                if self.session is None or (now - self.last_login) > self.session_ttl:
                    self._login()

    def _login(self):
        """Perform login to the portal."""
        if not self.settings.sds_web_username or not self.settings.sds_web_password:
            raise SDSWebAuthError("SDS_WEB_USERNAME and SDS_WEB_PASSWORD must be configured")

        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "es-ES,es;q=0.9,ro;q=0.8",
            }
        )

        # 1. Get login page for initial cookie
        try:
            self.session.get(f"{self.base_url}/login", timeout=15)
        except requests.RequestException as e:
            raise SDSWebError(f"Failed to reach login page: {e}") from e

        # 2. Post credentials
        try:
            resp = self.session.post(
                f"{self.base_url}/login",
                data={
                    "username": self.settings.sds_web_username,
                    "password": self.settings.sds_web_password,
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Origin": "https://hp-sds-latam.insightportal.net",
                    "Referer": f"{self.base_url}/login",
                },
                allow_redirects=True,
                timeout=10,
            )
        except requests.RequestException as e:
            raise SDSWebError(f"Login request failed: {e}") from e

        if resp.status_code != 200 or "/login" in resp.url.lower():
            self.session = None
            msg = f"Portal login failed. Final URL: {resp.url}. Status: {resp.status_code}"
            if "/login" in resp.url.lower():
                msg = "Authentication failed: invalid credentials or portal error"
            raise SDSWebAuthError(msg)

        self.last_login = time.monotonic()
        _logger.info(
            "Successfully logged into SDS Web portal as %s", self.settings.sds_web_username
        )

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
            _logger.info(
                "Phase: Device search (%s) took %.2fs", serial, time.perf_counter() - t_search_start
            )
        except requests.RequestException as e:
            raise SDSWebError(f"Search request failed: {e}") from e

        # Try to find Model Name in HTML using Regex first.
        model_name = "Generico / Desconocido"
        try:
            regex_match = re.search(
                r'<a[^>]*?class="[^"]*?entity-name[^"]*?model[^"]*?"[^>]*?>\s*([^<]+?)\s*</a>',
                resp.text,
                re.IGNORECASE,
            )
            if regex_match:
                model_name = regex_match.group(1).strip()
            else:
                tree = html.fromstring(resp.text)
                model_links = tree.xpath(
                    '//a[contains(@class, "entity-name") and contains(@class, "model")]'
                )
                if model_links:
                    model_name = model_links[0].text_content().strip()

            model_name = " ".join(model_name.split())
        except Exception as e:
            _logger.warning("Failed to extract model name from SDS response: %s", e)

        device_id = None
        if "/devices/" in resp.url:
            match = re.search(r"/devices/(\d+)", resp.url)
            if match:
                device_id = match.group(1)

        if not device_id:
            matches = list(set(re.findall(r"/devices/(\d+)", resp.text)))
            if matches:
                device_id = matches[0]

        if not device_id:
            raise SDSWebError(f"Device with serial {serial} not found in portal")

        return {"id": device_id, "model_name": model_name}

    def get_raw_session(self) -> requests.Session:
        """Return the inner requests session, ensuring it's logged in."""
        self._ensure_session()
        if self.session is None:
            raise SDSWebAuthError("Failed to initialize session")
        return self.session

    def fetch_solution_content(self, url: str) -> Optional[str]:
        """Fetch HP solution article content from a Content Bootstrapper or KaaS URL.

        Content Bootstrapper URLs (api-sds-contentbootstrapper-prod.sds.hp8.us) carry a
        self-contained JWT — no extra auth needed, they always work when fresh.
        Direct KaaS URLs (kaas.hpcloud.hp.com) embed an opaque token that expires; these
        are only kept for backward compatibility with old catalog entries.
        """
        self._ensure_session()
        try:
            resp = self.session.get(url, allow_redirects=True, timeout=20)
            _logger.info("Solution fetch: status=%s url=%s", resp.status_code, resp.url[:80])
            if resp.status_code == 200 and "login" not in resp.url.lower():
                return resp.text
            _logger.warning(
                "Solution fetch failed: status=%s final_url=%s", resp.status_code, resp.url[:80]
            )
        except requests.RequestException as e:
            _logger.warning("Solution fetch exception: %s", e)
        return None

    # Keep old name as alias for backward compat with existing tests
    def fetch_kaas_content(self, url: str) -> Optional[str]:
        return self.fetch_solution_content(url)

    def fetch_event_logs_html(self, device_id: str, days: int = 30) -> str:
        """Fetch event logs for a device in HTML (AJAX response) format."""
        self._ensure_session()

        date_from = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

        t_fetch_start = time.perf_counter()
        try:
            resp = self.session.get(
                f"{self.base_url}/devices/{device_id}/hpsmart/eventlogs",
                params=[
                    ("from", date_from),
                    ("eventLevel", "info"),
                    ("eventLevel", "warning"),
                    ("eventLevel", "error"),
                ],
                headers={
                    "x-ekm-usage": "dialog",
                    "x-requested-with": "XMLHttpRequest",
                    "Accept": "*/*",
                },
                timeout=25,
            )
            _logger.info(
                "Phase: Events fetch (%s, %dd) took %.2fs",
                device_id,
                days,
                time.perf_counter() - t_fetch_start,
            )
        except requests.RequestException as e:
            raise SDSWebError(f"Failed to fetch event logs: {e}") from e

        if resp.status_code != 200:
            raise SDSWebError(f"Error fetching event logs ({resp.status_code}): {resp.text[:200]}")

        return resp.text

    def fetch_remote_ews_url(self, device_id: str) -> Optional[str]:
        """Fetch a temporary Remote EWS access link for a device.

        Calls the portal's "Acceso remoto al EWS del dispositivo" action, which
        returns a one-time JWT link to ews.hpjamservices.com that opens the
        device's Embedded Web Server through HP's remote tunnel.
        """
        self._ensure_session()

        try:
            resp = self.session.get(
                f"{self.base_url}/devices/{device_id}/hpsmart/ews",
                headers={
                    "x-ekm-usage": "dialog",
                    "x-requested-with": "XMLHttpRequest",
                    "Accept": "*/*",
                },
                timeout=20,
            )
        except requests.RequestException as e:
            raise SDSWebError(f"Failed to fetch remote EWS link: {e}") from e

        if resp.status_code != 200:
            raise SDSWebError(f"Error fetching remote EWS link ({resp.status_code})")

        html_content = _get_html_content(resp.text)
        tree = html.fromstring(html_content)
        links = tree.xpath('//div[@id="remoteEWSLaunchLink"]//a/@href')
        return links[0] if links else None


def html_to_tsv(raw_xml_html: str) -> str:
    """Extract table from EKM AJAX response and convert to TSV format."""
    try:
        try:
            from lxml import etree

            root = etree.fromstring(raw_xml_html.encode("utf-8"))
            content_node = root.find("content")
            if content_node is not None and content_node.text:
                html_content = content_node.text
            else:
                match = re.search(
                    r"<content>\s*<!\[CDATA\[(.*?)\]\]>\s*</content>", raw_xml_html, re.DOTALL
                )
                html_content = match.group(1) if match else raw_xml_html
        except Exception:
            cdatas = re.findall(r"<!\[CDATA\[(.*?)\]\]>", raw_xml_html, re.DOTALL)
            html_content = max(cdatas, key=len) if cdatas else raw_xml_html

        if not html_content or not html_content.strip():
            return ""

        tree = html.fromstring(html_content)
        table = tree.xpath('//table[@class="data"]')
        if not table:
            table = tree.xpath("//table")

        if not table:
            return ""

        rows = []
        header = [
            "Tipo de evento",
            "Código de evento",
            "Fecha de evento",
            "N.º total de impresiones",
            "Versión del firmware",
            "Ayuda",
        ]
        rows.append("\t".join(header))

        for tr in table[0].xpath(".//tbody/tr"):
            cells = []
            for td in tr.xpath("./td"):
                text = td.text_content().strip()
                text = " ".join(text.split())
                cells.append(text)

            if cells:
                while len(cells) < 6:
                    cells.append("")
                rows.append("\t".join(cells[:6]))

        return "\n".join(rows)
    except Exception as e:
        _logger.error("Error parsing SDS HTML to TSV: %s", e)
        raise SDSWebError(f"Failed to parse log data: {e}") from e


def _get_html_content(raw_xml_html: str) -> str:
    """Extract inner HTML from EKM AJAX CDATA wrapper."""
    try:
        root = _etree.fromstring(raw_xml_html.encode("utf-8"))
        node = root.find("content")
        if node is not None and node.text:
            return node.text
    except Exception:
        pass
    cdatas = re.findall(r"<!\[CDATA\[(.*?)\]\]>", raw_xml_html, re.DOTALL)
    return max(cdatas, key=len) if cdatas else raw_xml_html


def extract_help_urls(raw_xml_html: str) -> Dict[str, Dict[str, str]]:
    """Return {error_code: {'url': url, 'description': description}} from event logs HTML.

    The portal embeds a fresh HP Content Bootstrapper JWT URL and its description
    in the Ayuda column for each event row.
    """
    result: Dict[str, Dict[str, str]] = {}
    try:
        html_content = _get_html_content(raw_xml_html)
        tree = html.fromstring(html_content)
        for tr in tree.xpath("//tbody/tr"):
            tds = tr.xpath("./td")
            if len(tds) < 6:
                continue
            code = " ".join(tds[1].text_content().split())
            if not code:
                continue

            # The description logic: extract the link text
            links = tds[5].xpath(".//a")
            if links and code not in result:
                url = links[0].get("href")
                description = " ".join(links[0].text_content().split())
                if url:
                    result[code] = {"url": url, "description": description if description else None}
    except Exception as e:
        _logger.warning("extract_help_urls failed: %s", e)
    return result


_session_cache: Optional[SDSWebSession] = None


def get_session(settings: Settings) -> SDSWebSession:
    """Get or create singleton session."""
    global _session_cache
    if _session_cache is None:
        _session_cache = SDSWebSession(settings)
    return _session_cache
