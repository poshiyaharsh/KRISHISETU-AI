from django.contrib import admin
from apps.nutrition.models import NutritionEntry


@admin.register(NutritionEntry)
class NutritionEntryAdmin(admin.ModelAdmin):
    list_display = (
        "crop",
        "form",
        "is_food",
        "is_default",
        "energy_kcal",
        "protein_g",
        "carbohydrate_g",
        "fat_g",
        "source",
        "source_id",
    )
    list_filter = ("form", "is_food", "is_default", "source")
    search_fields = ("crop__key", "crop__name_en", "food_item_name", "source_id")
    readonly_fields = ("created_at", "updated_at")
