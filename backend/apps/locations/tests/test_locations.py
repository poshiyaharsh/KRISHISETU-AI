"""
Tests for locations app: states, districts, seeding, and search.
"""

from unittest.mock import MagicMock, patch
import pytest
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APIClient

from apps.locations.models import District, State


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def seed_locations_data(db):
    call_command("seed_locations")


@pytest.mark.django_db
def test_seed_locations_counts():
    assert State.objects.count() == 31
    assert District.objects.count() == 61

    gujarat = State.objects.get(code="IN-GJ")
    assert gujarat.name == "Gujarat"
    assert gujarat.districts.filter(name="Anand").exists()


@pytest.mark.django_db
def test_states_list_endpoint(api_client):
    response = api_client.get("/api/locations/states/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 31
    assert any(s["code"] == "IN-GJ" for s in data)


@pytest.mark.django_db
def test_districts_filtered_by_state(api_client):
    gujarat = State.objects.get(code="IN-GJ")
    response = api_client.get(f"/api/locations/districts/?state={gujarat.id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 9
    assert all(d["state"] == gujarat.id for d in data)


@pytest.mark.django_db
def test_location_search_short_query_fails(api_client):
    response = api_client.get("/api/locations/search/?q=ab")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "validation_error"


@pytest.mark.django_db
def test_location_search_open_meteo(api_client):
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "results": [
            {
                "id": 1278917,
                "name": "Anand",
                "latitude": 22.5645,
                "longitude": 72.9289,
                "admin1": "Gujarat",
                "country": "India",
            }
        ]
    }

    with patch("requests.get", return_value=mock_resp):
        response = api_client.get("/api/locations/search/?q=anand")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Anand"
        assert data[0]["state"] == "Gujarat"
        assert data[0]["latitude"] == 22.5645
