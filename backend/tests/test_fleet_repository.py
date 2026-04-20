"""Tests for FleetRepository."""

import pytest
from backend.infrastructure.repositories.fleet_repository import FleetRepository


@pytest.fixture
def repo() -> FleetRepository:
    return FleetRepository()


def test_list_clients_returns_dia(repo: FleetRepository) -> None:
    clients = repo.list_clients()
    assert len(clients) >= 1
    ids = [c["id"] for c in clients]
    assert "dia-central" in ids


def test_list_clients_has_device_count(repo: FleetRepository) -> None:
    clients = repo.list_clients()
    for c in clients:
        assert "device_count" in c
        assert isinstance(c["device_count"], int)
        assert c["device_count"] > 0


def test_get_client_dia(repo: FleetRepository) -> None:
    client = repo.get_client("dia-central")
    assert client is not None
    assert client["id"] == "dia-central"
    assert len(client["devices"]) > 0


def test_get_client_missing(repo: FleetRepository) -> None:
    assert repo.get_client("nonexistent-xyz") is None


def test_get_devices_returns_entries(repo: FleetRepository) -> None:
    devices = repo.get_devices("dia-central")
    assert len(devices) > 0
    for d in devices:
        assert "serial" in d
        assert "location" in d


def test_get_devices_missing_client(repo: FleetRepository) -> None:
    assert repo.get_devices("nonexistent-xyz") == []


def test_devices_have_serial_and_location(repo: FleetRepository) -> None:
    devices = repo.get_devices("dia-central")
    for d in devices:
        assert d["serial"]
        assert d["location"]
