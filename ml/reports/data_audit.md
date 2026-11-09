# Crop Recommendation Dataset: Data Audit Report

> **Notice:** This dataset is an idealized, curated public benchmark. Extremely high classification scores (>98%) are typical in synthetic or clean benchmarks and **do NOT** prove equivalent field accuracy under real-world farming conditions with noise, uncalibrated soil sensors, and microclimates.

---

## 1. Dataset Overview

- **File Location:** `E:\03 Study\krishisetu-ai\ml\data\raw\Crop_recommendation.csv`
- **SHA-256 Checksum:** `808e1d84a544647f1ab2fdae04f434b1842692d6be09eee18a5c2d43eb78d77c`
- **Total Rows:** 2,200
- **Total Features:** 7 (N, P, K, temperature, humidity, ph, rainfall)
- **Target Column:** `label`
- **Unique Crops (Classes):** 22
- **Duplicate Rows:** 0

---

## 2. Missing Values

| Column | Missing Count | Missing % |
|--------|---------------|-----------|
| `N` | 0 | 0.00% |
| `P` | 0 | 0.00% |
| `K` | 0 | 0.00% |
| `temperature` | 0 | 0.00% |
| `humidity` | 0 | 0.00% |
| `ph` | 0 | 0.00% |
| `rainfall` | 0 | 0.00% |
| `label` | 0 | 0.00% |

---

## 3. Numerical Feature Statistics & Outliers

| Feature | Min | Q25 | Median | Mean | Q75 | Max | Std | IQR Outliers |
|---------|-----|-----|--------|------|-----|-----|-----|--------------|
| `N` | 0.0 | 21.0 | 37.0 | 50.55 | 84.25 | 140.0 | 36.92 | 0 |
| `P` | 5.0 | 28.0 | 51.0 | 53.36 | 68.0 | 145.0 | 32.99 | 138 |
| `K` | 5.0 | 20.0 | 32.0 | 48.15 | 49.0 | 205.0 | 50.65 | 200 |
| `temperature` | 8.83 | 22.77 | 25.6 | 25.62 | 28.56 | 43.68 | 5.06 | 86 |
| `humidity` | 14.26 | 60.26 | 80.47 | 71.48 | 89.95 | 99.98 | 22.26 | 30 |
| `ph` | 3.5 | 5.97 | 6.43 | 6.47 | 6.92 | 9.94 | 0.77 | 57 |
| `rainfall` | 20.21 | 64.55 | 94.87 | 103.46 | 124.27 | 298.56 | 54.96 | 100 |

---

## 4. Class Distribution & Balance

The dataset contains exactly balanced representations across all crop classes.

| # | Crop Class | Sample Count | Percentage |
|---|------------|--------------|------------|
| 1 | **apple** | 100 | 4.55% |
| 2 | **banana** | 100 | 4.55% |
| 3 | **blackgram** | 100 | 4.55% |
| 4 | **chickpea** | 100 | 4.55% |
| 5 | **coconut** | 100 | 4.55% |
| 6 | **coffee** | 100 | 4.55% |
| 7 | **cotton** | 100 | 4.55% |
| 8 | **grapes** | 100 | 4.55% |
| 9 | **jute** | 100 | 4.55% |
| 10 | **kidneybeans** | 100 | 4.55% |
| 11 | **lentil** | 100 | 4.55% |
| 12 | **maize** | 100 | 4.55% |
| 13 | **mango** | 100 | 4.55% |
| 14 | **mothbeans** | 100 | 4.55% |
| 15 | **mungbean** | 100 | 4.55% |
| 16 | **muskmelon** | 100 | 4.55% |
| 17 | **orange** | 100 | 4.55% |
| 18 | **papaya** | 100 | 4.55% |
| 19 | **pigeonpeas** | 100 | 4.55% |
| 20 | **pomegranate** | 100 | 4.55% |
| 21 | **rice** | 100 | 4.55% |
| 22 | **watermelon** | 100 | 4.55% |

---

## 5. Audit Conclusions for Modeling

1. **Balanced Distribution:** Exactly 100 samples per crop class across all 22 crops, meaning no class imbalance mitigation (SMOTE/undersampling) is required.
2. **Zero Nulls & Duplicates:** Clean data with no imputations required.
3. **Physical Range Bounds:** Feature ranges conform to standard agronomic boundaries:
   - Nitrogen (N): 0 - 140 kg/ha
   - Phosphorus (P): 5 - 145 kg/ha
   - Potassium (K): 5 - 205 kg/ha
   - Temperature: 8.83 - 43.68 °C
   - Humidity: 14.26 - 99.98 %
   - pH: 3.50 - 9.94
   - Rainfall: 20.21 - 298.56 mm
4. **Outliers:** Potassium (K) and Rainfall exhibit expected long-tailed distributions for specific crops (e.g. grapes and apple require extreme potassium levels; rice requires extreme rainfall). These are physically valid and must NOT be clipped or removed.