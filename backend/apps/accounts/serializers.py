"""
Serializers for accounts, authentication, and farmer profiles.
"""

from rest_framework import serializers

from .models import FarmerProfile, FarmPlot, User


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
    class Meta:
        model = FarmPlot
        fields = [
            "id",
            "name",
            "area_value",
            "area_unit",
            "soil_type",
            "district",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


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
