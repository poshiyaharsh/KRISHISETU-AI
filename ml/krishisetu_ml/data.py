"""
Data ingestion, validation, and auditing functions for krishisetu_ml.
"""

import hashlib
from pathlib import Path
from typing import Any

import pandas as pd

from .config import FEATURES, RAW_DATA_PATH, TARGET


def compute_sha256(file_path: Path) -> str:
    """Compute SHA-256 checksum of a file."""
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def load_raw_data(file_path: Path = RAW_DATA_PATH) -> pd.DataFrame:
    """
    Load and validate the raw Crop Recommendation CSV dataset.
    """
    if not file_path.exists():
        raise FileNotFoundError(
            f"Raw dataset not found at {file_path}. "
            "Please ensure Crop_recommendation.csv is present in ml/data/raw/."
        )

    df = pd.read_csv(file_path)

    expected_cols = set(FEATURES + [TARGET])
    actual_cols = set(df.columns)
    missing_cols = expected_cols - actual_cols

    if missing_cols:
        raise ValueError(f"Dataset is missing required columns: {missing_cols}")

    return df


def audit_dataset(df: pd.DataFrame, file_path: Path = RAW_DATA_PATH) -> dict[str, Any]:
    """
    Perform a complete audit of the dataset and return detailed metrics.
    """
    sha256 = compute_sha256(file_path) if file_path.exists() else "UNKNOWN"
    total_rows = len(df)
    missing_values = df.isnull().sum().to_dict()
    duplicates_count = int(df.duplicated().sum())

    classes = sorted(df[TARGET].unique().tolist())
    class_counts = df[TARGET].value_counts().to_dict()
    unique_crops_count = len(classes)

    feature_stats: dict[str, dict[str, float]] = {}
    outliers_iqr: dict[str, int] = {}

    for col in FEATURES:
        series = df[col].astype(float)
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outlier_count = int(((series < lower_bound) | (series > upper_bound)).sum())

        feature_stats[col] = {
            "min": round(float(series.min()), 2),
            "max": round(float(series.max()), 2),
            "mean": round(float(series.mean()), 2),
            "std": round(float(series.std()), 2),
            "median": round(float(series.median()), 2),
            "q25": round(float(q1), 2),
            "q75": round(float(q3), 2),
        }
        outliers_iqr[col] = outlier_count

    return {
        "file_path": str(file_path),
        "sha256": sha256,
        "total_rows": total_rows,
        "missing_values": missing_values,
        "duplicates_count": duplicates_count,
        "unique_crops_count": unique_crops_count,
        "classes": classes,
        "class_counts": class_counts,
        "feature_stats": feature_stats,
        "outliers_iqr": outliers_iqr,
    }
