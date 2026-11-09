"""Cleaning stage for schemes pipeline.

Normalizes whitespace, maps canonical category slugs, standardizes farmer types,
and deduplicates records by source_id.
"""

import json
import re
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_DIR = BASE_DIR / "data" / "schemes" / "raw"
DATA_DIR = BASE_DIR / "data" / "schemes"


def slugify(text: str) -> str:
    # Remove parenthesized acronyms or special chars for cleaner slugs
    text = re.sub(r"\([^)]*\)", "", text).strip()
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", text)


def normalize_text(text: str) -> str:
    if not text:
        return ""
    # Normalize multiple whitespaces
    return re.sub(r"\s+", " ", text).strip()


def clean_record(raw: dict[str, Any]) -> dict[str, Any]:
    cleaned = dict(raw)
    cleaned["name"] = normalize_text(raw.get("name", ""))
    cleaned["slug"] = slugify(cleaned["name"])
    cleaned["short_description"] = normalize_text(raw.get("short_description", ""))
    cleaned["description"] = normalize_text(raw.get("description", ""))
    cleaned["department"] = normalize_text(raw.get("department", ""))
    cleaned["category"] = normalize_text(raw.get("category", "General Agriculture"))
    cleaned["farmer_types"] = [normalize_text(ft) for ft in raw.get("farmer_types", []) if normalize_text(ft)]
    cleaned["eligibility"] = normalize_text(raw.get("eligibility", ""))
    cleaned["benefits"] = normalize_text(raw.get("benefits", ""))
    cleaned["documents_required"] = normalize_text(raw.get("documents_required", ""))
    cleaned["how_to_apply"] = normalize_text(raw.get("how_to_apply", ""))
    cleaned["official_url"] = raw.get("official_url", "").strip()
    cleaned["source_name"] = normalize_text(raw.get("source_name", ""))
    cleaned["source_url"] = raw.get("source_url", "").strip()
    cleaned["source_id"] = raw.get("source_id", "").strip()
    cleaned["last_verified_on"] = raw.get("last_verified_on", "").strip()
    cleaned["status"] = raw.get("status", "active").strip().lower()
    cleaned["level"] = raw.get("level", "central").strip().lower()
    cleaned["state_code"] = raw.get("state_code")
    return cleaned


def clean() -> list[dict[str, Any]]:
    raw_files = list(RAW_DIR.glob("*.json"))
    all_raw: list[dict[str, Any]] = []

    for fpath in raw_files:
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                all_raw.extend(data)

    print(f"Loaded {len(all_raw)} raw scheme entries from {len(raw_files)} files.")

    seen_ids: set[str] = set()
    cleaned_records: list[dict[str, Any]] = []

    for item in all_raw:
        cleaned = clean_record(item)
        sid = cleaned.get("source_id")
        if not sid or sid in seen_ids:
            print(f"Skipping duplicate or missing source_id: {sid}")
            continue
        seen_ids.add(sid)
        cleaned_records.append(cleaned)

    cleaned_path = DATA_DIR / "schemes_pre_validation.json"
    with open(cleaned_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_records, f, indent=2, ensure_ascii=False)

    print(f"Cleaned {len(cleaned_records)} unique scheme entries -> {cleaned_path}")
    return cleaned_records


if __name__ == "__main__":
    clean()
