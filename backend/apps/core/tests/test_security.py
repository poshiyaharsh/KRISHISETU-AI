import pytest
from django.core.cache import cache
from django.test import Client, RequestFactory

from config.exceptions import custom_500_view


@pytest.mark.django_db
def test_security_headers_and_request_id():
    client = Client()
    response = client.get("/api/health/")
    assert response.status_code == 200
    assert "X-Request-ID" in response
    assert len(response["X-Request-ID"]) >= 16
    assert "Content-Security-Policy" in response
    assert "default-src 'self'" in response["Content-Security-Policy"]
    assert "frame-ancestors 'none'" in response["Content-Security-Policy"]
    assert response["X-Content-Type-Options"] == "nosniff"
    assert response["X-Frame-Options"] == "DENY"
    assert "Permissions-Policy" in response


@pytest.mark.django_db
def test_custom_404_and_500_json_responses():
    client = Client()
    resp_404 = client.get("/api/nonexistent-endpoint-xyz/")
    assert resp_404.status_code == 404
    data_404 = resp_404.json()
    assert data_404["error"]["code"] == "not_found"

    # Admin path moved from /admin/
    resp_admin = client.get("/admin/")
    assert resp_admin.status_code == 404

    factory = RequestFactory()
    resp_500 = custom_500_view(factory.get("/api/broken/"))
    assert resp_500.status_code == 500
    assert b'"server_error"' in resp_500.content


@pytest.mark.django_db
def test_schemes_endpoint_throttling_returns_429():
    cache.clear()
    client = Client()
    hit_429 = False
    for _ in range(65):
        resp = client.get("/api/schemes/")
        if resp.status_code == 429:
            hit_429 = True
            assert resp.json()["error"]["code"] == "throttled"
            break
    assert hit_429, "Expected /api/schemes/ to return 429 after 60/min limit"
    cache.clear()
