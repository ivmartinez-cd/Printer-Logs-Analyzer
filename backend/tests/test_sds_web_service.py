import time
from unittest.mock import MagicMock, patch

import pytest
from backend.application.services.sds_web_service import (
    SDSWebAuthError,
    SDSWebError,
    SDSWebSession,
    _parse_hp_operations,
    html_to_tsv,
)
from backend.infrastructure.config import Settings


def test_parse_hp_operations_strips_state_link():
    """The state column embeds a "Ver datos en bruto..." link; only the real
    state token must be kept (regression: it polluted last_known_state)."""
    html = """
    <table><tbody>
      <tr><th>Tipo</th><th>Enviado</th><th>Por</th><th>Estado</th><th>Act</th><th>Sol</th></tr>
      <tr>
        <td>RefreshHPCloudDeviceActionCache</td>
        <td>16-jun-2026 16:03:06</td>
        <td>ilmartinez</td>
        <td><a href="/x">Ver datos en bruto del JAMC de HP</a> PartialSuccess</td>
        <td>16-jun-2026 16:05:13</td>
        <td>16-jun-2026 16:13:28</td>
      </tr>
    </tbody></table>
    """
    rows = _parse_hp_operations(html)
    assert len(rows) == 1
    assert rows[0]["operation"] == "RefreshHPCloudDeviceActionCache"
    assert rows[0]["last_known_state"] == "PartialSuccess"
    assert rows[0]["last_state_updated"] == "16-jun-2026 16:05:13"


@pytest.fixture
def settings():
    return Settings(
        SDS_WEB_USERNAME="testuser", SDS_WEB_PASSWORD="testpassword", DB_URL="postgresql://test"
    )


@pytest.fixture
def sds_session(settings):
    return SDSWebSession(settings)


def test_html_to_tsv_basic():
    """Test that html_to_tsv extracts table rows correctly from EKM AJAX response."""
    raw_html = """
    <ekm-ajax-response>
        <content><![CDATA[
            <table class="data">
                <thead><tr><th>Col1</th><th>Col2</th><th>Col3</th><th>Col4</th><th>Col5</th><th>Col6</th></tr></thead>
                <tbody>
                    <tr><td>Info</td><td>34.02.01</td><td>14-abr-2026</td><td>42492</td><td>FW_123</td><td>Help link</td></tr>
                    <tr><td>Warning</td><td>10.00.00</td><td>13-abr-2026</td><td>42000</td><td>FW_123</td><td></td></tr>
                </tbody>
            </table>
        ]]></content>
    </ekm-ajax-response>
    """
    tsv = html_to_tsv(raw_html)
    lines = tsv.splitlines()
    assert len(lines) == 3  # Header + 2 rows
    assert "34.02.01" in lines[1]
    assert "10.00.00" in lines[2]
    assert "\t" in lines[1]


def test_html_to_tsv_empty():
    """Test that html_to_tsv returns empty string when no table is found."""
    raw_html = (
        "<ekm-ajax-response><content><![CDATA[<div>No data</div>]]></content></ekm-ajax-response>"
    )
    assert html_to_tsv(raw_html) == ""


@patch("requests.Session")
def test_login_success(mock_session_cls, sds_session):
    """Test successful login flow."""
    mock_sess = mock_session_cls.return_value
    # Initial login page call
    mock_sess.get.return_value = MagicMock(status_code=200)
    # Login POST call
    mock_sess.post.return_value = MagicMock(status_code=200, url="https://.../dashboard")

    sds_session._login()

    assert sds_session.session is not None
    assert sds_session.last_login > 0
    assert mock_sess.post.called


@patch("requests.Session")
def test_login_failure(mock_session_cls, sds_session):
    """Test failed login due to invalid credentials."""
    mock_sess = mock_session_cls.return_value
    mock_sess.get.return_value = MagicMock(status_code=200)
    # Redirect back to login means failure
    mock_sess.post.return_value = MagicMock(status_code=200, url="https://.../login?error=1")

    with pytest.raises(SDSWebAuthError):
        sds_session._login()
    assert sds_session.session is None


@patch("requests.Session")
def test_search_device_redirect(mock_session_cls, sds_session):
    """Test device search that redirects directly to the device page."""
    sds_session.session = mock_session_cls.return_value
    sds_session.last_login = time.monotonic()

    mock_sess = sds_session.session
    mock_sess.get.return_value = MagicMock(status_code=200, url="https://.../devices/123456")

    device_info = sds_session.search_device("SERIAL123")
    assert device_info["id"] == "123456"
    assert "/search" in mock_sess.get.call_args[0][0]


@patch("requests.Session")
def test_search_device_list(mock_session_cls, sds_session):
    """Test device search that returns a list of devices (extracting from HTML)."""
    sds_session.session = mock_session_cls.return_value
    sds_session.last_login = time.monotonic()

    mock_sess = sds_session.session
    mock_sess.get.return_value = MagicMock(
        status_code=200,
        url="https://.../search?q=SERIAL",
        text='<a href="/PortalWeb/devices/998877">Device Name</a>',
    )

    device_info = sds_session.search_device("SERIAL")
    assert device_info["id"] == "998877"


