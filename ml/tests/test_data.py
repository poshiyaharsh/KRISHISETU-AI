"""
Tests for krishisetu_ml data loading and audit.
"""

from krishisetu_ml.config import FEATURES, RAW_DATA_PATH, TARGET
from krishisetu_ml.data import audit_dataset, compute_sha256, load_raw_data


def test_dataset_exists_and_hashes():
    assert RAW_DATA_PATH.exists()
    sha = compute_sha256(RAW_DATA_PATH)
    assert len(sha) == 64
    assert sha == "808e1d84a544647f1ab2fdae04f434b1842692d6be09eee18a5c2d43eb78d77c"


def test_load_raw_data():
    df = load_raw_data(RAW_DATA_PATH)
    assert len(df) == 2200
    for col in FEATURES + [TARGET]:
        assert col in df.columns
    assert df[TARGET].nunique() == 22
    assert df.isnull().sum().sum() == 0


def test_audit_dataset():
    df = load_raw_data(RAW_DATA_PATH)
    audit = audit_dataset(df, RAW_DATA_PATH)
    assert audit["total_rows"] == 2200
    assert audit["unique_crops_count"] == 22
    assert audit["duplicates_count"] == 0
    assert len(audit["feature_stats"]) == 7
    # Exactly 100 samples per crop
    for count in audit["class_counts"].values():
        assert count == 100
