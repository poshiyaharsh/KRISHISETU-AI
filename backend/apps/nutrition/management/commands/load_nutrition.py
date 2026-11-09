"""Idempotent management command to load cleaned crop nutrition data into the database."""

import csv
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.crops.models import Crop
from apps.nutrition.models import NutritionEntry


def parse_decimal(val: str):
    if not val or val.strip().lower() in ("", "none", "null"):
        return None
    try:
        return Decimal(str(val).strip())
    except InvalidOperation:
        return None


def parse_bool(val: str) -> bool:
    return str(val).strip().lower() in ("true", "1", "yes")


def parse_date(val: str):
    if not val or val.strip().lower() in ("", "none", "null"):
        return None
    try:
        return datetime.strptime(str(val).strip(), "%Y-%m-%d").date()
    except ValueError:
        return None


class Command(BaseCommand):
    help = "Loads curated crop nutrition entries from data/nutrition/nutrition_clean.csv into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="",
            help="Optional custom path to nutrition_clean.csv file",
        )

    def handle(self, *args, **options):
        custom_file = options.get("file")
        if custom_file:
            csv_path = Path(custom_file)
        else:
            csv_path = (
                settings.BASE_DIR.parent / "data" / "nutrition" / "nutrition_clean.csv"
            )

        if not csv_path.exists():
            self.stderr.write(
                self.style.ERROR(f"Nutrition data file not found at: {csv_path}")
            )
            return

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        created_count = 0
        updated_count = 0
        skipped_count = 0

        with transaction.atomic():
            for row in rows:
                crop_key = row["crop_key"].strip()
                form = row["form"].strip()

                try:
                    crop = Crop.objects.get(key=crop_key)
                except Crop.DoesNotExist:
                    self.stderr.write(
                        self.style.WARNING(
                            f"Crop '{crop_key}' not found in database. Skipping row."
                        )
                    )
                    skipped_count += 1
                    continue

                defaults = {
                    "food_item_name": row.get("food_item_name", "").strip(),
                    "basis": row.get("basis", "per_100g").strip(),
                    "is_food": parse_bool(row.get("is_food", "true")),
                    "is_default": parse_bool(row.get("is_default", "false")),
                    "energy_kcal": parse_decimal(row.get("energy_kcal")),
                    "protein_g": parse_decimal(row.get("protein_g")),
                    "carbohydrate_g": parse_decimal(row.get("carbohydrate_g")),
                    "fiber_g": parse_decimal(row.get("fiber_g")),
                    "fat_g": parse_decimal(row.get("fat_g")),
                    "sugars_g": parse_decimal(row.get("sugars_g")),
                    "iron_mg": parse_decimal(row.get("iron_mg")),
                    "calcium_mg": parse_decimal(row.get("calcium_mg")),
                    "vitamin_c_mg": parse_decimal(row.get("vitamin_c_mg")),
                    "potassium_mg": parse_decimal(row.get("potassium_mg")),
                    "source": row.get("source", "USDA FoodData Central").strip(),
                    "source_id": row.get("source_id", "").strip(),
                    "source_url": row.get("source_url", "").strip(),
                    "retrieved_on": parse_date(row.get("retrieved_on")),
                    "license": row.get("license", "").strip(),
                    "notes": row.get("notes", "").strip(),
                }

                obj, created = NutritionEntry.objects.update_or_create(
                    crop=crop,
                    form=form,
                    defaults=defaults,
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully loaded nutrition data: {created_count} created, {updated_count} updated, {skipped_count} skipped."
            )
        )
