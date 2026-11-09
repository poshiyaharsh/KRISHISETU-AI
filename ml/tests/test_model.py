"""
Tests for krishisetu_ml model artifact and reproducibility.
"""

import json

import joblib

from krishisetu_ml.config import METADATA_PATH, MODEL_PATH, MODEL_VERSION


def test_model_artifact_exists_and_loads():
    assert MODEL_PATH.exists()
    payload = joblib.load(MODEL_PATH)
    assert "model" in payload
    assert "label_encoder" in payload
    assert "features" in payload

    le = payload["label_encoder"]
    assert len(le.classes_) == 22


def test_metadata_manifest():
    assert METADATA_PATH.exists()
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["model_version"] == MODEL_VERSION
    assert meta["classes_count"] == 22
    assert meta["metrics"]["test_accuracy"] > 0.98
    assert meta["metrics"]["test_macro_f1"] > 0.98
