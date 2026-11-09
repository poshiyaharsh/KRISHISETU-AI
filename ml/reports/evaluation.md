# Model Comparison and Evaluation Report

> **Methodology:** Stratified 80/20 train/test split with fixed random seed (42). Models compared using Stratified 5-Fold Cross Validation on the training split only. The 20% test split was evaluated once as a final holdout test.

---

## 1. 5-Fold Cross Validation Results (Training Set)

| Model | Accuracy (Mean ± Std) | Macro-F1 (Mean ± Std) | Macro-Precision | Macro-Recall | Fit Time (s) |
|-------|-----------------------|-----------------------|-----------------|--------------|--------------|
| **Logistic Regression (Baseline)** | 96.82% ± 0.66% | 96.78% ± 0.68% | 97.10% | 96.82% | 0.097s |
| **Random Forest** | 99.38% ± 0.61% | 99.37% ± 0.61% | 99.46% | 99.38% | 0.289s |
| **XGBoost** | 99.03% ± 0.23% | 99.03% ± 0.23% | 99.08% | 99.03% | 1.871s |
| **LightGBM** | 99.15% ± 0.40% | 99.15% ± 0.40% | 99.19% | 99.15% | 4.816s |

---

## 2. Model Selection Justification

Random Forest and ensemble gradient boosters (LightGBM/XGBoost) all achieve exceptional macro-F1 scores (>99.3%) on this curated benchmark dataset.
Random Forest is selected as the production model because it requires zero input scaling, offers deterministic and smooth probability calibration without boosting learning-rate decay, has a compact disk footprint (~1.2 MB), and provides lightning-fast single-instance inference without native C++ compilation dependencies.

---

## 3. Hyperparameter Tuning (Random Forest)

- **Selected Parameters:** `{'n_estimators': 100, 'max_depth': 15, 'min_samples_split': 4}`
- **Best Cross-Validated Macro-F1:** 99.49%

| Grid Iteration | Parameters | CV Macro-F1 (Mean ± Std) |
|----------------|------------|--------------------------|
| 1 | `{'n_estimators': 50, 'max_depth': None, 'min_samples_split': 2}` | 99.31% ± 0.87% |
| 2 | `{'n_estimators': 100, 'max_depth': None, 'min_samples_split': 2}` | 99.37% ± 0.61% |
| 3 | `{'n_estimators': 150, 'max_depth': 15, 'min_samples_split': 2}` | 99.31% ± 0.53% |
| 4 | `{'n_estimators': 100, 'max_depth': 15, 'min_samples_split': 4}` | 99.49% ± 0.52% |
| 5 | `{'n_estimators': 100, 'max_depth': None, 'min_samples_split': 4}` | 99.37% ± 0.52% |

---

## 4. Final Holdout Test Evaluation (20% Held-Out Test Set)

- **Test Samples Evaluated:** 440
- **Test Accuracy:** 99.55%
- **Test Macro-F1:** 99.55%
- **Test Macro-Precision:** 99.57%
- **Test Macro-Recall:** 99.55%

### Per-Class Test Performance

| Crop | Precision | Recall | F1-Score | Support |
|------|-----------|--------|----------|---------|
| **apple** | 100.0% | 100.0% | 100.0% | 20 |
| **banana** | 100.0% | 100.0% | 100.0% | 20 |
| **blackgram** | 100.0% | 95.0% | 97.4% | 20 |
| **chickpea** | 100.0% | 100.0% | 100.0% | 20 |
| **coconut** | 100.0% | 100.0% | 100.0% | 20 |
| **coffee** | 100.0% | 100.0% | 100.0% | 20 |
| **cotton** | 100.0% | 100.0% | 100.0% | 20 |
| **grapes** | 100.0% | 100.0% | 100.0% | 20 |
| **jute** | 95.2% | 100.0% | 97.6% | 20 |
| **kidneybeans** | 100.0% | 100.0% | 100.0% | 20 |
| **lentil** | 100.0% | 100.0% | 100.0% | 20 |
| **maize** | 95.2% | 100.0% | 97.6% | 20 |
| **mango** | 100.0% | 100.0% | 100.0% | 20 |
| **mothbeans** | 100.0% | 100.0% | 100.0% | 20 |
| **mungbean** | 100.0% | 100.0% | 100.0% | 20 |
| **muskmelon** | 100.0% | 100.0% | 100.0% | 20 |
| **orange** | 100.0% | 100.0% | 100.0% | 20 |
| **papaya** | 100.0% | 100.0% | 100.0% | 20 |
| **pigeonpeas** | 100.0% | 100.0% | 100.0% | 20 |
| **pomegranate** | 100.0% | 100.0% | 100.0% | 20 |
| **rice** | 100.0% | 95.0% | 97.4% | 20 |
| **watermelon** | 100.0% | 100.0% | 100.0% | 20 |

---

## 5. Artifact Summary

- **Model Artifact:** `crop_model.joblib`
- **Metadata Manifest:** `crop_model.meta.json`
- **Model Version:** `crs-1.0.0`