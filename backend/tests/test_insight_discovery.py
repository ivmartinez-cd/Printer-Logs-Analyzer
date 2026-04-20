import pytest
from backend.application.services.insight_service import get_devices_by_customer, search_customers


def test_search_customers_mock():
    # Test that the mock kicks in for "DIA" when using dev keys
    results = search_customers("http://localhost", "dev", "dev", "DIA")
    assert len(results) == 1
    assert results[0]["customerId"] == 9999
    assert "DIA" in results[0]["customerName"]


def test_search_customers_empty():
    results = search_customers("http://localhost", "dev", "dev", "Unknown")
    assert len(results) == 0


def test_get_devices_by_customer_mock():
    # Test that the mock returns non-uniform data (not 10 and 10)
    devices = get_devices_by_customer("http://localhost", "dev", "dev", 9999)
    assert len(devices) > 20

    # Check the updated 1083 fleet distribution (700 MFP, 383 Managed)
    mfp_count = sum(
        1 for d in devices if d["extendedFields"]["model"] == "LaserJet Managed MFP E62655dn"
    )
    managed_count = sum(
        1 for d in devices if d["extendedFields"]["model"] == "LaserJet Managed E60175dn"
    )

    assert mfp_count == 700
    assert managed_count == 383


def test_get_devices_by_customer_empty():
    devices = get_devices_by_customer("http://localhost", "dev", "dev", 123)
    assert len(devices) == 0
