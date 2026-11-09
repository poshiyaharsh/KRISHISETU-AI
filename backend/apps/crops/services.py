"""
Service layer connecting Django backend to the krishisetu_ml engine.
Loads lazily and handles missing model artifacts gracefully with 503 errors.
"""

import logging
from typing import Any


from config.exceptions import ModelUnavailableError

logger = logging.getLogger(__name__)


def get_ml_engine():
    """
    Import and initialize krishisetu_ml.
    Raises ModelUnavailableError (HTTP 503) if the model artifact or package is unavailable.
    """
    try:
        from krishisetu_ml.predict import get_model_artifacts, predict_top3
        from krishisetu_ml.schema import FEATURE_BOUNDS, PredictionResult

        return predict_top3, get_model_artifacts, FEATURE_BOUNDS, PredictionResult
    except FileNotFoundError as err:
        logger.error("ML model artifact not found: %s", err)
        raise ModelUnavailableError(
            "Crop recommendation model artifact is missing or unbuilt."
        ) from err
    except Exception as err:
        logger.exception("Failed to initialize ML model engine: %s", err)
        raise ModelUnavailableError(
            "Crop recommendation service is temporarily unavailable."
        ) from err


def supported_crops() -> list[str]:
    """Return the list of all crop classes supported by the trained model."""
    try:
        _, get_artifacts, _, _ = get_ml_engine()
        _, le, _, metadata = get_artifacts()
        if "classes" in metadata:
            return sorted(metadata["classes"])
        return sorted([str(c) for c in le.classes_])
    except Exception as err:
        logger.exception("Failed to retrieve supported crops: %s", err)
        raise ModelUnavailableError(
            "Could not load supported crop classes from model."
        ) from err


def input_ranges() -> dict[str, dict[str, Any]]:
    """
    Return input parameter ranges (training boundaries, physical limits, unit, step)
    derived directly from the ML schema single source of truth.
    """
    _, _, bounds, _ = get_ml_engine()

    steps = {
        "nitrogen": 1.0,
        "phosphorus": 1.0,
        "potassium": 1.0,
        "temperature": 0.1,
        "humidity": 0.1,
        "ph": 0.1,
        "rainfall": 0.5,
    }

    result = {}
    for name, (train_min, train_max, abs_min, abs_max, unit) in bounds.items():
        result[name] = {
            "min": train_min,
            "max": train_max,
            "absolute_min": abs_min,
            "absolute_max": abs_max,
            "unit": unit,
            "step": steps.get(name, 1.0),
        }

    return result


def recommend(inputs: dict[str, float]):
    """
    Execute top 3 crop prediction given 7 agricultural inputs.

    Args:
        inputs: dict with keys: nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall

    Returns:
        PredictionResult dataclass from krishisetu_ml
    """
    predict_fn, _, _, _ = get_ml_engine()

    try:
        return predict_fn(
            nitrogen=inputs["nitrogen"],
            phosphorus=inputs["phosphorus"],
            potassium=inputs["potassium"],
            temperature=inputs["temperature"],
            humidity=inputs["humidity"],
            ph=inputs["ph"],
            rainfall=inputs["rainfall"],
        )
    except FileNotFoundError as err:
        raise ModelUnavailableError(
            "Crop recommendation model artifact is missing."
        ) from err
