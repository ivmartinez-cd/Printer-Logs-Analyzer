"""Safe HTTP fetching with SSRF prevention and HTML sanitization."""

from __future__ import annotations

import ipaddress
import logging
from urllib.parse import urlparse as _urlparse

from fastapi import HTTPException

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
        raise HTTPException(status_code=422, detail="URL mal formada.")

    if scheme != "https":
        raise HTTPException(status_code=422, detail="Solo se permiten URLs con scheme https://.")

    if not hostname:
        raise HTTPException(status_code=422, detail="URL mal formada: sin hostname.")

    try:
        addr = ipaddress.ip_address(hostname)
        if any(addr in net for net in _PRIVATE_NETWORKS):
            raise HTTPException(status_code=422, detail="La URL apunta a una dirección IP privada o reservada.")
    except ValueError:
        pass  # hostname is a domain name — not an IP literal


async def fetch_solution_content(url: str) -> str | None:
    """Fetch the text content of a solution page. Returns None on any error."""
    try:
        import bleach
        import httpx
        from bs4 import BeautifulSoup

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=_FETCH_TIMEOUT, follow_redirects=True, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "noscript", "head", "nav", "footer"]):
            tag.decompose()
        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines()]
        cleaned = "\n".join(line for line in lines if line)
        sanitized = bleach.clean(cleaned, tags=[], attributes={}, strip=True)
        return sanitized[:50_000]
    except Exception as exc:
        logging.warning("Could not fetch solution content from %s: %s", url, exc)
        return None
