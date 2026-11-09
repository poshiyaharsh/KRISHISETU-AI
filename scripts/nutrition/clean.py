"""Clean and normalize raw USDA FoodData Central nutrition data.

Extracts standard nutrients per 100g edible portion:
- energy_kcal (kcal)
- protein_g (g)
- carbohydrate_g (g)
- fiber_g (g)
- fat_g (g)
- sugars_g (g) [nullable]
- iron_mg (mg)
- calcium_mg (mg)
- vitamin_c_mg (mg)
- potassium_mg (mg)

Produces data/nutrition/nutrition_clean.csv.
"""

import csv
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MAPPING_CSV = BASE_DIR / "data" / "nutrition" / "crop_food_map.csv"
RAW_DIR = BASE_DIR / "data" / "nutrition" / "raw"
OUTPUT_CSV = BASE_DIR / "data" / "nutrition" / "nutrition_clean.csv"


def extract_nutrient_value(
    food_nutrients: list, name_keywords: list[str], unit: str
) -> float | None:
    """Find a nutrient matching given keywords and unit, returning rounded float value or None."""
    for fn in food_nutrients:
        nutrient = fn.get("nutrient", {})
        n_name = (nutrient.get("name") or fn.get("nutrientName") or "").lower()
        n_unit = (nutrient.get("unitName") or fn.get("unitName") or "").lower()

        # Check unit matches
        if n_unit != unit.lower():
            continue

        # Check keywords match
        if any(kw.lower() in n_name for kw in name_keywords):
            val = fn.get("amount") if "amount" in fn else fn.get("value")
            if val is not None:
                return round(float(val), 2)
    return None


