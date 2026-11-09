"""Models for crop nutritional profiles and dietary composition."""

from django.db import models


class NutritionForm(models.TextChoices):
    RAW = "raw", "Raw (Dry/Fresh)"
    COOKED = "cooked", "Cooked / Boiled"
    BREWED = "brewed", "Brewed"
    NON_FOOD = "non_food", "Not a Food Crop"


class NutritionEntry(models.Model):
    """Nutritional profile per 100g edible portion for a supported agricultural crop."""

    crop = models.ForeignKey(
        "crops.Crop",
        on_delete=models.CASCADE,
        related_name="nutrition_entries",
        help_text="Associated crop from CRS catalog",
    )
    food_item_name = models.CharField(
        max_length=255,
        help_text="Standardized item name from source database (e.g., Apples, raw, with skin)",
    )
    form = models.CharField(
        max_length=32,
        choices=NutritionForm.choices,
        default=NutritionForm.RAW,
        help_text="Physical consumption state (raw, cooked, brewed, or non_food)",
    )
    basis = models.CharField(
        max_length=32,
        default="per_100g",
        help_text="Standard dietary measurement basis (always per 100 g edible portion)",
    )
    is_food = models.BooleanField(
        default=True,
        help_text="Whether this crop is an edible food crop (false for cotton, jute)",
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Default form to display in user interface (e.g. cooked for pulses/rice)",
    )

    # Core Macro-nutrients (per 100g)
    energy_kcal = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Energy in kilocalories (kcal) per 100g",
    )
    protein_g = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Protein in grams (g) per 100g",
    )
    carbohydrate_g = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Carbohydrate by difference in grams (g) per 100g",
    )
    fiber_g = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total dietary fiber in grams (g) per 100g",
    )
    fat_g = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total lipid (fat) in grams (g) per 100g",
    )
    sugars_g = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total sugars in grams (g) per 100g",
    )

    # Key Micronutrients (per 100g)
    iron_mg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Iron (Fe) in milligrams (mg) per 100g",
    )
    calcium_mg = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Calcium (Ca) in milligrams (mg) per 100g",
    )
    vitamin_c_mg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Vitamin C (total ascorbic acid) in milligrams (mg) per 100g",
    )
    potassium_mg = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Potassium (K) in milligrams (mg) per 100g",
    )

    # Provenance and Source Tracking
    source = models.CharField(
        max_length=128,
        default="USDA FoodData Central",
        help_text="Name of the official source repository",
    )
    source_id = models.CharField(
        max_length=64,
        default="",
        help_text="Unique identifier in source repository (e.g. FDC ID)",
    )
    source_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        help_text="Direct link to source entry or catalog page",
    )
    retrieved_on = models.DateField(
        null=True,
        blank=True,
        help_text="Date data was retrieved from source",
    )
    license = models.CharField(
        max_length=128,
        default="Public Domain (U.S. Government Work)",
        help_text="Data license or public domain attribution",
    )
    notes = models.TextField(
        blank=True,
        default="",
        help_text="Agronomic or dietary justification notes",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Nutrition Entry"
        verbose_name_plural = "Nutrition Entries"
        unique_together = ("crop", "form")
        ordering = ["crop__key", "-is_default", "form"]

    def __str__(self) -> str:
        return f"{self.crop.name_en} ({self.form})"
