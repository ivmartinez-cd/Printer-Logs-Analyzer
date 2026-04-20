"""Safe HTTP fetching with SSRF prevention and HTML sanitization."""

from __future__ import annotations

import asyncio
import ipaddress
import logging
from typing import TYPE_CHECKING, Any
from urllib.parse import urlparse as _urlparse

import bleach
import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException

if TYPE_CHECKING:
    import requests

_FETCH_TIMEOUT = 15  # seconds

_PRIVATE_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
]


def validate_ssrf_url(url: str) -> None:
    """Raise HTTPException(422) if the URL is not safe to fetch."""
    try:
        parsed = _urlparse(url)
        scheme = parsed.scheme
        hostname = parsed.hostname
    except Exception:
        raise HTTPException(status_code=422, detail="URL mal formada.") from None

    if scheme != "https":
        raise HTTPException(status_code=422, detail="Solo se permiten URLs con scheme https://.")

    if not hostname:
        raise HTTPException(status_code=422, detail="URL mal formada: sin hostname.")

    try:
        addr = ipaddress.ip_address(hostname)
        if any(addr in net for net in _PRIVATE_NETWORKS):
            raise HTTPException(
                status_code=422, detail="La URL apunta a una dirección IP privada o reservada."
            )
    except ValueError:
        pass  # hostname is a domain name — not an IP literal


def _parse_html_content(html_text: str) -> str:
    """Extract and clean text from an HP solution page HTML."""
    soup = BeautifulSoup(html_text, "html.parser")
    container = soup.find(id="render-content") or soup.find(class_="ish-content") or soup
    for tag in container(["script", "style", "noscript", "head", "nav", "footer", "header"]):
        tag.decompose()
    text = container.get_text(separator="\n")
    lines = [line.strip() for line in text.splitlines()]
    cleaned = "\n".join(line for line in lines if line)
    sanitized = bleach.clean(cleaned, tags=[], attributes={}, strip=True)
    return sanitized[:50_000]


async def fetch_solution_content(
    url: str,
    session: requests.Session | None = None,
    sds_session: Any = None,
) -> str | None:
    """Fetch the text content of a solution page. Returns None on any error.

    For KaaS URLs (kaas.hpcloud.hp.com), pass an SDSWebSession as `sds_session`
    to enable automatic token refresh via the HP portal.
    """
    try:
        # HP solution URLs (KaaS or Content Bootstrapper): delegate to SDS session
        is_hp_solution = "kaas.hpcloud.hp.com" in url or "contentbootstrapper" in url
        if is_hp_solution and sds_session is not None:
            if "kaas.hpcloud.hp.com" in url and "isFullHTMLRequired" not in url:
                url += ("&" if "?" in url else "?") + "isFullHTMLRequired=true"
            raw = await asyncio.to_thread(sds_session.fetch_solution_content, url)
            if raw:
                return _parse_html_content(raw)
            return None

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/130.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
            "Upgrade-Insecure-Requests": "1",
        }

        if "kaas.hpcloud.hp.com" in url and "isFullHTMLRequired" not in url:
            url += ("&" if "?" in url else "?") + "isFullHTMLRequired=true"
        # Content Bootstrapper URLs work without extra auth (JWT is self-contained)

        def do_fetch():
            fetcher = session if session else requests
            return fetcher.get(url, timeout=_FETCH_TIMEOUT, headers=headers, allow_redirects=True)

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, do_fetch)
        response.raise_for_status()

        if "login" in response.url.lower() or "auth" in response.url.lower():
            logging.warning("Fetch for %s redirected to login page. Session might be expired.", url)
            return None

        return _parse_html_content(response.text)
    except Exception as exc:
        logging.warning("Could not fetch solution content from %s: %s", url, exc)
        return None
