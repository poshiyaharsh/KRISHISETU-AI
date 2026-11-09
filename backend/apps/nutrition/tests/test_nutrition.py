import pytest
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APIClient

from apps.nutrition.models import NutritionEntry, NutritionForm


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def setup_nutrition_data(db):
    call_command("seed_crops")
    call_command("load_nutrition")


@pytest.mark.django_db
def test_load_nutrition_command_idempotency():
    initial_count = NutritionEntry.objects.count()
    assert initial_count == 31

    # Second run should not duplicate
    call_command("load_nutrition")
    assert NutritionEntry.objects.count() == initial_count


@pytest.mark.django_db
def test_nutrition_non_food_crops():
    cotton_entry = NutritionEntry.objects.get(crop__key="cotton")
    assert cotton_entry.is_food is False
    assert cotton_entry.form == NutritionForm.NON_FOOD
    assert cotton_entry.energy_kcal is None
    assert cotton_entry.protein_g is None

    jute_entry = NutritionEntry.objects.get(crop__key="jute")
    assert jute_entry.is_food is False
    assert jute_entry.form == NutritionForm.NON_FOOD


@pytest.mark.django_db
def test_nutrition_staple_dual_forms_and_default():
    rice_entries = NutritionEntry.objects.filter(crop__key="rice")
    assert rice_entries.count() == 2

    cooked_rice = rice_entries.get(form=NutritionForm.COOKED)
    assert cooked_rice.is_default is True
    assert cooked_rice.is_food is True
    assert cooked_rice.energy_kcal is not None

    raw_rice = rice_entries.get(form=NutritionForm.RAW)
    assert raw_rice.is_default is False
    assert raw_rice.is_food is True


@pytest.mark.django_db
def test_nutrition_coffee_brewed_form():
    coffee_entry = NutritionEntry.objects.get(crop__key="coffee")
    assert coffee_entry.form == NutritionForm.BREWED
    assert coffee_entry.is_food is True
    assert coffee_entry.basis == "per_100g"


@pytest.mark.django_db
def test_crop_nutrition_endpoint_food_crop(api_client):
    response = api_client.get("/api/crops/rice/nutrition/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["crop_key"] == "rice"
    assert data["food_crop"] is True
    assert data["default_form"] == "cooked"
    assert len(data["entries"]) == 2

    # Verify nutrient and source object presence
    default_entry = next(e for e in data["entries"] if e["is_default"])
    assert "nutrients" in default_entry
    assert default_entry["nutrients"]["energy_kcal"] > 0
    assert default_entry["nutrients"]["protein_g"] > 0
    assert "source" in default_entry
    assert default_entry["source"]["name"] == "USDA FoodData Central"
    assert default_entry["source"]["license"] != ""


@pytest.mark.django_db
def test_crop_nutrition_endpoint_non_food_crop(api_client):
    response = api_client.get("/api/crops/cotton/nutrition/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["crop_key"] == "cotton"
    assert data["food_crop"] is False
    assert data["message"] == "Not a food crop"
    assert data["entries"] == []


@pytest.mark.django_db
def test_crop_nutrition_endpoint_unknown_crop(api_client):
    response = api_client.get("/api/crops/dragonfruit/nutrition/")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "not_found"


@pytest.mark.django_db
def test_nutrition_compare_endpoint_happy_path(api_client):
    response = api_client.get("/api/nutrition/compare/?crops=rice,maize")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert "crops" in data
    assert len(data["crops"]) == 2
    keys = [c["crop_key"] for c in data["crops"]]
    assert "rice" in keys
    assert "maize" in keys

    rice = next(c for c in data["crops"] if c["crop_key"] == "rice")
    assert rice["food_crop"] is True
    assert rice["form"] == "cooked"
    assert rice["nutrients"]["energy_kcal"] is not None


@pytest.mark.django_db
def test_nutrition_compare_endpoint_three_crops(api_client):
    response = api_client.get("/api/nutrition/compare/?crops=apple,banana,watermelon")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["crops"]) == 3


@pytest.mark.django_db
def test_nutrition_compare_endpoint_exceeds_max_limit(api_client):
    response = api_client.get(
        "/api/nutrition/compare/?crops=rice,maize,chickpea,lentil"
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "error" in data


@pytest.mark.django_db
def test_nutrition_compare_endpoint_missing_parameter(api_client):
    response = api_client.get("/api/nutrition/compare/")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "error" in data


@pytest.mark.django_db
def test_nutrition_compare_endpoint_unknown_crop(api_client):
    response = api_client.get("/api/nutrition/compare/?crops=rice,fakecrop")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "not_found"
