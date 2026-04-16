import time
from unittest.mock import MagicMock, patch

import pytest
from backend.application.services.sds_web_service import (
    SDSWebAuthError,
    SDSWebSession,
    html_to_tsv,
)
from backend.infrastructure.config import Settings


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
