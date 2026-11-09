"""
Configuration and constants for krishisetu_ml.
"""

from pathlib import Path

# Base package directory: ml/
PACKAGE_DIR = Path(__file__).resolve().parent.parent

# Paths
DATA_DIR = PACKAGE_DIR / "data"
RAW_DATA_PATH = DATA_DIR / "raw" / "Crop_recommendation.csv"

MODELS_DIR = PACKAGE_DIR / "models"
MODEL_PATH = MODELS_DIR / "crop_model.joblib"
METADATA_PATH = MODELS_DIR / "crop_model.meta.json"

REPORTS_DIR = PACKAGE_DIR / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"

# Feature configuration
FEATURES: list[str] = [
    "N",
    "P",
    "K",
    "temperature",
    "humidity",
    "ph",
    "rainfall",
]
TARGET: str = "label"

# Reproducibility seed
RANDOM_STATE = 42

# Model metadata version
MODEL_VERSION = "crs-1.0.0"
