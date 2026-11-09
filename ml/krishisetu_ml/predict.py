"""
Inference engine and top 3 crop prediction function for krishisetu_ml.
"""

import json
import logging
import warnings
from typing import Any

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.preprocessing import LabelEncoder

from .config import METADATA_PATH, MODEL_PATH, MODEL_VERSION
from .schema import CropRecommendation, PredictionResult, validate_and_clean_inputs

logger = logging.getLogger(__name__)

# Global in-memory cache for model payload and metadata
_CACHED_PAYLOAD: dict[str, Any] | None = None
_CACHED_METADATA: dict[str, Any] | None = None


def get_model_artifacts() -> tuple[Any, LabelEncoder, list[str], dict[str, Any]]:
    """
    Load and cache the trained model pipeline and metadata manifest.
    Emits a warning if the currently installed scikit-learn version differs
    from the version used during training.
    """
    global _CACHED_PAYLOAD, _CACHED_METADATA

    if _CACHED_PAYLOAD is None or _CACHED_METADATA is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {MODEL_PATH}. "
                "Please run `python -m krishisetu_ml.train` first."
            )
        if not METADATA_PATH.exists():
            raise FileNotFoundError(f"Metadata manifest not found at {METADATA_PATH}.")

        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        trained_sklearn = metadata.get("environment", {}).get("scikit_learn_version")
        current_sklearn = sklearn.__version__

        if trained_sklearn and trained_sklearn != current_sklearn:
            msg = (
                f"Model was trained with scikit-learn {trained_sklearn}, "
                f"but currently running on {current_sklearn}. "
                "Predictions should be verified for compatibility."
            )
            warnings.warn(msg, RuntimeWarning, stacklevel=2)
            logger.warning(msg)

        payload = joblib.load(MODEL_PATH)
        _CACHED_PAYLOAD = payload
        _CACHED_METADATA = metadata

    model = _CACHED_PAYLOAD["model"]
    le: LabelEncoder = _CACHED_PAYLOAD["label_encoder"]
    features: list[str] = _CACHED_PAYLOAD["features"]

    return model, le, features, _CACHED_METADATA


def clear_model_cache() -> None:
    """Clear in-memory cached model artifacts (useful for testing)."""
    global _CACHED_PAYLOAD, _CACHED_METADATA
    _CACHED_PAYLOAD = None
    _CACHED_METADATA = None


def predict_top3(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float,
) -> PredictionResult:
    """
    Predict top 3 recommended crops with confidence probabilities.

    Args:
        nitrogen: Soil Nitrogen ratio (N) in kg/ha
        phosphorus: Soil Phosphorus ratio (P) in kg/ha
        potassium: Soil Potassium ratio (K) in kg/ha
        temperature: Temperature in °C
        humidity: Relative humidity in %
        ph: Soil pH value (0 - 14)
        rainfall: Rainfall in mm

    Returns:
        PredictionResult: Dataclass containing:
            - results: List of top 3 CropRecommendation (rank, crop, score)
            - warnings: Out-of-training-range alerts
            - model_version: Model identifier string

    Note:
        `score` is the raw model probability (0.0 to 1.0) output by Random Forest `predict_proba`.
        It reflects statistical model confidence, not an absolute agronomic yield guarantee.
    """
    # 1. Validate inputs and collect physical / training range warnings
    cleaned, input_warnings = validate_and_clean_inputs(
        nitrogen=nitrogen,
        phosphorus=phosphorus,
        potassium=potassium,
        temperature=temperature,
        humidity=humidity,
        ph=ph,
        rainfall=rainfall,
    )

    # 2. Retrieve model artifact
    model, le, feature_names, metadata = get_model_artifacts()

    # 3. Assemble feature dataframe matching exact training columns and order
    feature_mapping = {
        "N": cleaned["nitrogen"],
        "P": cleaned["phosphorus"],
        "K": cleaned["potassium"],
        "temperature": cleaned["temperature"],
        "humidity": cleaned["humidity"],
        "ph": cleaned["ph"],
        "rainfall": cleaned["rainfall"],
    }
    input_df = pd.DataFrame(
        [[feature_mapping[col] for col in feature_names]], columns=feature_names
    )

    # 4. Compute class probability distributions
    probabilities = model.predict_proba(input_df)[0]

    # 5. Extract top 3 candidates sorted descending
    top_indices = np.argsort(probabilities)[::-1][:3]

    results: list[CropRecommendation] = []
    for rank, idx in enumerate(top_indices, 1):
        crop_label = str(le.classes_[idx])
        score = float(probabilities[idx])
        results.append(
            CropRecommendation(
                rank=rank,
                crop=crop_label,
                score=round(score, 4),
            )
        )

    version_str = metadata.get("model_version", MODEL_VERSION)

    return PredictionResult(
        results=results,
        warnings=input_warnings,
        model_version=version_str,
    )
