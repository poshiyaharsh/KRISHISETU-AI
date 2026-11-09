import json
import re
from pathlib import Path
from django.db.models import Q
from django.core.management.base import BaseCommand
from apps.locations.models import State
from apps.schemes.models import FarmerType, Scheme, SchemeCategory


def slugify_simple(text: str) -> str:
    text = re.sub(r"\([^)]*\)", "", text).strip()
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", text)


class Command(BaseCommand):
    help = "Idempotently load validated government schemes from data/schemes/schemes_clean.json into the database"

    def handle(self, *args, **options):
        # Resolve data path from backend directory
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        clean_path = base_dir / "data" / "schemes" / "schemes_clean.json"

        if not clean_path.exists():
            self.stderr.write(self.style.ERROR(f"Clean schemes data not found at: {clean_path}"))
            return

        with open(clean_path, "r", encoding="utf-8") as f:
            schemes_data = json.load(f)

        created_count = 0
        updated_count = 0

        for item in schemes_data:
            cat_name = item.get("category", "General Agriculture")
            cat_slug = slugify_simple(cat_name)
            category, _ = SchemeCategory.objects.get_or_create(
                slug=cat_slug,
                defaults={"name": cat_name},
            )

            state = None
            if item.get("state_code"):
                st_code = item["state_code"]
                state = State.objects.filter(
                    Q(code__iexact=st_code) | Q(code__iexact=f"IN-{st_code}")
                ).first()

            scheme, created = Scheme.objects.update_or_create(
                source_id=item["source_id"],
                defaults={
                    "slug": item["slug"],
                    "name": item["name"],
                    "short_description": item["short_description"],
                    "description": item["description"],
                    "level": item.get("level", "central"),
                    "state": state,
                    "department": item["department"],
                    "category": category,
                    "eligibility": item["eligibility"],
                    "benefits": item["benefits"],
                    "documents_required": item.get("documents_required", ""),
                    "how_to_apply": item.get("how_to_apply", ""),
                    "official_url": item["official_url"],
                    "source_name": item.get("source_name", "myScheme"),
                    "source_url": item["source_url"],
                    "last_verified_on": item["last_verified_on"],
                    "status": item.get("status", "active"),
                },
            )

            # Associate farmer types
            farmer_type_objs = []
            for ft_name in item.get("farmer_types", []):
                ft_slug = slugify_simple(ft_name)
                ft_obj, _ = FarmerType.objects.get_or_create(
                    slug=ft_slug,
                    defaults={"name": ft_name},
                )
                farmer_type_objs.append(ft_obj)
            scheme.farmer_types.set(farmer_type_objs)

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully loaded schemes: {created_count} created, {updated_count} updated. "
                f"Total in database: {Scheme.objects.count()}."
            )
        )
