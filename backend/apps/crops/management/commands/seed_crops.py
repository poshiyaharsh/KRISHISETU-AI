"""
Management command to seed crop catalog with factual agronomic metadata and ideal ranges.
Idempotent: running repeatedly will not duplicate rows.
"""

from typing import Any
from django.core.management.base import BaseCommand
from apps.crops.models import Crop, CropCategory
from apps.crops.services import supported_crops

CROP_METADATA: dict[str, dict[str, Any]] = {
    "rice": {
        "name_en": "Rice",
        "category": CropCategory.CEREAL,
        "description_en": "Kharif staple cereal thriving in warm, humid conditions with abundant water and clayey loams.",
    },
    "maize": {
        "name_en": "Maize",
        "category": CropCategory.CEREAL,
        "description_en": "Versatile warm-season cereal crop suitable for well-drained fertile loamy soils.",
    },
    "chickpea": {
        "name_en": "Chickpea",
        "category": CropCategory.PULSE,
        "description_en": "Rabi pulse crop with high protein content, requiring cool and dry climate with deep loams.",
    },
    "kidneybeans": {
        "name_en": "Kidney Beans",
        "category": CropCategory.PULSE,
        "description_en": "Legume crop cultivated in temperate and subtropical climates with moderate moisture.",
    },
    "pigeonpeas": {
        "name_en": "Pigeon Peas",
        "category": CropCategory.PULSE,
        "description_en": "Drought-tolerant tropical pulse crop widely grown across semi-arid regions.",
    },
    "mothbeans": {
        "name_en": "Moth Beans",
        "category": CropCategory.PULSE,
        "description_en": "Extremely drought-hardy legume suitable for arid and sandy desert soils.",
    },
    "mungbean": {
        "name_en": "Mung Bean",
        "category": CropCategory.PULSE,
        "description_en": "Short-duration warm-season pulse crop grown as catch crop and green manure.",
    },
    "blackgram": {
        "name_en": "Black Gram",
        "category": CropCategory.PULSE,
        "description_en": "Nutritious pulse crop cultivated in warm and humid subtropical regions.",
    },
    "lentil": {
        "name_en": "Lentil",
        "category": CropCategory.PULSE,
        "description_en": "Rabi legume with high nutritional value, preferring cool climate and loamy soils.",
    },
    "pomegranate": {
        "name_en": "Pomegranate",
        "category": CropCategory.FRUIT,
        "description_en": "Hardy fruit tree well-adapted to semi-arid regions with warm summers and mild winters.",
    },
    "banana": {
        "name_en": "Banana",
        "category": CropCategory.FRUIT,
        "description_en": "Fast-growing tropical fruit crop requiring high humidity, rich organic matter, and abundant water.",
    },
    "mango": {
        "name_en": "Mango",
        "category": CropCategory.FRUIT,
        "description_en": "Tropical fruit tree thriving in warm frost-free climates with distinct dry seasons for flowering.",
    },
    "grapes": {
        "name_en": "Grapes",
        "category": CropCategory.FRUIT,
        "description_en": "Subtropical vine crop requiring high potassium, low humidity during ripening, and well-drained soils.",
    },
    "watermelon": {
        "name_en": "Watermelon",
        "category": CropCategory.FRUIT,
        "description_en": "Warm-season vine fruit demanding long sunny days, warm nights, and sandy loam soils.",
    },
    "muskmelon": {
        "name_en": "Muskmelon",
        "category": CropCategory.FRUIT,
        "description_en": "Annual melon crop cultivated in warm dry weather with well-drained sandy or alluvial soils.",
    },
    "apple": {
        "name_en": "Apple",
        "category": CropCategory.FRUIT,
        "description_en": "Temperate fruit crop requiring winter chilling hours, moderate summer temperatures, and high potassium.",
    },
    "orange": {
        "name_en": "Orange",
        "category": CropCategory.FRUIT,
        "description_en": "Subtropical citrus fruit cultivated in sunny regions with deep, well-drained soils.",
    },
    "papaya": {
        "name_en": "Papaya",
        "category": CropCategory.FRUIT,
        "description_en": "Fast-growing tropical fruit crop sensitive to frost and waterlogging, requiring warm climate.",
    },
    "coconut": {
        "name_en": "Coconut",
        "category": CropCategory.OTHER,
        "description_en": "Tropical palm tree thriving in coastal humid zones with warm climate and well-distributed rainfall.",
    },
    "cotton": {
        "name_en": "Cotton",
        "category": CropCategory.FIBRE,
        "description_en": "Commercial fibre crop requiring warm weather, deep black soils, and ample sunshine during boll maturation.",
    },
    "jute": {
        "name_en": "Jute",
        "category": CropCategory.FIBRE,
        "description_en": "Natural bast fibre crop grown in alluvial soils under high humidity, warm temperature, and rainfall.",
    },
    "coffee": {
        "name_en": "Coffee",
        "category": CropCategory.BEVERAGE,
        "description_en": "Perennial shade-loving beverage crop cultivated on cool tropical hill slopes with rich volcanic or loamy soils.",
    },
}


def compute_ideal_ranges_from_dataset() -> dict[str, dict[str, dict[str, float]]]:
    """Calculate empirical min and max per crop from dataset if present."""
    import pandas as pd
    from krishisetu_ml.config import FEATURES, RAW_DATA_PATH

    if not RAW_DATA_PATH.exists():
        return {}

    feature_name_map = {
        "N": "nitrogen",
        "P": "phosphorus",
        "K": "potassium",
        "temperature": "temperature",
        "humidity": "humidity",
        "ph": "ph",
        "rainfall": "rainfall",
    }

    df = pd.read_csv(RAW_DATA_PATH)
    ranges_by_crop: dict[str, dict[str, dict[str, float]]] = {}

    for crop_name, group in df.groupby("label"):
        crop_key = str(crop_name).lower().strip()
        ranges_by_crop[crop_key] = {}
        for feat in FEATURES:
            s = group[feat]
            canonical_name = feature_name_map.get(feat, feat)
            ranges_by_crop[crop_key][canonical_name] = {
                "min": round(float(s.min()), 2),
                "max": round(float(s.max()), 2),
                "mean": round(float(s.mean()), 2),
            }

    return ranges_by_crop


class Command(BaseCommand):
    help = "Seed the Crop catalog with factual metadata and empirical parameter ranges."

    def handle(self, *args, **options):
        self.stdout.write("Seeding crops catalog...")
        crops_list = supported_crops()
        self.stdout.write(f"Model supports {len(crops_list)} crops.")

        dataset_ranges = compute_ideal_ranges_from_dataset()

        created_count = 0
        updated_count = 0

        for crop_key in crops_list:
            meta = CROP_METADATA.get(crop_key, {})
            name_en = meta.get("name_en", crop_key.capitalize())
            category = meta.get("category", CropCategory.OTHER)
            desc_en = meta.get("description_en", "")
            ideal_ranges = dataset_ranges.get(crop_key, {})

            _, created = Crop.objects.update_or_create(
                key=crop_key,
                defaults={
                    "name_en": name_en,
                    "category": category,
                    "description_en": desc_en,
                    "ideal_ranges": ideal_ranges,
                    "is_active": True,
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded crops. Created: {created_count}, Updated: {updated_count}. "
                f"Total crops: {Crop.objects.count()}"
            )
        )
