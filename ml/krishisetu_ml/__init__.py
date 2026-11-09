"""
KrishiSetu AI ML Package (krishisetu_ml)
Crop Recommendation System (CRS) engine.
"""

from .predict import get_model_artifacts, predict_top3
from .schema import CropRecommendation, PredictionResult

__version__ = "0.1.0"
__all__ = [
    "CropRecommendation",
    "PredictionResult",
    "__version__",
    "get_model_artifacts",
    "predict_top3",
]