@patch("requests.Session")
def test_fetch_kaas_content_direct_success(mock_session_cls, sds_session):
    """Direct KaaS fetch succeeds (SSO cookies work cross-domain)."""
    sds_session.session = mock_session_cls.return_value
    sds_session.last_login = time.monotonic()

    mock_sess = sds_session.session
    mock_sess.get.return_value = MagicMock(
        status_code=200,
        url="https://kaas.hpcloud.hp.com/PROD/v2/render/TOKEN/ish_111-222-3",
        text="<html><body>Solution content here</body></html>",
    )

    result = sds_session.fetch_kaas_content(
        "https://kaas.hpcloud.hp.com/PROD/v2/render/TOKEN/ish_111-222-3"
    )
    assert result is not None
    assert "Solution content" in result


@patch("requests.Session")
def test_fetch_kaas_content_no_article_id(mock_session_cls, sds_session):
    """Returns None when URL has no ish_ article ID."""
    sds_session.session = mock_session_cls.return_value
    sds_session.last_login = time.monotonic()

    result = sds_session.fetch_kaas_content("https://kaas.hpcloud.hp.com/PROD/v2/render/TOKEN/")
    assert result is None


@patch("requests.Session")
def test_fetch_solution_content_bootstrapper(mock_session_cls, sds_session):
    """Content Bootstrapper URL (JWT in path) fetched directly without extra auth."""
    sds_session.session = mock_session_cls.return_value
    sds_session.last_login = time.monotonic()

    bootstrapper_url = (
        "https://api-sds-contentbootstrapper-prod.sds.hp8.us:443/v1/eyJhbGci.payload.sig"
    )
    html_content = "<html><body>Article content via bootstrapper</body></html>"

    sds_session.session.get.return_value = MagicMock(
        status_code=200, url=bootstrapper_url, text=html_content
    )

    result = sds_session.fetch_solution_content(bootstrapper_url)
    assert result == html_content


@patch("requests.Session")
def test_fetch_kaas_content_expired_returns_none(mock_session_cls, sds_session):
    """Expired KaaS URL (401) returns None — no portal fallback in new flow."""
    sds_session.session = mock_session_cls.return_value
    sds_session.last_login = time.monotonic()

    sds_session.session.get.return_value = MagicMock(
        status_code=401, url="https://kaas.hpcloud.hp.com/PROD/v2/render/EXPIRED/ish_111-222-3"
    )

    result = sds_session.fetch_kaas_content(
        "https://kaas.hpcloud.hp.com/PROD/v2/render/EXPIRED/ish_111-222-3"
    )
    assert result is None


@patch("requests.Session")
def test_fetch_remote_ews_url_success(mock_session_cls, sds_session):
    """Extracts the remote EWS launch link from the hpsmart/ews AJAX response."""
    sds_session.session = mock_session_cls.return_value
    sds_session.last_login = time.monotonic()

    raw_xml = """
    <ekm-ajax-response reload="false">
        <content><![CDATA[
            <div id="remoteEWSLaunchLink">
                <p><a href="https://ews.hpjamservices.com/connection/TOKEN" target="_blank">Iniciar conexion</a></p>
            </div>
        ]]></content>
    </ekm-ajax-response>
    """
    sds_session.session.get.return_value = MagicMock(status_code=200, text=raw_xml)

    url = sds_session.fetch_remote_ews_url("239877")
    assert url == "https://ews.hpjamservices.com/connection/TOKEN"


@patch("requests.Session")
def test_fetch_remote_ews_url_missing_link(mock_session_cls, sds_session):
    """Returns None when the portal response has no remote EWS link."""
    sds_session.session = mock_session_cls.return_value
    sds_session.last_login = time.monotonic()

    raw_xml = '<ekm-ajax-response><content><![CDATA[<div>No disponible</div>]]></content></ekm-ajax-response>'
    sds_session.session.get.return_value = MagicMock(status_code=200, text=raw_xml)

    assert sds_session.fetch_remote_ews_url("239877") is None


@patch("requests.Session")
def test_fetch_remote_ews_url_error_status(mock_session_cls, sds_session):
    """Raises SDSWebError when the portal returns a non-200 status."""
    sds_session.session = mock_session_cls.return_value
    sds_session.last_login = time.monotonic()

    sds_session.session.get.return_value = MagicMock(status_code=500, text="error")

    with pytest.raises(SDSWebError):
        sds_session.fetch_remote_ews_url("239877")


def test_ensure_session_lazy_login(sds_session):
    """Test that ensure_session triggers login only when needed."""
    with patch.object(sds_session, "_login") as mock_login:
        # Case 1: Session is None
        sds_session.session = None
        sds_session._ensure_session()
        mock_login.assert_called_once()

        # Case 2: Session is valid and fresh
        mock_login.reset_mock()
        sds_session.session = MagicMock()
        sds_session.last_login = time.monotonic()
        sds_session._ensure_session()
        mock_login.assert_not_called()

        # Case 3: Session is expired
        mock_login.reset_mock()
        sds_session.last_login = time.monotonic() - (sds_session.session_ttl + 1)
        sds_session._ensure_session()
        mock_login.assert_called_once()
