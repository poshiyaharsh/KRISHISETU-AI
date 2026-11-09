"""
Tests for weather forecasting: Open-Meteo service, WMO condition mapping, caching, and stale fallback.
"""

from unittest.mock import MagicMock, patch
import pytest
from django.core.cache import cache
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APIClient

from apps.locations.models import District
from apps.weather.schemas import WeatherForecast, map_wmo_code_to_condition
from apps.weather.services import WeatherServiceError, parse_open_meteo_response

SAMPLE_OPEN_METEO_JSON = {
    "latitude": 22.56,
    "longitude": 72.93,
    "timezone": "Asia/Kolkata",
    "current": {
        "temperature_2m": 28.5,
        "relative_humidity_2m": 65.0,
        "wind_speed_10m": 12.0,
        "precipitation": 0.0,
        "weather_code": 1,
    },
    "daily": {
        "time": [
            "2026-11-09",
            "2026-11-10",
            "2026-11-11",
            "2026-11-12",
            "2026-11-13",
            "2026-11-14",
            "2026-11-15",
        ],
        "temperature_2m_max": [32.0, 31.5, 30.0, 32.5, 33.0, 32.8, 31.0],
        "temperature_2m_min": [18.0, 18.5, 17.5, 19.0, 19.5, 18.0, 17.0],
        "precipitation_sum": [0.0, 0.0, 12.5, 2.0, 0.0, 0.0, 0.0],
        "precipitation_probability_max": [0, 10, 80, 40, 5, 0, 0],
        "wind_speed_10m_max": [15.0, 14.0, 22.0, 18.0, 12.0, 11.0, 13.0],
        "weather_code": [1, 2, 61, 80, 0, 1, 0],
        "et0_fao_evapotranspiration": [4.2, 4.0, 3.1, 3.8, 4.5, 4.3, 4.1],
    },
}


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def setup_data(db):
    cache.clear()
    call_command("seed_locations")


def test_wmo_code_mapping():
    assert map_wmo_code_to_condition(0) == "clear"
    assert map_wmo_code_to_condition(1) == "mainly_clear"
    assert map_wmo_code_to_condition(61) == "rain"
    assert map_wmo_code_to_condition(81) == "heavy_rain"
    assert map_wmo_code_to_condition(95) == "thunderstorm"
    assert map_wmo_code_to_condition(999) == "unknown"


def test_parse_open_meteo_response():
    forecast = parse_open_meteo_response(SAMPLE_OPEN_METEO_JSON, 22.56, 72.93)
    assert isinstance(forecast, WeatherForecast)
    assert forecast.current.temperature == 28.5
    assert forecast.current.condition == "mainly_clear"
    assert len(forecast.daily) == 7
    assert forecast.daily[2].precipitation_sum == 12.5
    assert forecast.daily[2].condition == "rain"
    assert forecast.stale is False


@pytest.mark.django_db
def test_weather_endpoint_by_district(api_client):
    district = District.objects.get(name="Anand")

    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = SAMPLE_OPEN_METEO_JSON

    with patch("requests.get", return_value=mock_resp):
        response = api_client.get(f"/api/weather/?district={district.id}")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert "current" in data
        assert "daily" in data
        assert len(data["daily"]) == 7
        assert data["stale"] is False
        assert data["provider"] == "Open-Meteo"
        assert "attribution" in data


@pytest.mark.django_db
def test_weather_caching_within_ttl(api_client):
    district = District.objects.get(name="Anand")

    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = SAMPLE_OPEN_METEO_JSON

    with patch("requests.get", return_value=mock_resp) as mock_get:
        # First request hits Open-Meteo
        resp1 = api_client.get(f"/api/weather/?district={district.id}")
        assert resp1.status_code == status.HTTP_200_OK
        assert mock_get.call_count == 1

        # Second request must be served from cache
        resp2 = api_client.get(f"/api/weather/?district={district.id}")
        assert resp2.status_code == status.HTTP_200_OK
        assert mock_get.call_count == 1  # Not called again


@pytest.mark.django_db
def test_weather_stale_fallback_on_provider_error(api_client):
    district = District.objects.get(name="Anand")

    # Prime the stale cache
    cache_key = f"weather:{round(district.lat, 2)}:{round(district.lon, 2)}"
    stale_key = f"{cache_key}:stale_backup"
    mock_data = parse_open_meteo_response(
        SAMPLE_OPEN_METEO_JSON, district.lat, district.lon
    ).to_dict()
    cache.set(stale_key, mock_data, timeout=3600)

    # Provider now fails
    with patch(
        "apps.weather.views.fetch_forecast_from_provider",
        side_effect=WeatherServiceError("Network timeout"),
    ):
        response = api_client.get(f"/api/weather/?district={district.id}")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["stale"] is True
        assert "current" in data


@pytest.mark.django_db
def test_weather_provider_unavailable_when_no_cache(api_client):
    with patch(
        "apps.weather.views.fetch_forecast_from_provider",
        side_effect=WeatherServiceError("API down"),
    ):
        response = api_client.get("/api/weather/?lat=22.56&lon=72.93")
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "weather_unavailable"


@pytest.mark.django_db
def test_weather_invalid_coordinates(api_client):
    response = api_client.get("/api/weather/?lat=999&lon=72.93")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["error"]["code"] == "validation_error"
