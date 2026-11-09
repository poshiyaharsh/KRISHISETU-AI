"""
Knowledge Base Extraction and Chunking Pipeline for Krishi Mitra.
Grounded in:
1. Government Schemes (apps.schemes)
2. Crop Profiles & Physical Growth Ranges (apps.crops)
3. Crop Nutrition Profiles (apps.nutrition)
4. Curated Agricultural Guides (apps.chat.knowledge.guides)
"""

import hashlib
from typing import Any
from apps.crops.models import Crop
from apps.crops.services import input_ranges
from apps.nutrition.models import NutritionEntry
from apps.schemes.models import Scheme
from .guides import CURATED_GUIDES


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()


def extract_scheme_chunks() -> list[dict[str, Any]]:
    """Extract and format chunks from all active government schemes."""
    chunks = []
    schemes = (
        Scheme.objects.all()
        .select_related("category", "state")
        .prefetch_related("farmer_types")
    )
    for s in schemes:
        text_parts = [
            f"Government Agricultural Scheme: {s.name}",
            f"Level: {s.get_level_display()}",
        ]
        if s.state:
            text_parts.append(f"Target State: {s.state.name}")
        if s.category:
            text_parts.append(f"Category: {s.category.name}")

        farmer_types = [ft.name for ft in s.farmer_types.all()]
        if farmer_types:
            text_parts.append(f"Target Farmer Beneficiaries: {', '.join(farmer_types)}")

        if s.short_description:
            text_parts.append(f"Summary: {s.short_description}")
        if s.description:
            text_parts.append(f"Details: {s.description}")
        if s.benefits:
            text_parts.append(f"Benefits & Financial Assistance: {s.benefits}")
        if s.eligibility:
            text_parts.append(f"Eligibility Criteria: {s.eligibility}")
        if s.documents_required:
            text_parts.append(f"Required Documents: {s.documents_required}")
        if s.how_to_apply:
            text_parts.append(f"Application Guidelines: {s.how_to_apply}")
        if s.official_url:
            text_parts.append(f"Official Application Portal: {s.official_url}")

        full_text = "\n".join(text_parts)
        chunks.append(
            {
                "source_type": "scheme",
                "source_id": f"scheme:{s.slug}",
                "chunk_index": 0,
                "title": s.name,
                "url": s.official_url or f"/schemes/{s.slug}",
                "language": "en",
                "text": full_text,
                "content_hash": _hash_text(full_text),
            }
        )
    return chunks


def extract_crop_chunks() -> list[dict[str, Any]]:
    """Extract and format chunks from all crops and physiological ranges."""
    chunks = []
    global_ranges = input_ranges()
    crops = Crop.objects.filter(is_active=True)

    for c in crops:
        text_parts = [
            f"Crop Profile: {c.name_en} (key: {c.key})",
            f"Category: {c.get_category_display() if hasattr(c, 'get_category_display') else c.category}",
        ]
        if c.description_en:
            text_parts.append(f"Agronomic Description: {c.description_en}")

        # Add crop-specific ideal ranges if present
        if c.ideal_ranges:
            range_strs = []
            for param, bounds in c.ideal_ranges.items():
                if isinstance(bounds, dict) and "min" in bounds and "max" in bounds:
                    range_strs.append(f"{param}: {bounds['min']} to {bounds['max']}")
            if range_strs:
                text_parts.append(
                    f"Crop-Specific Ideal Ranges: {', '.join(range_strs)}"
                )

        # Add global training bounds
        text_parts.append(
            "KrishiSetu CRS Model Input Domain: "
            f"Nitrogen (N) {global_ranges.get('N', {}).get('min', 0)}-{global_ranges.get('N', {}).get('max', 140)} kg/ha, "
            f"Phosphorus (P) {global_ranges.get('P', {}).get('min', 5)}-{global_ranges.get('P', {}).get('max', 145)} kg/ha, "
            f"Potassium (K) {global_ranges.get('K', {}).get('min', 5)}-{global_ranges.get('K', {}).get('max', 205)} kg/ha, "
            f"Temperature {global_ranges.get('temperature', {}).get('min', 8.8)}-{global_ranges.get('temperature', {}).get('max', 43.7)}°C, "
            f"Humidity {global_ranges.get('humidity', {}).get('min', 14.3)}-{global_ranges.get('humidity', {}).get('max', 100.0)}%, "
            f"pH {global_ranges.get('ph', {}).get('min', 3.5)}-{global_ranges.get('ph', {}).get('max', 9.9)}, "
            f"Rainfall {global_ranges.get('rainfall', {}).get('min', 20.2)}-{global_ranges.get('rainfall', {}).get('max', 298.6)} mm."
        )

        full_text = "\n".join(text_parts)
        chunks.append(
            {
                "source_type": "crop",
                "source_id": f"crop:{c.key}",
                "chunk_index": 0,
                "title": f"Crop: {c.name_en}",
                "url": f"/recommend?crop={c.key}",
                "language": "en",
                "text": full_text,
                "content_hash": _hash_text(full_text),
            }
        )
    return chunks


