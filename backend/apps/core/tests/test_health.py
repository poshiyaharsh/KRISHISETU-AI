from datetime import datetime

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_health_check_endpoint():
    client = APIClient()
    response = client.get("/api/health/")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "krishisetu-api"
    assert data["version"] == "0.1.0"
    assert "time" in data

    # Verify ISO timestamp parsing
    parsed_time = datetime.fromisoformat(data["time"])
    assert parsed_time is not None
