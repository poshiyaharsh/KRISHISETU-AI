import pytest
from django.core.management import call_command
from apps.crops.models import Crop
from apps.nutrition.models import NutritionEntry, NutritionForm


@pytest.mark.django_db
def test_load_nutrition_command_idempotency():
    # Ensure crops exist first
    call_command("seed_crops")
    # First run
    call_command("load_nutrition")
    initial_count = NutritionEntry.objects.count()
    assert initial_count == 31

    # Second run should not duplicate
    call_command("load_nutrition")
    assert NutritionEntry.objects.count() == initial_count


@pytest.mark.django_db
def test_nutrition_non_food_crops():
    call_command("seed_crops")
    call_command("load_nutrition")

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
    call_command("seed_crops")
    call_command("load_nutrition")

    rice_entries = NutritionEntry.objects.filter(crop__key="rice")
    assert rice_entries.count() == 2

    cooked_rice = rice_entries.get(form=NutritionForm.COOKED)
    assert cooked_rice.is_default is True
    assert cooked_rice.is_food is True

    raw_rice = rice_entries.get(form=NutritionForm.RAW)
    assert raw_rice.is_default is False
    assert raw_rice.is_food is True


@pytest.mark.django_db
def test_nutrition_coffee_brewed_form():
    call_command("seed_crops")
    call_command("load_nutrition")

    coffee_entry = NutritionEntry.objects.get(crop__key="coffee")
    assert coffee_entry.form == NutritionForm.BREWED
    assert coffee_entry.is_food is True
    assert coffee_entry.basis == "per_100g"


@pytest.mark.django_db
def test_nutrition_entry_str():
    call_command("seed_crops")
    crop = Crop.objects.get(key="apple")
    entry = NutritionEntry.objects.create(
        crop=crop,
        food_item_name="Apples, raw, with skin",
        form=NutritionForm.RAW,
        basis="per_100g",
        is_food=True,
        is_default=True,
    )
    assert str(entry) == "Apple (raw)"
