"""
Tests for Crop API endpoints: recommendation, catalog, input-ranges, throttling, and error handling.
"""

from unittest.mock import patch
import pytest
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APIClient

from apps.crops.models import PredictionRecord
from config.exceptions import ModelUnavailableError


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def seed_database(db):
    call_command("seed_crops")


@pytest.mark.django_db
def test_recommend_happy_path(api_client):
    payload = {
        "nitrogen": 90.0,
        "phosphorus": 42.0,
        "potassium": 43.0,
        "temperature": 20.8,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.9,
    }

    response = api_client.post("/api/crops/recommend/", payload, format="json")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "request_id" in data
    assert "results" in data
    assert len(data["results"]) == 3
    assert data["results"][0]["rank"] == 1
    assert data["results"][0]["crop"]["key"] == "rice"
    assert data["results"][0]["crop"]["name"] == "Rice"
    assert "score" in data["results"][0]
    assert data["results"][0]["label"] in {
        "strongly_recommended",
        "recommended",
        "conditional",
    }
    assert data["model"]["version"] == "crs-1.0.0"

    # Verify audit record creation
    record = PredictionRecord.objects.first()
    assert record is not None
    assert record.nitrogen == 90.0
    assert record.model_version == "crs-1.0.0"
    assert len(record.results) == 3
    # Check client hash is not an IP address (SHA-256 hex is 64 chars)
    if record.client_hash:
        assert len(record.client_hash) == 64
        assert "." not in record.client_hash
        assert ":" not in record.client_hash


@pytest.mark.django_db
def test_recommend_validation_missing_field(api_client):
    payload = {
        "nitrogen": 90.0,
        # phosphorus missing
        "potassium": 43.0,
        "temperature": 20.8,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.9,
    }

    response = api_client.post("/api/crops/recommend/", payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "validation_error"
    assert "phosphorus" in data["error"]["fields"]
    assert "required" in data["error"]["fields"]["phosphorus"]


@pytest.mark.django_db
def test_recommend_validation_out_of_range(api_client):
    payload = {
        "nitrogen": 90.0,
        "phosphorus": 42.0,
        "potassium": 43.0,
        "temperature": 20.8,
        "humidity": 82.0,
        "ph": 18.0,  # Absolute physiological max is 14.0
        "rainfall": 202.9,
    }

    response = api_client.post("/api/crops/recommend/", payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "validation_error"
    assert "ph" in data["error"]["fields"]
    assert "out_of_range" in data["error"]["fields"]["ph"]


@pytest.mark.django_db
def test_recommend_out_of_training_warning(api_client):
    payload = {
        "nitrogen": 90.0,
        "phosphorus": 42.0,
        "potassium": 43.0,
        "temperature": 52.0,  # Training max is 43.7, absolute max is 60.0
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.9,
    }

    response = api_client.post("/api/crops/recommend/", payload, format="json")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert len(data["warnings"]) > 0
    assert any("temperature" in w for w in data["warnings"])


@pytest.mark.django_db
def test_recommend_503_when_model_missing(api_client):
    with patch(
        "apps.crops.views.recommend", side_effect=ModelUnavailableError("Model missing")
    ):
        payload = {
            "nitrogen": 90.0,
            "phosphorus": 42.0,
            "potassium": 43.0,
            "temperature": 20.8,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 202.9,
        }
        response = api_client.post("/api/crops/recommend/", payload, format="json")
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "service_unavailable"
        assert "Model missing" in data["error"]["message"]


@pytest.mark.django_db
def test_crop_list_endpoint(api_client):
    response = api_client.get("/api/crops/")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert len(data) == 22
    rice_entry = next(c for c in data if c["key"] == "rice")
    assert rice_entry["name"] == "Rice"
    assert rice_entry["category"] == "cereal"


@pytest.mark.django_db
def test_crop_detail_endpoint(api_client):
    response = api_client.get("/api/crops/rice/")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["key"] == "rice"
    assert data["name"] == "Rice"
    assert "ideal_ranges" in data
    assert "nitrogen" in data["ideal_ranges"]


@pytest.mark.django_db
def test_crop_detail_not_found(api_client):
    response = api_client.get("/api/crops/nonexistent_crop/")
    assert response.status_code == status.HTTP_404_NOT_FOUND

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "not_found"


@pytest.mark.django_db
def test_input_ranges_endpoint(api_client):
    response = api_client.get("/api/crops/input-ranges/")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert len(data) == 7
    assert "nitrogen" in data
    assert data["nitrogen"]["min"] == 0.0
    assert data["nitrogen"]["unit"] == "kg/ha"


@pytest.mark.django_db
def test_recommend_throttling_triggers_429(api_client):
    payload = {
        "nitrogen": 90.0,
        "phosphorus": 42.0,
        "potassium": 43.0,
        "temperature": 20.8,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.9,
    }

    # Burst beyond the 30/min scoped throttle
    hit_limit = False
    for _ in range(35):
        resp = api_client.post("/api/crops/recommend/", payload, format="json")
        if resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            hit_limit = True
            err_data = resp.json()
            assert "error" in err_data
            assert err_data["error"]["code"] == "throttled"
            break

    assert hit_limit is True
