"""Validation stage for schemes pipeline.

Enforces schema integrity, valid URLs, verification dates, and status codes.
Outputs:
  - data/schemes/schemes_clean.json
  - data/schemes/rejected.json
"""

import datetime
import json
import re
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "schemes"

REQUIRED_FIELDS = [
    "name",
    "slug",
    "short_description",
    "description",
    "level",
    "department",
    "category",
    "eligibility",
    "benefits",
    "official_url",
    "source_url",
    "source_id",
    "last_verified_on",
    "status",
]

URL_PATTERN = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)


def validate_record(record: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    # Check required fields
    for field in REQUIRED_FIELDS:
        val = record.get(field)
        if val is None or (isinstance(val, str) and not val.strip()):
            errors.append(f"Missing required field: {field}")

    # Level validation
    level = record.get("level")
    if level not in ("central", "state"):
        errors.append(f"Invalid level '{level}'; must be 'central' or 'state'")
    elif level == "state" and not record.get("state_code"):
        errors.append("State-level scheme must have 'state_code'")

    # Status validation
    status = record.get("status")
    if status not in ("active", "expired", "unknown"):
        errors.append(f"Invalid status '{status}'; must be 'active', 'expired', or 'unknown'")

    # URL validation
    for url_field in ("official_url", "source_url"):
        url = record.get(url_field, "")
        if not URL_PATTERN.match(url):
            errors.append(f"Invalid URL for {url_field}: '{url}'")

    # Date validation
    date_str = record.get("last_verified_on", "")
    try:
        datetime.date.fromisoformat(date_str)
    except (ValueError, TypeError):
        errors.append(f"Invalid last_verified_on date '{date_str}'; must be YYYY-MM-DD")

    return errors


def validate() -> None:
    input_file = DATA_DIR / "schemes_pre_validation.json"
    if not input_file.exists():
        raise FileNotFoundError(f"Missing pre-validation file at {input_file}. Run clean.py first.")

    with open(input_file, "r", encoding="utf-8") as f:
        records: list[dict[str, Any]] = json.load(f)

    clean_records: list[dict[str, Any]] = []
    rejected_records: list[dict[str, Any]] = []

    for r in records:
        errs = validate_record(r)
        if errs:
            rejected_records.append({"record": r, "reasons": errs})
        else:
            clean_records.append(r)

    clean_out = DATA_DIR / "schemes_clean.json"
    with open(clean_out, "w", encoding="utf-8") as f:
        json.dump(clean_records, f, indent=2, ensure_ascii=False)

    rejected_out = DATA_DIR / "rejected.json"
    with open(rejected_out, "w", encoding="utf-8") as f:
        json.dump(rejected_records, f, indent=2, ensure_ascii=False)

    print(f"Validation finished:")
    print(f"  Valid schemes accepted : {len(clean_records)} -> {clean_out}")
    print(f"  Schemes rejected        : {len(rejected_records)} -> {rejected_out}")


if __name__ == "__main__":
    validate()
