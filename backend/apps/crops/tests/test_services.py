"""
Tests for ML service wrapper layer in Django backend.
"""

from unittest.mock import patch
import pytest

from apps.crops.services import input_ranges, recommend, supported_crops
from config.exceptions import ModelUnavailableError


@pytest.mark.django_db
def test_supported_crops():
    crops = supported_crops()
    assert len(crops) == 22
    assert "rice" in crops
    assert "wheat" not in crops  # Not in 22 classes
    assert crops == sorted(crops)


@pytest.mark.django_db
def test_input_ranges_schema():
    ranges = input_ranges()
    assert len(ranges) == 7
    expected_keys = {
        "nitrogen",
        "phosphorus",
        "potassium",
        "temperature",
        "humidity",
        "ph",
        "rainfall",
    }
    assert set(ranges.keys()) == expected_keys

    for param, meta in ranges.items():
        assert "min" in meta
        assert "max" in meta
        assert "absolute_min" in meta
        assert "absolute_max" in meta
        assert "unit" in meta
        assert "step" in meta
        assert meta["min"] >= meta["absolute_min"]
        assert meta["max"] <= meta["absolute_max"]


@pytest.mark.django_db
def test_recommend_returns_top3():
    sample_inputs = {
        "nitrogen": 90.0,
        "phosphorus": 42.0,
        "potassium": 43.0,
        "temperature": 20.8,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.9,
    }
    result = recommend(sample_inputs)
    assert len(result.results) == 3
    assert result.results[0].rank == 1
    assert result.results[0].crop == "rice"
    assert result.model_version == "crs-1.0.0"


def test_service_raises_503_when_model_missing():
    with patch(
        "krishisetu_ml.predict.get_model_artifacts",
        side_effect=FileNotFoundError("missing model"),
    ):
        with pytest.raises(ModelUnavailableError):
            supported_crops()
