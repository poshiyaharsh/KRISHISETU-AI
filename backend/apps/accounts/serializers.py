"""
Serializers for accounts, authentication, and farmer profiles.
"""

from rest_framework import serializers

from apps.crops.models import PredictionRecord
from .models import FarmerProfile, FarmPlot, SavedScheme, User


class RequestCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        help_text="Farmer email address for verification code",
    )
    language = serializers.CharField(
        max_length=10,
        default="en",
        required=False,
        help_text="Preferred language for the verification email (en, hi, gu)",
    )


class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(
        min_length=6,
        max_length=6,
        required=True,
        help_text="6-digit numerical verification code",
    )
    language = serializers.CharField(
        max_length=10,
        default="en",
        required=False,
    )


class RefreshTokenSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(
        required=True,
        help_text="Opaque 64-character refresh token",
    )


class FarmPlotSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source="district.name", read_only=True)

    class Meta:
        model = FarmPlot
        fields = [
            "id",
            "name",
            "area_value",
            "area_unit",
            "soil_type",
            "district",
            "district_name",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_area_value(self, value):
        if value <= 0:
            raise serializers.ValidationError("Plot area must be a positive number.")
        return value


class FarmerProfileSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source="state.name", read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)
    farmer_type_name = serializers.CharField(source="farmer_type.name", read_only=True)

    class Meta:
        model = FarmerProfile
        fields = [
            "display_name",
            "preferred_language",
            "state",
            "state_name",
            "district",
            "district_name",
            "farmer_type",
            "farmer_type_name",
            "land_area_value",
            "land_area_unit",
            "primary_irrigation_source",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class SavedSchemeSerializer(serializers.ModelSerializer):
    scheme_id = serializers.IntegerField(source="scheme.id", read_only=True)
    slug = serializers.CharField(source="scheme.slug", read_only=True)
    name = serializers.CharField(source="scheme.name", read_only=True)
    short_description = serializers.CharField(
        source="scheme.short_description", read_only=True
    )
    category = serializers.CharField(source="scheme.category.name", read_only=True)
    category_slug = serializers.CharField(source="scheme.category.slug", read_only=True)
    level = serializers.CharField(source="scheme.level", read_only=True)
    official_url = serializers.CharField(source="scheme.official_url", read_only=True)

    class Meta:
        model = SavedScheme
        fields = [
            "id",
            "scheme_id",
            "slug",
            "name",
            "short_description",
            "category",
            "category_slug",
            "level",
            "official_url",
            "created_at",
        ]
        read_only_fields = fields


class AddSavedSchemeSerializer(serializers.Serializer):
    scheme_slug = serializers.CharField(
        required=False, help_text="Slug of the scheme to bookmark"
    )
    scheme_id = serializers.IntegerField(
        required=False, help_text="Numeric ID of the scheme to bookmark"
    )

    def validate(self, attrs):
        if not attrs.get("scheme_slug") and not attrs.get("scheme_id"):
            raise serializers.ValidationError(
                "Either scheme_slug or scheme_id must be provided."
            )
        return attrs


class PredictionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionRecord
        fields = [
            "id",
            "nitrogen",
            "phosphorus",
            "potassium",
            "temperature",
            "humidity",
            "ph",
            "rainfall",
            "results",
            "warnings",
            "model_version",
            "created_at",
        ]
        read_only_fields = fields


class ClaimHistorySerializer(serializers.Serializer):
    prediction_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        help_text="List of anonymous prediction record IDs to claim",
    )


class UserSerializer(serializers.ModelSerializer):
    profile = FarmerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "is_active",
            "created_at",
            "last_login",
            "consented_at",
            "consent_version",
            "profile",
        ]
        read_only_fields = fields
