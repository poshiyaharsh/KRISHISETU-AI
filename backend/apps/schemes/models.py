from django.db import models


class SchemeCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Scheme Category"
        verbose_name_plural = "Scheme Categories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class FarmerType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)

    class Meta:
        verbose_name = "Farmer Type"
        verbose_name_plural = "Farmer Types"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Scheme(models.Model):
    LEVEL_CHOICES = [
        ("central", "Central"),
        ("state", "State"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("unknown", "Unknown"),
    ]

    slug = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=255)
    short_description = models.CharField(max_length=500)
    description = models.TextField()

    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="central")
    state = models.ForeignKey(
        "locations.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="schemes",
        help_text="Target State for state-level schemes; null for central schemes",
    )
    department = models.CharField(max_length=255)
    category = models.ForeignKey(
        SchemeCategory,
        on_delete=models.PROTECT,
        related_name="schemes",
    )
    farmer_types = models.ManyToManyField(
        FarmerType,
        related_name="schemes",
        blank=True,
    )

    eligibility = models.TextField(help_text="Farmer eligibility criteria")
    benefits = models.TextField(
        help_text="Financial, physical or technical benefits provided"
    )
    documents_required = models.TextField(help_text="Required verification documents")
    how_to_apply = models.TextField(help_text="Application procedure and guidelines")

    official_url = models.URLField(
        max_length=500, help_text="Official application or portal URL"
    )
    source_name = models.CharField(max_length=120, default="myScheme / GoI")
    source_url = models.URLField(
        max_length=500, help_text="Official source verification URL"
    )
    source_id = models.CharField(
        max_length=100, unique=True, help_text="Unique ID from source"
    )
    last_verified_on = models.DateField(
        help_text="Date when official information was verified"
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Government Scheme"
        verbose_name_plural = "Government Schemes"
        ordering = ["-last_verified_on", "name"]
        indexes = [
            models.Index(fields=["status", "level"]),
            models.Index(fields=["category", "status"]),
            models.Index(fields=["state", "status"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_level_display()})"
