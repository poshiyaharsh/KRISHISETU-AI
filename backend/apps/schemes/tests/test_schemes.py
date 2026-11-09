import pytest
from django.core.management import call_command
from rest_framework.test import APIClient
from apps.schemes.models import Scheme


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seeded_schemes(db):
    call_command("seed_locations")
    call_command("load_schemes")
    return Scheme.objects.all()


@pytest.mark.django_db
def test_load_schemes_idempotency():
    call_command("seed_locations")
    call_command("load_schemes")
    count_1 = Scheme.objects.count()
    assert count_1 >= 10

    call_command("load_schemes")
    count_2 = Scheme.objects.count()
    assert count_1 == count_2


@pytest.mark.django_db
def test_scheme_list_endpoint(api_client, seeded_schemes):
    response = api_client.get("/api/schemes/")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "count" in data
    assert data["count"] >= 10
    first = data["results"][0]
    assert "name" in first
    assert "slug" in first
    assert "official_url" in first
    assert "last_verified_on" in first


@pytest.mark.django_db
def test_scheme_filter_by_level(api_client, seeded_schemes):
    # Central schemes
    resp_central = api_client.get("/api/schemes/?level=central")
    assert resp_central.status_code == 200
    results_central = resp_central.json()["results"]
    assert len(results_central) > 0
    for r in results_central:
        assert r["level"] == "central"

    # State schemes
    resp_state = api_client.get("/api/schemes/?level=state")
    assert resp_state.status_code == 200
    results_state = resp_state.json()["results"]
    assert len(results_state) > 0
    for r in results_state:
        assert r["level"] == "state"


@pytest.mark.django_db
def test_scheme_filter_by_category(api_client, seeded_schemes):
    resp = api_client.get("/api/schemes/?category=credit-loans")
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert len(results) >= 1
    assert any("Kisan Credit Card" in r["name"] for r in results)


@pytest.mark.django_db
def test_scheme_filter_by_state(api_client, seeded_schemes):
    resp = api_client.get("/api/schemes/?state=GJ")
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert len(results) >= 1
    assert any(r["level"] == "state" for r in results)


@pytest.mark.django_db
def test_scheme_search_query(api_client, seeded_schemes):
    resp = api_client.get("/api/schemes/?q=solar")
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert len(results) >= 1
    assert any("KUSUM" in r["name"] for r in results)


@pytest.mark.django_db
def test_scheme_detail_endpoint(api_client, seeded_schemes):
    pmkisan = Scheme.objects.filter(source_id="MYS-PM-KISAN-001").first()
    assert pmkisan is not None

    resp = api_client.get(f"/api/schemes/{pmkisan.slug}/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == pmkisan.name
    assert "₹6,000" in data["benefits"]
    assert data["official_url"] == "https://pmkisan.gov.in/"
    assert "eligibility" in data
    assert "how_to_apply" in data


@pytest.mark.django_db
def test_scheme_detail_not_found(api_client, seeded_schemes):
    resp = api_client.get("/api/schemes/unknown-scheme-slug/")
    assert resp.status_code == 404
    data = resp.json()
    assert data["error"]["code"] == "not_found"


@pytest.mark.django_db
def test_scheme_facets_endpoint(api_client, seeded_schemes):
    resp = api_client.get("/api/schemes/facets/")
    assert resp.status_code == 200
    data = resp.json()
    assert "categories" in data
    assert "levels" in data
    assert "farmer_types" in data
    assert "states" in data
    assert data["total_active_schemes"] >= 10
    assert len(data["categories"]) > 0
    assert any(c["id"] == "central" for c in data["levels"])
