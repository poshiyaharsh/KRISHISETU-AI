"""
Models for crops and farmer prediction audit records.
"""

from django.db import models


class CropCategory(models.TextChoices):
    CEREAL = "cereal", "Cereal"
    PULSE = "pulse", "Pulse"
    FRUIT = "fruit", "Fruit"
    FIBRE = "fibre", "Fibre"
    BEVERAGE = "beverage", "Beverage"
    OTHER = "other", "Other"


class Crop(models.Model):
    """
    Master crop record containing factual agronomic profiles and ideal growth ranges.
    """

    key = models.SlugField(
        max_length=64,
        unique=True,
        help_text="Canonical lower-case slug identifier matching ML class label (e.g. rice)",
    )
    name_en = models.CharField(
        max_length=128,
        help_text="English display name of the crop (e.g. Rice)",
    )
    category = models.CharField(
        max_length=32,
        choices=CropCategory.choices,
        default=CropCategory.OTHER,
        help_text="Broad agronomic crop category",
    )
    description_en = models.TextField(
        blank=True,
        default="",
        help_text="Factual agronomic overview and climatic suitability",
    )
    ideal_ranges = models.JSONField(
        default=dict,
        blank=True,
        help_text="Per-crop ideal min and max parameter ranges derived from training distribution",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this crop is active in the advisory catalog",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name_en"]
        verbose_name = "Crop"
        verbose_name_plural = "Crops"

    def __str__(self) -> str:
        return f"{self.name_en} ({self.key})"


class PredictionRecord(models.Model):
    """
    Audit log of crop prediction requests for quality evaluation and usage analytics.
    Farmer privacy is preserved: raw IP addresses are salted and hashed.
    """

    nitrogen = models.FloatField(help_text="Soil Nitrogen (N) kg/ha")
    phosphorus = models.FloatField(help_text="Soil Phosphorus (P) kg/ha")
    potassium = models.FloatField(help_text="Soil Potassium (K) kg/ha")
    temperature = models.FloatField(help_text="Temperature °C")
    humidity = models.FloatField(help_text="Relative humidity %")
    ph = models.FloatField(help_text="Soil pH level")
    rainfall = models.FloatField(help_text="Rainfall mm")

    results = models.JSONField(
        default=list,
        help_text="Top 3 predicted crop recommendations with scores and labels",
    )
    warnings = models.JSONField(
        default=list,
        blank=True,
        help_text="Agronomic input range warnings emitted during prediction",
    )
    model_version = models.CharField(
        max_length=64,
        help_text="Identifier of the model version executing the prediction",
    )
    client_hash = models.CharField(
        max_length=64,
        blank=True,
        default="",
        help_text="Salted SHA-256 hash of client IP for privacy-preserving rate analytics",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Prediction Record"
        verbose_name_plural = "Prediction Records"

    def __str__(self) -> str:
        return f"Prediction at {self.created_at.strftime('%Y-%m-%d %H:%M:%S')} (Model: {self.model_version})"
