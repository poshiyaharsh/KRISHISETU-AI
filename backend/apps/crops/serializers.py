"""
Serializers for Crop models and ML recommendation endpoints.
"""

from rest_framework import serializers
from apps.crops.models import Crop
from apps.crops.services import get_ml_engine


class CropRecommendationRequestSerializer(serializers.Serializer):
    """Input serializer for agricultural sensor/field readings."""

    nitrogen = serializers.FloatField(
        required=True,
        help_text="Nitrogen content in soil (kg/ha)",
    )
    phosphorus = serializers.FloatField(
        required=True,
        help_text="Phosphorus content in soil (kg/ha)",
    )
    potassium = serializers.FloatField(
        required=True,
        help_text="Potassium content in soil (kg/ha)",
    )
    temperature = serializers.FloatField(
        required=True,
        help_text="Temperature in degrees Celsius",
    )
    humidity = serializers.FloatField(
        required=True,
        help_text="Relative humidity in percentage",
    )
    ph = serializers.FloatField(
        required=True,
        help_text="Soil pH value",
    )
    rainfall = serializers.FloatField(
        required=True,
        help_text="Rainfall in millimeters",
    )

    def _validate_bounds(self, field_name: str, value: float) -> float:
        _, _, bounds, _ = get_ml_engine()
        if field_name in bounds:
            _, _, abs_min, abs_max, _ = bounds[field_name]
            if value < abs_min or value > abs_max:
                raise serializers.ValidationError(
                    f"Value {value} is out of absolute physiological range [{abs_min}, {abs_max}].",
                    code="out_of_range",
                )
        return value

    def validate_nitrogen(self, value: float) -> float:
        return self._validate_bounds("nitrogen", value)

    def validate_phosphorus(self, value: float) -> float:
        return self._validate_bounds("phosphorus", value)

    def validate_potassium(self, value: float) -> float:
        return self._validate_bounds("potassium", value)

    def validate_temperature(self, value: float) -> float:
        return self._validate_bounds("temperature", value)

    def validate_humidity(self, value: float) -> float:
        return self._validate_bounds("humidity", value)

    def validate_ph(self, value: float) -> float:
        return self._validate_bounds("ph", value)

    def validate_rainfall(self, value: float) -> float:
        return self._validate_bounds("rainfall", value)


class CropItemBriefSerializer(serializers.Serializer):
    """Lightweight crop identity representation in prediction results."""

    key = serializers.CharField()
    name = serializers.CharField()


class RecommendationResultItemSerializer(serializers.Serializer):
    """Ranked crop recommendation item."""

    rank = serializers.IntegerField()
    crop = CropItemBriefSerializer()
    score = serializers.FloatField()
    label = serializers.CharField()


class CropModelMetaSerializer(serializers.Serializer):
    """Metadata regarding model executing recommendation."""

    version = serializers.CharField()


class CropRecommendationResponseSerializer(serializers.Serializer):
    """Full recommendation API response schema."""

    request_id = serializers.UUIDField()
    results = RecommendationResultItemSerializer(many=True)
    warnings = serializers.ListField(child=serializers.CharField())
    model = CropModelMetaSerializer()


class CropListSerializer(serializers.ModelSerializer):
    """Catalog listing serializer for crops."""

    name = serializers.CharField(source="name_en", read_only=True)

    class Meta:
        model = Crop
        fields = ["key", "name", "category"]


class CropDetailSerializer(serializers.ModelSerializer):
    """Detailed crop profile serializer with ideal agronomic ranges."""

    name = serializers.CharField(source="name_en", read_only=True)
    description = serializers.CharField(source="description_en", read_only=True)

    class Meta:
        model = Crop
        fields = [
            "key",
            "name",
            "category",
            "description",
            "ideal_ranges",
            "is_active",
        ]


class InputRangeDetailSerializer(serializers.Serializer):
    """Parameter boundaries, physical limits, unit and step for form sliders."""

    min = serializers.FloatField()
    max = serializers.FloatField()
    absolute_min = serializers.FloatField()
    absolute_max = serializers.FloatField()
    unit = serializers.CharField()
    step = serializers.FloatField()
