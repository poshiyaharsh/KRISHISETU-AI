"""Download official USDA FoodData Central SR Legacy bulk dataset and extract raw records for mapped crops."""

import csv
import io
import json
import urllib.request
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MAPPING_CSV = BASE_DIR / "data" / "nutrition" / "crop_food_map.csv"
RAW_DIR = BASE_DIR / "data" / "nutrition" / "raw"
ZIP_PATH = RAW_DIR / "usda_sr_legacy.zip"

USDA_ZIP_URL = "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip"


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    with open(MAPPING_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        mapped_ids = {
            row["source_id"].strip()
            for row in reader
            if row["is_food"].lower() == "true" and row["source_id"].strip() != "NONE"
        }

    print(f"Target FDC IDs to extract ({len(mapped_ids)} items): {mapped_ids}")

    if not ZIP_PATH.exists():
        print(f"Downloading official USDA SR Legacy dataset ({USDA_ZIP_URL})...")
        req = urllib.request.Request(
            USDA_ZIP_URL,
            headers={"User-Agent": "KrishiSetu-Bulk-Ingestion/1.0"},
        )
        with urllib.request.urlopen(req) as resp, open(ZIP_PATH, "wb") as out:
            out.write(resp.read())
        print("Download complete.")
    else:
        print("Using cached USDA SR Legacy zip.")

    with zipfile.ZipFile(ZIP_PATH, "r") as z:
        nutrient_file = [n for n in z.namelist() if n.endswith("/nutrient.csv")][0]
        food_file = [n for n in z.namelist() if n.endswith("/food.csv")][0]
        food_nutrient_file = [
            n for n in z.namelist() if n.endswith("/food_nutrient.csv")
        ][0]

        # 1. Load nutrients lookup: id -> {id, name, unitName}
        nutrients = {}
        with io.TextIOWrapper(z.open(nutrient_file), encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for r in reader:
                nid = r["id"].strip()
                nutrients[nid] = {
                    "id": int(nid),
                    "name": r["name"].strip(),
                    "unitName": r["unit_name"].strip().upper(),
                }

        # 2. Load food descriptions
        foods = {}
        with io.TextIOWrapper(z.open(food_file), encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for r in reader:
                fid = r["fdc_id"].strip()
                if fid in mapped_ids:
                    foods[fid] = {
                        "fdcId": int(fid),
                        "description": r["description"].strip(),
                        "dataType": r.get("data_type", "SR Legacy"),
                        "foodNutrients": [],
                    }

        # 3. Load food_nutrients
        with io.TextIOWrapper(z.open(food_nutrient_file), encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for r in reader:
                fid = r["fdc_id"].strip()
                if fid in foods:
                    nid = r["nutrient_id"].strip()
                    amount = float(r["amount"].strip()) if r.get("amount") else None
                    n_info = nutrients.get(
                        nid, {"id": int(nid), "name": "", "unitName": ""}
                    )
                    foods[fid]["foodNutrients"].append(
                        {
                            "nutrient": n_info,
                            "amount": amount,
                        }
                    )

    # Save each individual raw JSON
    for fid, food_obj in foods.items():
        out_file = RAW_DIR / f"{fid}.json"
        with open(out_file, "w", encoding="utf-8") as out:
            json.dump(food_obj, out, indent=2)
        print(f"Extracted {fid}: {food_obj['description']} ({len(food_obj['foodNutrients'])} nutrients)")

    print(f"\nAll {len(foods)} official USDA SR Legacy foods extracted successfully.")


if __name__ == "__main__":
    main()