def clean_nutrition_row(
    mapping: dict[str, Any], raw_data: dict[str, Any] | None
) -> dict[str, Any]:
    crop_key = mapping["crop_key"]
    is_food = mapping["is_food"].lower() == "true"
    form = mapping["form"]
    is_default = mapping.get("is_default", "false").lower() == "true"
    fdc_id = mapping["source_id"].strip()

    if not is_food or fdc_id == "NONE":
        return {
            "crop_key": crop_key,
            "crop_name": mapping["crop_name"],
            "food_item_name": mapping["food_item_name"],
            "form": form,
            "is_food": False,
            "is_default": is_default,
            "basis": "per_100g",
            "energy_kcal": None,
            "protein_g": None,
            "carbohydrate_g": None,
            "fiber_g": None,
            "fat_g": None,
            "sugars_g": None,
            "iron_mg": None,
            "calcium_mg": None,
            "vitamin_c_mg": None,
            "potassium_mg": None,
            "source": "None",
            "source_id": "NONE",
            "source_url": "",
            "retrieved_on": "",
            "license": "None",
            "notes": mapping.get("reason", "Not a food crop"),
        }

    if not raw_data:
        # Food crop mapped, but raw USDA response not yet downloaded
        return {
            "crop_key": crop_key,
            "crop_name": mapping["crop_name"],
            "food_item_name": mapping["food_item_name"],
            "form": form,
            "is_food": True,
            "is_default": is_default,
            "basis": "per_100g",
            "energy_kcal": None,
            "protein_g": None,
            "carbohydrate_g": None,
            "fiber_g": None,
            "fat_g": None,
            "sugars_g": None,
            "iron_mg": None,
            "calcium_mg": None,
            "vitamin_c_mg": None,
            "potassium_mg": None,
            "source": mapping.get("source", "USDA FoodData Central"),
            "source_id": fdc_id,
            "source_url": f"https://fdc.nal.usda.gov/fdc-app.html#/food-details/{fdc_id}/nutrients",
            "retrieved_on": "",
            "license": "Public Domain (U.S. Government Work)",
            "notes": mapping.get("reason", ""),
        }

    nutrients = raw_data.get("foodNutrients", [])

    # Energy (kcal)
    energy = extract_nutrient_value(nutrients, ["energy"], "kcal")
    # Protein
    protein = extract_nutrient_value(nutrients, ["protein"], "g")
    # Carbohydrate by difference
    carbs = extract_nutrient_value(nutrients, ["carbohydrate, by difference"], "g")
    # Fiber, total dietary
    fiber = extract_nutrient_value(nutrients, ["fiber, total dietary", "fiber"], "g")
    # Total lipid (fat)
    fat = extract_nutrient_value(nutrients, ["total lipid (fat)", "fat"], "g")
    # Sugars
    sugars = extract_nutrient_value(
        nutrients,
        ["sugars, total including nlea", "sugars, total", "total sugars"],
        "g",
    )
    # Iron
    iron = extract_nutrient_value(nutrients, ["iron, fe", "iron"], "mg")
    # Calcium
    calcium = extract_nutrient_value(nutrients, ["calcium, ca", "calcium"], "mg")
    # Vitamin C
    vit_c = extract_nutrient_value(
        nutrients, ["vitamin c, total ascorbic acid", "vitamin c"], "mg"
    )
    # Potassium
    potassium = extract_nutrient_value(nutrients, ["potassium, k", "potassium"], "mg")

    today_str = datetime.now(UTC).strftime("%Y-%m-%d")
    source_url = (
        f"https://fdc.nal.usda.gov/fdc-app.html#/food-details/{fdc_id}/nutrients"
    )

    return {
        "crop_key": crop_key,
        "crop_name": mapping["crop_name"],
        "food_item_name": raw_data.get("description", mapping["food_item_name"]),
        "form": form,
        "is_food": True,
        "is_default": is_default,
        "basis": "per_100g",
        "energy_kcal": energy,
        "protein_g": protein,
        "carbohydrate_g": carbs,
        "fiber_g": fiber,
        "fat_g": fat,
        "sugars_g": sugars,
        "iron_mg": iron,
        "calcium_mg": calcium,
        "vitamin_c_mg": vit_c,
        "potassium_mg": potassium,
        "source": "USDA FoodData Central",
        "source_id": fdc_id,
        "source_url": source_url,
        "retrieved_on": today_str,
        "license": "Public Domain (U.S. Government Work)",
        "notes": mapping.get("reason", ""),
    }


def main():
    with open(MAPPING_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        mappings = list(reader)

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "crop_key",
        "crop_name",
        "food_item_name",
        "form",
        "is_food",
        "is_default",
        "basis",
        "energy_kcal",
        "protein_g",
        "carbohydrate_g",
        "fiber_g",
        "fat_g",
        "sugars_g",
        "iron_mg",
        "calcium_mg",
        "vitamin_c_mg",
        "potassium_mg",
        "source",
        "source_id",
        "source_url",
        "retrieved_on",
        "license",
        "notes",
    ]

    clean_rows = []
    missing_files = []

    for m in mappings:
        fdc_id = m["source_id"].strip()
        is_food = m["is_food"].lower() == "true"
        raw_data = None

        if is_food and fdc_id != "NONE":
            raw_file = RAW_DIR / f"{fdc_id}.json"
            if raw_file.exists():
                with open(raw_file, "r", encoding="utf-8") as rf:
                    raw_data = json.load(rf)
            else:
                missing_files.append((m["crop_key"], m["form"], fdc_id))

        cleaned = clean_nutrition_row(m, raw_data)
        clean_rows.append(cleaned)

    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as out:
        writer = csv.DictWriter(out, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(clean_rows)

    print(f"Wrote {len(clean_rows)} nutrition entries to {OUTPUT_CSV}")
    if missing_files:
        print(
            f"NOTE: {len(missing_files)} raw files not found (run fetch.py with USDA_FDC_API_KEY):"
        )
        for crop, form, fid in missing_files:
            print(f"  - {crop} ({form}): FDC ID {fid}")


if __name__ == "__main__":
    main()
