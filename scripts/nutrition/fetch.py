"""Fetch raw nutrition JSON data from USDA FoodData Central API for mapped crops.

Saves raw response JSON files to data/nutrition/raw/<fdc_id>.json.
Requires USDA_FDC_API_KEY in environment or .env.
"""

import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MAPPING_CSV = BASE_DIR / "data" / "nutrition" / "crop_food_map.csv"
RAW_DIR = BASE_DIR / "data" / "nutrition" / "raw"


def get_api_key() -> str:
    key = os.environ.get("USDA_FDC_API_KEY", "").strip()
    if not key:
        env_path = BASE_DIR / ".env"
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("USDA_FDC_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    return key


def fetch_food(fdc_id: str, api_key: str) -> dict:
    url = f"https://api.nal.usda.gov/fdc/v1/food/{fdc_id}?api_key={api_key}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "KrishiSetu-Nutrition-Loader/1.0",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    api_key = get_api_key()
    if not api_key:
        print(
            "ERROR: USDA_FDC_API_KEY not found in environment or .env.",
            file=sys.stderr,
        )
        print(
            "Sign up for a free key at https://api.data.gov/signup and set USDA_FDC_API_KEY.",
            file=sys.stderr,
        )
        sys.exit(1)

    with open(MAPPING_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    fetched = 0
    skipped = 0
    errors = 0

    for row in rows:
        fdc_id = row["source_id"].strip()
        if row["is_food"].lower() != "true" or fdc_id in ("NONE", ""):
            continue

        raw_file = RAW_DIR / f"{fdc_id}.json"
        if raw_file.exists():
            print(f"Skipping cached: {fdc_id} ({row['crop_key']} - {row['form']})")
            skipped += 1
            continue

        print(f"Fetching FDC ID {fdc_id} for {row['crop_key']} ({row['form']})...")
        try:
            data = fetch_food(fdc_id, api_key)
            with open(raw_file, "w", encoding="utf-8") as out:
                json.dump(data, out, indent=2)
            fetched += 1
            time.sleep(0.3)  # Respect rate limit
        except urllib.error.HTTPError as e:
            print(
                f"HTTP Error {e.code} for FDC ID {fdc_id}: {e.reason}", file=sys.stderr
            )
            errors += 1
        except urllib.error.URLError as e:
            print(
                f"Network error fetching FDC ID {fdc_id}: {e.reason}", file=sys.stderr
            )
            errors += 1

    print(
        f"\nFetch complete. Fetched: {fetched}, Cached/Skipped: {skipped}, Errors: {errors}"
    )
    if errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
