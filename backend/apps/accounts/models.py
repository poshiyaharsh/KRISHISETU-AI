"""
Models for user accounts, farmer profiles, farm plots, and saved resources.
"""

from django.db import models


class User(models.Model):
    """
    Farmer user account for passwordless email OTP authentication.
    Complies with India DPDP Act 2023 with audit timestamps and consent versioning.
    """

    email = models.EmailField(
        unique=True,
        max_length=255,
        db_index=True,
        help_text="Primary farmer email address for OTP authentication",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Designates whether this user account is active",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the account was registered",
    )
    last_login = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of the most recent successful login",
    )
    consented_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when privacy policy and data terms were accepted",
    )
    consent_version = models.CharField(
        max_length=32,
        default="1.0",
        help_text="Version of terms & privacy policy accepted by the user",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    def __str__(self) -> str:
        return self.email


class EmailVerificationOTP(models.Model):
    """
    Cryptographically secure, hashed 6-digit OTP for email verification.
    The plaintext code is NEVER stored in the database.
    """

    email = models.EmailField(db_index=True)
    salt = models.CharField(max_length=32)
    code_hash = models.CharField(max_length=64, help_text="SHA-256 hash of salt:code")
    attempts = models.PositiveSmallIntegerField(
        default=0,
        help_text="Number of failed verification attempts (max 5)",
    )
    expires_at = models.DateTimeField(help_text="OTP expiration time (10 min TTL)")
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Email OTP"
        verbose_name_plural = "Email OTPs"

    def __str__(self) -> str:
        return f"OTP for {self.email} ({'used' if self.is_used else 'active'})"


class RefreshToken(models.Model):
    """
    Opaque refresh token stored as SHA-256 hash with automatic rotation and revocation.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="refresh_tokens",
    )
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_revoked = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Refresh Token"
        verbose_name_plural = "Refresh Tokens"

    def __str__(self) -> str:
        return f"RefreshToken for {self.user.email} (revoked={self.is_revoked})"


class LandAreaUnit(models.TextChoices):
    ACRE = "acre", "Acre"
    HECTARE = "hectare", "Hectare"
    BIGHA = "bigha", "Bigha"
    GUNTHA = "guntha", "Guntha"


class IrrigationSource(models.TextChoices):
    RAINFED = "rainfed", "Rainfed"
    CANAL = "canal", "Canal"
    BOREWELL = "borewell", "Borewell / Tubewell"
    OPEN_WELL = "open_well", "Open Well"
    DRIP_SPRINKLER = "drip_sprinkler", "Drip / Sprinkler"
    OTHER = "other", "Other"


class SoilType(models.TextChoices):
    ALLUVIAL = "alluvial", "Alluvial Soil"
    BLACK = "black", "Black Soil (Regur)"
    RED_YELLOW = "red_yellow", "Red and Yellow Soil"
    LATERITE = "laterite", "Laterite Soil"
    ARID_DESERT = "arid_desert", "Arid / Desert Soil"
    SALINE = "saline", "Saline / Alkaline Soil"
    PEATY = "peaty", "Peaty / Organic Soil"
    CLAYEY = "clayey", "Clayey Soil"
    LOAMY = "loamy", "Loamy Soil"
    SANDY = "sandy", "Sandy Soil"
    OTHER = "other", "Other"


class FarmerProfile(models.Model):
    """
    Farmer demographic and agronomic profile linked 1:1 to User.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    display_name = models.CharField(
        max_length=128,
        blank=True,
        default="",
        help_text="Farmer's chosen display name or greeting name",
    )
    preferred_language = models.CharField(
        max_length=10,
        default="en",
        help_text="Preferred language code (e.g. en, hi, gu)",
    )
    state = models.ForeignKey(
        "locations.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="farmer_profiles",
    )
    district = models.ForeignKey(
        "locations.District",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="farmer_profiles",
    )
    farmer_type = models.ForeignKey(
        "schemes.FarmerType",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="farmer_profiles",
    )
    land_area_value = models.FloatField(
        null=True,
        blank=True,
        help_text="Total operational agricultural landholding",
    )
    land_area_unit = models.CharField(
        max_length=16,
        choices=LandAreaUnit.choices,
        default=LandAreaUnit.ACRE,
    )
    primary_irrigation_source = models.CharField(
        max_length=32,
        choices=IrrigationSource.choices,
        default=IrrigationSource.RAINFED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Farmer Profile"
        verbose_name_plural = "Farmer Profiles"

    def __str__(self) -> str:
        return f"Profile of {self.user.email} ({self.display_name or 'Unnamed'})"


class FarmPlot(models.Model):
    """
    Individual agricultural parcel / plot belonging to a farmer (max 5 per profile).
    """

    profile = models.ForeignKey(
        FarmerProfile,
        on_delete=models.CASCADE,
        related_name="plots",
    )
    name = models.CharField(
        max_length=128,
        help_text="Plot identifier name (e.g. North Orchard, Riverside Field)",
    )
    area_value = models.FloatField(help_text="Plot area size")
    area_unit = models.CharField(
        max_length=16,
        choices=LandAreaUnit.choices,
        default=LandAreaUnit.ACRE,
    )
    soil_type = models.CharField(
        max_length=32,
        choices=SoilType.choices,
        null=True,
        blank=True,
    )
    district = models.ForeignKey(
        "locations.District",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="farm_plots",
    )
    notes = models.TextField(
        blank=True,
        default="",
        help_text="Notes regarding soil, previous crops, or topography",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Farm Plot"
        verbose_name_plural = "Farm Plots"

    def __str__(self) -> str:
        return f"{self.name} ({self.area_value} {self.area_unit}) - {self.profile.user.email}"


class SavedScheme(models.Model):
    """
    Government scheme bookmarked by a farmer for quick access on dashboard.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="saved_schemes",
    )
    scheme = models.ForeignKey(
        "schemes.Scheme",
        on_delete=models.CASCADE,
        related_name="saved_by_users",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "scheme")
        verbose_name = "Saved Scheme"
        verbose_name_plural = "Saved Schemes"

    def __str__(self) -> str:
        return f"{self.user.email} -> {self.scheme.slug}"
