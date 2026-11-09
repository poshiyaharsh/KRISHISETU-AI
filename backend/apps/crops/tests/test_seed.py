"""
Tests for seed_crops management command idempotency and catalog population.
"""

import pytest
from django.core.management import call_command
from apps.crops.models import Crop


@pytest.mark.django_db
def test_seed_crops_command_idempotency():
    # Run seed once
    call_command("seed_crops")
    count_first = Crop.objects.count()
    assert count_first == 22

    # Verify specific crop attributes
    rice = Crop.objects.get(key="rice")
    assert rice.name_en == "Rice"
    assert rice.category == "cereal"
    assert "nitrogen" in rice.ideal_ranges
    assert rice.is_active is True

    # Run seed again (must not create duplicates)
    call_command("seed_crops")
    count_second = Crop.objects.count()
    assert count_second == 22
