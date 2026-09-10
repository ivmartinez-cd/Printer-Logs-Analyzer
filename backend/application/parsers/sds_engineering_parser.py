"""Parsers puros (sin red) para la cola de incidentes de ingeniería del portal HP SDS.

Fuente verificada en vivo (sesión de diseño, sep-2026):
  - Listado: GET /PortalWeb/sds/alerts/engineering
  - Detalle: GET /PortalWeb/devices/{device_id}/hpsmart/actionevents/{incident_id}

El listado se parsea con un índice de columnas derivado del <thead> (con fallback
posicional si los headers no matchean). El detalle se parsea SIEMPRE por etiqueta
(<th>/<td>), nunca por posición: las filas presentes varían según el tipo de caso
(un Predictive trae Probabilidad/Plazo/Mediana, un ExpertRules no).
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from datetime import datetime

from lxml import html

_logger = logging.getLogger(__name__)

# Orden de columnas de respaldo si el <thead> no se puede leer (el orden verificado
# en vivo el 2026-09-10 contra hp-sds-latam.insightportal.net).
_FALLBACK_COLUMNS = [
    "cliente",
    "monitor",
    "dispositivo",
    "modelo",
    "firmware",
    "estado",
    "gravedad",
    "tipo",
    "codigo",
    "probabilidad",
    "plazo",
    "mediana",
    "creado",
    "actualizado",
    "seleccionar",
]

_HEADER_TO_COLUMN = {
    "cliente": "cliente",
    "monitor": "monitor",
    "dispositivo": "dispositivo",
    "modelo hp": "modelo",
    "modelo": "modelo",
    "version del firmware": "firmware",
    "estado": "estado",
    "gravedad": "gravedad",
    "tipo": "tipo",
    "codigo": "codigo",
    "probabilidad": "probabilidad",
    "plazo en dias": "plazo",
    "mediana de dias hasta el fallo": "mediana",
    "creado": "creado",
    "ultima actualizacion": "actualizado",
    "seleccionar": "seleccionar",
}


def _norm_label(s: str | None) -> str:
    """minúsculas, sin acentos ni puntuación, espacios colapsados — para matchear labels."""
    if not s:
        return ""
    s = s.strip().lower()
    s = (
        s.replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ñ", "n")
    )
    s = re.sub(r"[^a-z0-9 ]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _parse_percent(s: str | None) -> int | None:
    if not s:
        return None
    m = re.search(r"(\d+)", s)
    return int(m.group(1)) if m else None


def _parse_int(s: str | None) -> int | None:
    if not s:
        return None
    m = re.search(r"(\d+)", s)
    return int(m.group(1)) if m else None


def _parse_iso(s: str | None) -> datetime | None:
    """Parsea el atributo data-sort-value (ISO 8601 UTC). NUNCA el texto es-AR."""
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        _logger.warning("No se pudo parsear fecha ISO de data-sort-value: %s", s)
        return None


@dataclass
class EngineeringCaseRow:
    """Una fila del listado de /sds/alerts/engineering."""

    device_id: str
    incident_id: str
    serial: str
    customer_id: str | None = None
    customer_name: str | None = None
    contract_id: str | None = None
    monitor_name: str | None = None
    model: str | None = None
    firmware: str | None = None
    state: str = "New"
    severity: str | None = None
    case_type: str | None = None
    code: str = ""
    probability: int | None = None
    lead_days: int | None = None
    median_days_to_failure: int | None = None
    created_at_portal: datetime | None = None
    updated_at_portal: datetime | None = None


@dataclass
class EngineeringCaseDetail:
    """El diálogo de detalle de un caso (actionevents/{id})."""

    hp_action_id: str | None = None
    state: str | None = None
    available_states: list[str] = field(default_factory=list)
    case_type: str | None = None
    code: str | None = None
    severity: str | None = None
    description: str | None = None
    more_info_url: str | None = None
    more_info_text: str | None = None
    related_event_codes: list[str] = field(default_factory=list)
    probability: int | None = None
    lead_days: int | None = None
    median_days_to_failure: int | None = None
    parts: list[dict] = field(default_factory=list)
    total_impressions: str | None = None
    firmware: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    state_history: list[dict] = field(default_factory=list)
    csrf_token: str | None = None
    edit_action_url: str | None = None

    def to_dict(self) -> dict:
        d = {
            "hp_action_id": self.hp_action_id,
            "state": self.state,
            "available_states": self.available_states,
            "case_type": self.case_type,
            "code": self.code,
            "severity": self.severity,
            "description": self.description,
            "more_info_url": self.more_info_url,
            "more_info_text": self.more_info_text,
            "related_event_codes": self.related_event_codes,
            "probability": self.probability,
            "lead_days": self.lead_days,
            "median_days_to_failure": self.median_days_to_failure,
            "parts": self.parts,
            "total_impressions": self.total_impressions,
            "firmware": self.firmware,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "state_history": self.state_history,
        }
        return d


def _build_column_index(table) -> dict[str, int]:
    """Índice columna-lógica -> posición, derivado del <thead>. Fallback posicional."""
    headers = table.xpath(".//thead//th")
    if headers:
        index: dict[str, int] = {}
        for pos, th in enumerate(headers):
            label = _norm_label(th.text_content())
            col = _HEADER_TO_COLUMN.get(label)
            if col:
                index[col] = pos
        if len(index) >= len(_FALLBACK_COLUMNS) - 2:  # tolerar 1-2 columnas no mapeadas
            return index
        _logger.warning(
            "Encabezados de la tabla de incidentes de ingeniería no matchean del todo "
            "(%d/%d) — usando índice posicional de respaldo.",
            len(index),
            len(_FALLBACK_COLUMNS),
        )
    return {col: pos for pos, col in enumerate(_FALLBACK_COLUMNS)}


def parse_advisories_list(html_text: str) -> list[EngineeringCaseRow]:
    """Parsea la tabla `engineering-advisories-list` completa (HTML de página, no AJAX)."""
    rows: list[EngineeringCaseRow] = []
    try:
        tree = html.fromstring(html_text)
    except Exception as e:
        _logger.error("HTML de incidentes de ingeniería ilegible: %s", e)
        return rows

    tables = tree.xpath('//table[contains(@class,"engineering-advisories-list")]')
    if not tables:
        tables = tree.xpath('//table[contains(@class,"data") and contains(@class,"entity-list")]')
    if not tables:
        return rows

    table = tables[0]
    col = _build_column_index(table)

    def _cell(tds_: list, name: str):
        pos = col.get(name)
        return tds_[pos] if pos is not None and pos < len(tds_) else None

    for tr in table.xpath(".//tbody/tr"):
        tds = tr.xpath("./td")
        if not tds:
            continue

        def cell(name: str, _tds=tds):
            return _cell(_tds, name)

        device_cell = cell("dispositivo")
        if device_cell is None:
            continue
        device_links = device_cell.xpath(".//a")
        device_id = device_links[0].get("data-entity-id") if device_links else None
        serial = (device_links[0].text_content().strip() if device_links else device_cell.text_content().strip())

        incident_id = tr.get("data-entity-id")
        if not incident_id:
            checkbox = tr.xpath('.//input[@name="a"]/@value')
            if checkbox and "#" in checkbox[0]:
                _, incident_id = checkbox[0].split("#", 1)
        if not device_id:
            checkbox = tr.xpath('.//input[@name="a"]/@value')
            if checkbox and "#" in checkbox[0]:
                device_id, _ = checkbox[0].split("#", 1)

        if not device_id or not incident_id:
            continue

        customer_cell = cell("cliente")
        customer_links = customer_cell.xpath(".//a") if customer_cell is not None else []
        customer_id = customer_links[0].get("data-entity-id") if customer_links else None
        customer_name = customer_links[0].text_content().strip() if customer_links else (
            customer_cell.text_content().strip() if customer_cell is not None else None
        )

        monitor_cell = cell("monitor")
        monitor_links = monitor_cell.xpath(".//a") if monitor_cell is not None else []
        contract_id = monitor_links[0].get("data-entity-id") if monitor_links else None
        monitor_name = monitor_links[0].text_content().strip() if monitor_links else (
            monitor_cell.text_content().strip() if monitor_cell is not None else None
        )

        def text(name: str) -> str | None:
            c = cell(name)
            if c is None:
                return None
            t = " ".join(c.text_content().split())
            return t or None

        created_cell = cell("creado")
        updated_cell = cell("actualizado")

        rows.append(
            EngineeringCaseRow(
                device_id=device_id,
                incident_id=incident_id,
                serial=serial,
                customer_id=customer_id,
                customer_name=customer_name,
                contract_id=contract_id,
                monitor_name=monitor_name,
                model=text("modelo"),
                firmware=text("firmware"),
                state=text("estado") or "New",
                severity=text("gravedad"),
                case_type=text("tipo"),
                code=text("codigo") or "",
                probability=_parse_percent(text("probabilidad")),
                lead_days=_parse_int(text("plazo")),
                median_days_to_failure=_parse_int(text("mediana")),
                created_at_portal=_parse_iso(
                    created_cell.get("data-sort-value") if created_cell is not None else None
                ),
                updated_at_portal=_parse_iso(
                    updated_cell.get("data-sort-value") if updated_cell is not None else None
                ),
            )
        )

    return rows


# Etiquetas del detalle -> campo. Normalizadas (sin acentos/puntuación) antes de matchear.
_DETAIL_LABELS = {
    "id de accion de hp": "hp_action_id",
    "estado actual": "state",
    "tipo": "case_type",
    "codigo": "code",
    "gravedad": "severity",
    "descripcion": "description",
    "mas informacion": "more_info",
    "probabilidad": "probability",
    "plazo en dias": "lead_days",
    "mediana de dias hasta el fallo": "median_days_to_failure",
    "piezas": "parts",
    "n de total de impresiones": "total_impressions",
    "n total de impresiones": "total_impressions",
    "version del firmware": "firmware",
    "creado": "created_at",
    "ultima actualizacion": "updated_at",
    "historial de estados": "state_history",
}

_PART_RE = re.compile(r"^\s*([A-Za-z0-9][A-Za-z0-9\-]*)\s*;\s*(.+?)\s*$")


def _parse_parts(td) -> list[dict]:
    parts = []
    for li in td.xpath(".//li"):
        text = " ".join(li.text_content().split())
        m = _PART_RE.match(text)
        if m:
            parts.append({"pn": m.group(1), "description": m.group(2)})
        elif text:
            parts.append({"pn": text, "description": ""})
    return parts


def _parse_state_history(td) -> list[dict]:
    out = []
    inner_rows = td.xpath('.//table[@id="sdsActionEventHistory"]//tr')
    for tr in inner_rows[1:] if inner_rows else []:  # primera fila = encabezados
        tds = tr.xpath("./td")
        if len(tds) < 3:
            continue
        out.append(
            {
                "date": " ".join(tds[0].text_content().split()),
                "state": " ".join(tds[1].text_content().split()),
                "user": " ".join(tds[2].text_content().split()) or None,
                "comment": " ".join(tds[3].text_content().split()) if len(tds) > 3 else None,
            }
        )
    return out


_NUMERIC_CODE_RE = re.compile(r"\b\d{1,3}\.[0-9A-Za-z]{2}\.[0-9A-Za-z]{2}\b")


def _extract_numeric_codes(text: str | None) -> list[str]:
    """Best-effort: códigos numéricos de evento HP (ej. '13.B9.Az') mencionados en el
    texto del link 'Más información'. Algunos casos (numéricos, del log directo) los
    traen; los casos de triage (alfabéticos) normalmente no — está OK que venga vacío,
    el cruce con logs igual lo hace la IA por semántica del código/descripción."""
    if not text:
        return []
    return sorted(set(_NUMERIC_CODE_RE.findall(text)))


def parse_action_event_detail(raw_xml_html: str) -> EngineeringCaseDetail:
    """Parsea el diálogo de detalle. Desenvuelve el wrapper XML/CDATA de EKM si aplica."""
    from backend.application.services.sds_web_service import _get_html_content

    html_content = _get_html_content(raw_xml_html)
    detail = EngineeringCaseDetail()
    try:
        tree = html.fromstring(html_content)
    except Exception as e:
        _logger.error("HTML de detalle de incidente de ingeniería ilegible: %s", e)
        return detail

    for tr in tree.xpath('//table[contains(@class,"data")]/tbody/tr'):
        th = tr.xpath("./th")
        td = tr.xpath("./td")
        if not th or not td:
            continue
        label = _norm_label(th[0].text_content())
        field_name = _DETAIL_LABELS.get(label)
        if not field_name:
            continue
        cell = td[0]

        if field_name == "state":
            select = cell.xpath(".//select")
            if select:
                opts = select[0].xpath(".//option")
                detail.available_states = [o.get("value") for o in opts if o.get("value")]
                selected = select[0].xpath('.//option[@selected]/@value')
                detail.state = selected[0] if selected else (opts[0].get("value") if opts else None)
            else:
                detail.state = " ".join(cell.text_content().split()) or None
        elif field_name == "more_info":
            links = cell.xpath(".//a")
            if links:
                detail.more_info_url = links[0].get("href")
                detail.more_info_text = " ".join(links[0].text_content().split()) or None
                detail.related_event_codes = _extract_numeric_codes(detail.more_info_text)
        elif field_name == "parts":
            detail.parts = _parse_parts(cell)
        elif field_name == "state_history":
            detail.state_history = _parse_state_history(cell)
        elif field_name == "probability":
            detail.probability = _parse_percent(cell.text_content())
        elif field_name in ("lead_days", "median_days_to_failure"):
            setattr(detail, field_name, _parse_int(cell.text_content()))
        elif field_name in ("created_at", "updated_at"):
            # El detalle no trae data-sort-value; el texto es-AR se guarda tal cual en
            # el listado (created_at_portal / updated_at_portal), acá solo se usa como
            # referencia textual si hiciera falta mostrarlo — no se parsea a datetime.
            pass
        else:
            text = " ".join(cell.text_content().split()) or None
            setattr(detail, field_name, text)

    # csrf token + acción del form de edición (Fase 2 — solo se deja parseado)
    forms = tree.xpath('//form[contains(@action, "/edit")]')
    if forms:
        detail.edit_action_url = forms[0].get("action")
        tokens = forms[0].xpath('.//input[@name="__csrftoken"]/@value')
        detail.csrf_token = tokens[0] if tokens else None

    return detail
