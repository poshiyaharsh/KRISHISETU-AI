"""Serializers for crop nutrition profiles and comparative nutrient breakdowns."""

from rest_framework import serializers
from apps.nutrition.models import NutritionEntry


class NutrientValuesSerializer(serializers.Serializer):
    """Core macronutrients and micronutrients per 100g edible portion."""

    energy_kcal = serializers.FloatField(allow_null=True)
    protein_g = serializers.FloatField(allow_null=True)
    carbohydrate_g = serializers.FloatField(allow_null=True)
    fiber_g = serializers.FloatField(allow_null=True)
    fat_g = serializers.FloatField(allow_null=True)
    sugars_g = serializers.FloatField(allow_null=True)
    iron_mg = serializers.FloatField(allow_null=True)
    calcium_mg = serializers.FloatField(allow_null=True)
    vitamin_c_mg = serializers.FloatField(allow_null=True)
    potassium_mg = serializers.FloatField(allow_null=True)


class SourceMetadataSerializer(serializers.Serializer):
    """Provenance and licensing metadata for dietary source."""

    name = serializers.CharField()
    id = serializers.CharField()
    url = serializers.CharField()
    retrieved_on = serializers.DateField(allow_null=True)
    license = serializers.CharField()


class NutritionEntryDetailSerializer(serializers.ModelSerializer):
    """Detailed nutrition profile for a single consumption form."""

    form_label = serializers.CharField(source="get_form_display")
    nutrients = serializers.SerializerMethodField()
    source = serializers.SerializerMethodField()

    class Meta:
        model = NutritionEntry
        fields = [
            "form",
            "form_label",
            "food_item_name",
            "basis",
            "is_default",
            "is_food",
            "nutrients",
            "source",
            "notes",
        ]

    def get_nutrients(self, obj: NutritionEntry) -> dict:
        return {
            "energy_kcal": float(obj.energy_kcal)
            if obj.energy_kcal is not None
            else None,
            "protein_g": float(obj.protein_g) if obj.protein_g is not None else None,
            "carbohydrate_g": float(obj.carbohydrate_g)
            if obj.carbohydrate_g is not None
            else None,
            "fiber_g": float(obj.fiber_g) if obj.fiber_g is not None else None,
            "fat_g": float(obj.fat_g) if obj.fat_g is not None else None,
            "sugars_g": float(obj.sugars_g) if obj.sugars_g is not None else None,
            "iron_mg": float(obj.iron_mg) if obj.iron_mg is not None else None,
            "calcium_mg": float(obj.calcium_mg) if obj.calcium_mg is not None else None,
            "vitamin_c_mg": float(obj.vitamin_c_mg)
            if obj.vitamin_c_mg is not None
            else None,
            "potassium_mg": float(obj.potassium_mg)
            if obj.potassium_mg is not None
            else None,
        }

    def get_source(self, obj: NutritionEntry) -> dict:
        return {
            "name": obj.source,
            "id": obj.source_id,
            "url": obj.source_url,
            "retrieved_on": obj.retrieved_on,
            "license": obj.license,
        }


class CropNutritionResponseSerializer(serializers.Serializer):
    """Complete nutritional response for a single crop."""

    crop_key = serializers.CharField()
    crop_name = serializers.CharField()
    food_crop = serializers.BooleanField()
    message = serializers.CharField(required=False, allow_blank=True)
    default_form = serializers.CharField(required=False, allow_null=True)
    entries = NutritionEntryDetailSerializer(many=True)


class CropComparisonItemSerializer(serializers.Serializer):
    """Individual crop profile inside a comparison response."""

    crop_key = serializers.CharField()
    crop_name = serializers.CharField()
    food_crop = serializers.BooleanField()
    form = serializers.CharField()
    form_label = serializers.CharField()
    food_item_name = serializers.CharField()
    basis = serializers.CharField()
    nutrients = NutrientValuesSerializer()
    source = SourceMetadataSerializer()
    notes = serializers.CharField()


class NutritionCompareResponseSerializer(serializers.Serializer):
    """Comparative nutritional profile response across up to 3 crops."""

    crops = CropComparisonItemSerializer(many=True)
