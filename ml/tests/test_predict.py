"""
Tests for krishisetu_ml predict_top3, input validation, and reproducibility.
"""

import pytest

from krishisetu_ml.predict import clear_model_cache, predict_top3
from krishisetu_ml.schema import PredictionResult


def test_predict_top3_representative_rice():
    """Requirement 1: Predict on representative sample (e.g. rice values)."""
    # Rice characteristics: high N (~80-90), high rainfall (>200mm), moderate temp (~22-26°C), high humidity (>80%)
    res: PredictionResult = predict_top3(
        nitrogen=90,
        phosphorus=42,
        potassium=43,
        temperature=21.0,
        humidity=82.0,
        ph=6.5,
        rainfall=205.0,
    )

    assert isinstance(res, PredictionResult)
    assert len(res.results) == 3
    assert res.model_version == "crs-1.0.0"

    # Rice should be in top 3, and typically rank 1
    top_crops = [r.crop for r in res.results]
    assert "rice" in top_crops
    assert res.results[0].crop == "rice"
    assert res.results[0].score > 0.5


def test_predict_top3_representative_apple():
    """Predict on representative apple sample (high P and K, low temp)."""
    # Apple characteristics in dataset: P ~120-140, K ~190-205, moderate/cool temp (~21-24°C)
    res = predict_top3(
        nitrogen=20,
        phosphorus=135,
        potassium=200,
        temperature=22.0,
        humidity=92.0,
        ph=6.0,
        rainfall=110.0,
    )
    assert res.results[0].crop == "apple"


def test_probabilities_sorted_and_positive():
    """Requirement 2: Top 3 are sorted descending, scores in [0, 1]."""
    res = predict_top3(
        nitrogen=60,
        phosphorus=55,
        potassium=45,
        temperature=25.0,
        humidity=70.0,
        ph=6.5,
        rainfall=100.0,
    )

    scores = [r.score for r in res.results]
    assert len(scores) == 3
    # Sorted descending
    assert scores[0] >= scores[1] >= scores[2]
    # Each score between 0 and 1
    for s in scores:
        assert 0.0 <= s <= 1.0
    # Sum of top 3 is <= 1.0
    assert sum(scores) <= 1.0001


def test_out_of_training_range_warning():
    """Requirement 3: Out-of-training-range input produces descriptive warning."""
    # Training range for N is 0-140 kg/ha. Test with 180 kg/ha (physically plausible up to 300)
    res = predict_top3(
        nitrogen=180,
        phosphorus=50,
        potassium=50,
        temperature=25.0,
        humidity=80.0,
        ph=6.5,
        rainfall=150.0,
    )

    assert len(res.warnings) >= 1
    assert any("nitrogen_out_of_training_range" in w for w in res.warnings)
    # Still returns top 3 predictions
    assert len(res.results) == 3


def test_impossible_inputs_raise_value_error():
    """Requirement 4: Impossible inputs raise ValueError."""
    # Impossible pH (< 0)
    with pytest.raises(ValueError, match="outside physically possible limits"):
        predict_top3(
            nitrogen=50,
            phosphorus=50,
            potassium=50,
            temperature=25.0,
            humidity=80.0,
            ph=-1.0,
            rainfall=100.0,
        )

    # Impossible pH (> 14)
    with pytest.raises(ValueError, match="outside physically possible limits"):
        predict_top3(
            nitrogen=50,
            phosphorus=50,
            potassium=50,
            temperature=25.0,
            humidity=80.0,
            ph=15.0,
            rainfall=100.0,
        )

    # Negative rainfall
    with pytest.raises(ValueError, match="outside physically possible limits"):
        predict_top3(
            nitrogen=50,
            phosphorus=50,
            potassium=50,
            temperature=25.0,
            humidity=80.0,
            ph=6.5,
            rainfall=-20.0,
        )

    # Non-numeric input
    with pytest.raises(ValueError, match="must be a valid number"):
        predict_top3(
            nitrogen="invalid",
            phosphorus=50,
            potassium=50,
            temperature=25.0,
            humidity=80.0,
            ph=6.5,
            rainfall=100.0,
        )


def test_model_cache_and_reproducibility():
    """Requirement 5: Model loads cleanly and returns identical outputs."""
    clear_model_cache()

    input_data = {
        "nitrogen": 80.0,
        "phosphorus": 40.0,
        "potassium": 40.0,
        "temperature": 24.0,
        "humidity": 80.0,
        "ph": 6.5,
        "rainfall": 180.0,
    }

    # First prediction (loads from disk into cache)
    res1 = predict_top3(**input_data)

    # Clear cache and predict again (loads freshly)
    clear_model_cache()
    res2 = predict_top3(**input_data)

    assert [r.crop for r in res1.results] == [r.crop for r in res2.results]
    assert [r.score for r in res1.results] == [r.score for r in res2.results]
