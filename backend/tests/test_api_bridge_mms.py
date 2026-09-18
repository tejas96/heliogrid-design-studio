"""API bridge regressions for MMS-related external data endpoints."""

import os

import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")


@pytest.fixture(scope="session")
def base_url() -> str:
    """Public preview base URL used by frontend and user flows."""
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL is not set")
    return BASE_URL.rstrip("/")


@pytest.fixture(scope="session")
def api_client() -> requests.Session:
    """Shared HTTP client for preview API checks."""
    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    return session


def test_pvgis_status_ok(base_url: str, api_client: requests.Session) -> None:
    """PVGIS endpoint should return HTTP200 and status ok."""
    res = api_client.get(f"{base_url}/api/pvgis", params={"lat": 12.9716, "lng": 77.5946}, timeout=60)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert data.get("status") == "ok"
    assert isinstance(data.get("weather"), dict)
    assert isinstance(data["weather"].get("monthlyGhi"), list)


def test_pvgis_tmy_status_ok(base_url: str, api_client: requests.Session) -> None:
    """PVGIS TMY endpoint should return HTTP200 and status ok."""
    res = api_client.get(f"{base_url}/api/pvgis/tmy", params={"lat": 12.9716, "lng": 77.5946}, timeout=60)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert data.get("status") == "ok"
    assert isinstance(data.get("tmy"), dict)
    assert isinstance(data["tmy"].get("ghi"), list)


def test_solar_data_layers_honest_error_not_502(base_url: str, api_client: requests.Session) -> None:
    """Google Solar optional flow should not return ingress 502 and should return JSON status."""
    res = api_client.get(f"{base_url}/api/solar/data-layers", params={"lat": 12.9716, "lng": 77.5946}, timeout=60)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "status" in data
    assert data.get("status") in {"ok", "error"}