def extract_nutrition_chunks() -> list[dict[str, Any]]:
    """Extract and format chunks from USDA verified crop nutrition entries."""
    chunks = []
    entries = NutritionEntry.objects.all().select_related("crop")

    for n in entries:
        crop_name = n.crop.name_en
        crop_key = n.crop.key
        form_label = n.get_form_display()
        title = f"{crop_name} Nutrition ({form_label})"
        text_parts = [
            f"Crop Nutritional Profile: {crop_name} (Form: {form_label})",
            f"Official Food Item: {n.food_item_name}",
        ]

        if not n.is_food:
            text_parts.append(
                f"Non-Food Commercial Crop Notice: {crop_name} is cultivated as an industrial/textile "
                "fiber or commercial crop, not an edible dietary food product. Therefore, nutritional macro/micronutrient "
                "values are not applicable."
            )
        else:
            text_parts.append("Nutritional Values (per 100g edible portion):")
            if n.energy_kcal is not None:
                text_parts.append(f"- Energy: {n.energy_kcal} kcal")
            if n.protein_g is not None:
                text_parts.append(f"- Protein: {n.protein_g} g")
            if n.carbohydrate_g is not None:
                text_parts.append(f"- Total Carbohydrate: {n.carbohydrate_g} g")
            if n.fiber_g is not None:
                text_parts.append(f"- Dietary Fiber: {n.fiber_g} g")
            if n.fat_g is not None:
                text_parts.append(f"- Total Fat: {n.fat_g} g")
            if n.sugars_g is not None:
                text_parts.append(f"- Sugars: {n.sugars_g} g")
            if n.calcium_mg is not None:
                text_parts.append(f"- Calcium: {n.calcium_mg} mg")
            if n.iron_mg is not None:
                text_parts.append(f"- Iron: {n.iron_mg} mg")
            if n.vitamin_c_mg is not None:
                text_parts.append(f"- Vitamin C: {n.vitamin_c_mg} mg")
            if n.potassium_mg is not None:
                text_parts.append(f"- Potassium: {n.potassium_mg} mg")

            if n.is_default and n.form == "cooked":
                text_parts.append(
                    f"Staple Crop Note: {crop_name} is consumed after cooking. "
                    "Cooking expands moisture content, lowering calorie and protein density per 100g compared to raw grain."
                )

        text_parts.append(
            f"Source Provenance: {n.source} (Item ID: {n.source_id or 'USDA SR Legacy'}). Public domain open data."
        )

        full_text = "\n".join(text_parts)
        chunks.append(
            {
                "source_type": "nutrition",
                "source_id": f"nutrition:{crop_key}:{n.form}",
                "chunk_index": 0,
                "title": title,
                "url": f"/nutrition?crop={crop_key}",
                "language": "en",
                "text": full_text,
                "content_hash": _hash_text(full_text),
            }
        )
    return chunks


def extract_guide_chunks() -> list[dict[str, Any]]:
    """Extract and format chunks from curated agricultural guides."""
    chunks = []
    for g in CURATED_GUIDES:
        chunks.append(
            {
                "source_type": "guide",
                "source_id": g["source_id"],
                "chunk_index": 0,
                "title": g["title"],
                "url": g["url"],
                "language": "en",
                "text": g["text"],
                "content_hash": _hash_text(g["text"]),
            }
        )
    return chunks


def build_all_knowledge_chunks() -> list[dict[str, Any]]:
    """Aggregate all knowledge chunks across all 4 verified source domains."""
    all_chunks = []
    all_chunks.extend(extract_scheme_chunks())
    all_chunks.extend(extract_crop_chunks())
    all_chunks.extend(extract_nutrition_chunks())
    all_chunks.extend(extract_guide_chunks())
    return all_chunks
