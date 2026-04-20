"""Inspect what URLs are in the Ayuda column of the event logs HTML."""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.infrastructure.config import get_settings
from backend.application.services.sds_web_service import get_session
from lxml import html as lhtml

DEVICE_ID = "142699"  # El device que ya tenés conectado

def main():
    settings = get_settings()
    sds = get_session(settings)

    print("Logging in...")
    raw_html = sds.fetch_event_logs_html(DEVICE_ID, days=30)
    print(f"Got {len(raw_html)} bytes of HTML\n")

    # Extract CDATA content
    from lxml import etree
    try:
        root = etree.fromstring(raw_html.encode("utf-8"))
        content_node = root.find("content")
        html_content = content_node.text if content_node is not None else raw_html
    except Exception:
        import re as re2
        cdatas = re2.findall(r"<!\[CDATA\[(.*?)\]\]>", raw_html, re2.DOTALL)
        html_content = max(cdatas, key=len) if cdatas else raw_html

    tree = lhtml.fromstring(html_content)

    # Find the Ayuda column (6th td) and extract both text and href
    print("=== AYUDA COLUMN CONTENT (first 10 rows) ===")
    rows = tree.xpath("//tbody/tr")
    for i, tr in enumerate(rows[:10]):
        tds = tr.xpath("./td")
        if len(tds) >= 6:
            ayuda_td = tds[5]
            text = ayuda_td.text_content().strip()
            links = ayuda_td.xpath(".//a/@href")
            print(f"Row {i+1}:")
            print(f"  text: {text!r}")
            print(f"  hrefs: {links}")

    # Also check if kaas URLs appear anywhere in the HTML
    kaas_urls = re.findall(r"https://kaas\.hpcloud\.hp\.com/[^\s\"'<>]+", html_content)
    print(f"\n=== KAAS URLS FOUND IN HTML: {len(kaas_urls)} ===")
    for u in kaas_urls[:5]:
        print(" ", u[:120])

    # Check for any ish_ references
    ish_refs = re.findall(r"ish_[\d-]+", html_content)
    print(f"\n=== ISH REFERENCES: {len(set(ish_refs))} unique ===")
    for ref in list(set(ish_refs))[:10]:
        print(" ", ref)

    # Show session cookies to understand what domains they apply to
    print("\n=== SESSION COOKIES ===")
    for cookie in sds.session.cookies:
        print(f"  {cookie.name}={cookie.value[:20]}... domain={cookie.domain}")

if __name__ == "__main__":
    main()
