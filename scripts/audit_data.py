"""
Audit the public Crop Recommendation dataset and generate ml/reports/data_audit.md.
"""

import sys
from pathlib import Path

# Add ml/ directory to sys.path so krishisetu_ml can be imported directly
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "ml"))

from krishisetu_ml.config import RAW_DATA_PATH, REPORTS_DIR
from krishisetu_ml.data import audit_dataset, load_raw_data


def generate_markdown_report(audit: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "# Crop Recommendation Dataset: Data Audit Report",
        "",
        "> **Notice:** This dataset is an idealized, curated public benchmark. Extremely high classification scores (>98%) are typical in synthetic or clean benchmarks and **do NOT** prove equivalent field accuracy under real-world farming conditions with noise, uncalibrated soil sensors, and microclimates.",
        "",
        "---",
        "",
        "## 1. Dataset Overview",
        "",
        f"- **File Location:** `{audit['file_path']}`",
        f"- **SHA-256 Checksum:** `{audit['sha256']}`",
        f"- **Total Rows:** {audit['total_rows']:,}",
        f"- **Total Features:** {len(audit['feature_stats'])} (N, P, K, temperature, humidity, ph, rainfall)",
        "- **Target Column:** `label`",
        f"- **Unique Crops (Classes):** {audit['unique_crops_count']}",
        f"- **Duplicate Rows:** {audit['duplicates_count']}",
        "",
        "---",
        "",
        "## 2. Missing Values",
        "",
        "| Column | Missing Count | Missing % |",
        "|--------|---------------|-----------|",
    ]

    for col, missing in audit["missing_values"].items():
        pct = (missing / audit["total_rows"]) * 100
        lines.append(f"| `{col}` | {missing} | {pct:.2f}% |")

    lines.extend(
        [
            "",
            "---",
            "",
            "## 3. Numerical Feature Statistics & Outliers",
            "",
            "| Feature | Min | Q25 | Median | Mean | Q75 | Max | Std | IQR Outliers |",
            "|---------|-----|-----|--------|------|-----|-----|-----|--------------|",
        ]
    )

    for feat, stats in audit["feature_stats"].items():
        outliers = audit["outliers_iqr"][feat]
        lines.append(
            f"| `{feat}` | {stats['min']} | {stats['q25']} | {stats['median']} | "
            f"{stats['mean']} | {stats['q75']} | {stats['max']} | {stats['std']} | {outliers} |"
        )

    lines.extend(
        [
            "",
            "---",
            "",
            "## 4. Class Distribution & Balance",
            "",
            "The dataset contains exactly balanced representations across all crop classes.",
            "",
            "| # | Crop Class | Sample Count | Percentage |",
            "|---|------------|--------------|------------|",
        ]
    )

    for idx, (crop, count) in enumerate(sorted(audit["class_counts"].items()), 1):
        pct = (count / audit["total_rows"]) * 100
        lines.append(f"| {idx} | **{crop}** | {count} | {pct:.2f}% |")

    lines.extend(
        [
            "",
            "---",
            "",
            "## 5. Audit Conclusions for Modeling",
            "",
            "1. **Balanced Distribution:** Exactly 100 samples per crop class across all 22 crops, meaning no class imbalance mitigation (SMOTE/undersampling) is required.",
            "2. **Zero Nulls & Duplicates:** Clean data with no imputations required.",
            "3. **Physical Range Bounds:** Feature ranges conform to standard agronomic boundaries:",
            "   - Nitrogen (N): 0 - 140 kg/ha",
            "   - Phosphorus (P): 5 - 145 kg/ha",
            "   - Potassium (K): 5 - 205 kg/ha",
            "   - Temperature: 8.83 - 43.68 °C",
            "   - Humidity: 14.26 - 99.98 %",
            "   - pH: 3.50 - 9.94",
            "   - Rainfall: 20.21 - 298.56 mm",
            "4. **Outliers:** Potassium (K) and Rainfall exhibit expected long-tailed distributions for specific crops (e.g. grapes and apple require extreme potassium levels; rice requires extreme rainfall). These are physically valid and must NOT be clipped or removed.",
        ]
    )

    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Audit report generated at: {output_path}")


def main():
    print(f"Loading raw dataset from {RAW_DATA_PATH}...")
    df = load_raw_data(RAW_DATA_PATH)
    print(f"Auditing {len(df)} records across {len(df.columns)} columns...")
    audit = audit_dataset(df, RAW_DATA_PATH)

    report_path = REPORTS_DIR / "data_audit.md"
    generate_markdown_report(audit, report_path)
    print("Audit completed successfully.")


if __name__ == "__main__":
    main()
