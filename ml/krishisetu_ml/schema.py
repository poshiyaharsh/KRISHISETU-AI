"""
Input schema, physical boundary validation, and typed prediction results for krishisetu_ml.
"""

import math
from dataclasses import asdict, dataclass
from typing import Any

# Feature bounds from data audit (ml/reports/data_audit.md)
# (training_min, training_max, absolute_min, absolute_max, unit)
FEATURE_BOUNDS: dict[str, tuple[float, float, float, float, str]] = {
    "nitrogen": (0.0, 140.0, 0.0, 300.0, "kg/ha"),
    "phosphorus": (5.0, 145.0, 0.0, 300.0, "kg/ha"),
    "potassium": (5.0, 205.0, 0.0, 350.0, "kg/ha"),
    "temperature": (8.8, 43.7, -10.0, 60.0, "°C"),
    "humidity": (14.0, 100.0, 0.0, 100.0, "%"),
    "ph": (3.5, 9.9, 0.0, 14.0, "pH"),
    "rainfall": (20.0, 300.0, 0.0, 1000.0, "mm"),
}


@dataclass(frozen=True)
class CropRecommendation:
    """A single crop recommendation item with confidence score."""

    rank: int
    crop: str
    score: float

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class PredictionResult:
    """
    Result returned by predict_top3.

    `score` is the model probability from `predict_proba` (0.0 to 1.0).
    It reflects model confidence based on training data, NOT an absolute crop yield guarantee.
    """

    results: list[CropRecommendation]
    warnings: list[str]
    model_version: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "results": [r.to_dict() for r in self.results],
            "warnings": self.warnings,
            "model_version": self.model_version,
        }


def validate_and_clean_inputs(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float,
) -> tuple[dict[str, float], list[str]]:
    """
    Validate input types and agronomic ranges.

    Raises:
        ValueError: If any input is non-numeric or violates physically plausible limits.

    Returns:
        tuple[dict[str, float], list[str]]: Cleaned float inputs and any warnings for values
        outside the model's training distribution.
    """
    raw_inputs = {
        "nitrogen": nitrogen,
        "phosphorus": phosphorus,
        "potassium": potassium,
        "temperature": temperature,
        "humidity": humidity,
        "ph": ph,
        "rainfall": rainfall,
    }

    cleaned: dict[str, float] = {}
    warnings: list[str] = []

    for name, value in raw_inputs.items():
        if value is None:
            raise ValueError(f"Input '{name}' cannot be None.")

        try:
            val_float = float(value)
        except (ValueError, TypeError):
            raise ValueError(
                f"Input '{name}' must be a valid number, got {type(value).__name__}: {value}"
            )

        if not (-1e9 < val_float < 1e9) or math.isnan(val_float):  # Check NaN/Inf
            raise ValueError(f"Input '{name}' cannot be NaN or infinite.")

        train_min, train_max, abs_min, abs_max, unit = FEATURE_BOUNDS[name]

        # Check physically plausible boundaries
        if val_float < abs_min or val_float > abs_max:
            raise ValueError(
                f"Input '{name}' value {val_float} {unit} is outside physically possible limits "
                f"[{abs_min}, {abs_max}] {unit}."
            )

        # Check training distribution boundaries
        if val_float < train_min or val_float > train_max:
            warnings.append(
                f"{name}_out_of_training_range: Value {val_float} {unit} is outside "
                f"training range [{train_min}, {train_max}] {unit}."
            )

        cleaned[name] = val_float

    return cleaned, warnings
