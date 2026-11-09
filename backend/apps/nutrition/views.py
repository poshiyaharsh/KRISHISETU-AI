"""Views for crop nutritional profiles and comparative dietary breakdowns."""

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.crops.models import Crop
from apps.nutrition.models import NutritionEntry
from apps.nutrition.serializers import (
    CropNutritionResponseSerializer,
    NutritionCompareResponseSerializer,
    NutritionEntryDetailSerializer,
)


class CropNutritionView(APIView):
    """Retrieve detailed per-100g nutritional profile and consumption forms for a specific crop."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "nutrition"

    @extend_schema(
        summary="Get crop nutrition profile",
        description=(
            "Returns factual per-100g nutritional composition (calories, macros, micronutrients, "
            "available forms such as raw and cooked, and source provenance) for a supported crop. "
            "Returns food_crop: false for non-edible crops like cotton and jute."
        ),
        responses={
            200: CropNutritionResponseSerializer,
            404: OpenApiResponse(description="Crop not found in knowledge catalog"),
        },
    )
    def get(self, request: Request, key: str) -> Response:
        crop = get_object_or_404(Crop, key=key.lower())
        entries = NutritionEntry.objects.filter(crop=crop).order_by(
            "-is_default", "form"
        )

        # Check if non-food crop
        non_food = entries.filter(is_food=False).exists()
        food_entries = [e for e in entries if e.is_food]

        if non_food or not food_entries:
            return Response(
                {
                    "crop_key": crop.key,
                    "crop_name": crop.name_en,
                    "food_crop": False,
                    "message": "Not a food crop",
                    "default_form": None,
                    "entries": [],
                },
                status=status.HTTP_200_OK,
            )

        default_entry = next((e for e in food_entries if e.is_default), food_entries[0])
        serializer = NutritionEntryDetailSerializer(food_entries, many=True)

        return Response(
            {
                "crop_key": crop.key,
                "crop_name": crop.name_en,
                "food_crop": True,
                "message": "",
                "default_form": default_entry.form,
                "entries": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class NutritionCompareView(APIView):
    """Compare nutritional values across up to 3 crops side-by-side."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "nutrition"

    @extend_schema(
        summary="Compare crop nutritional profiles",
        description="Returns comparative side-by-side macronutrient and micronutrient profiles for 1 to 3 crops.",
        parameters=[
            OpenApiParameter(
                name="crops",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Comma-separated crop keys to compare (e.g. 'rice,maize' or 'chickpea,lentil,kidneybeans'). Maximum 3.",
            ),
        ],
        responses={
            200: NutritionCompareResponseSerializer,
            400: OpenApiResponse(
                description="Missing parameter or more than 3 crops requested"
            ),
            404: OpenApiResponse(description="One or more requested crops not found"),
        },
    )
    def get(self, request: Request) -> Response:
        crops_param = request.query_params.get("crops", "").strip()
        if not crops_param:
            raise ValidationError(
                {
                    "crops": [
                        "The 'crops' parameter is required with at least 1 and at most 3 crop keys."
                    ]
                }
            )

        crop_keys = [k.strip().lower() for k in crops_param.split(",") if k.strip()]
        if not crop_keys:
            raise ValidationError(
                {"crops": ["At least 1 valid crop key must be provided."]}
            )

        if len(crop_keys) > 3:
            raise ValidationError(
                {"crops": ["Cannot compare more than 3 crops at once."]}
            )

        # De-duplicate while preserving order
        unique_keys = []
        for k in crop_keys:
            if k not in unique_keys:
                unique_keys.append(k)

        items = []
        for key in unique_keys:
            crop = Crop.objects.filter(key=key).first()
            if not crop:
                raise NotFound(f"Crop '{key}' not found.")

            entries = NutritionEntry.objects.filter(crop=crop).order_by(
                "-is_default", "form"
            )
            food_entries = [e for e in entries if e.is_food]

            if not food_entries:
                # Non-food crop
                items.append(
                    {
                        "crop_key": crop.key,
                        "crop_name": crop.name_en,
                        "food_crop": False,
                        "form": "non_food",
                        "form_label": "Not a Food Crop",
                        "food_item_name": "Not a food crop",
                        "basis": "per_100g",
                        "nutrients": {
                            "energy_kcal": None,
                            "protein_g": None,
                            "carbohydrate_g": None,
                            "fiber_g": None,
                            "fat_g": None,
                            "sugars_g": None,
                            "iron_mg": None,
                            "calcium_mg": None,
                            "vitamin_c_mg": None,
                            "potassium_mg": None,
                        },
                        "source": {
                            "name": "None",
                            "id": "NONE",
                            "url": "",
                            "retrieved_on": None,
                            "license": "None",
                        },
                        "notes": "Not a food crop",
                    }
                )
            else:
                entry = next((e for e in food_entries if e.is_default), food_entries[0])
                items.append(
                    {
                        "crop_key": crop.key,
                        "crop_name": crop.name_en,
                        "food_crop": True,
                        "form": entry.form,
                        "form_label": entry.get_form_display(),
                        "food_item_name": entry.food_item_name,
                        "basis": entry.basis,
                        "nutrients": {
                            "energy_kcal": float(entry.energy_kcal)
                            if entry.energy_kcal is not None
                            else None,
                            "protein_g": float(entry.protein_g)
                            if entry.protein_g is not None
                            else None,
                            "carbohydrate_g": float(entry.carbohydrate_g)
                            if entry.carbohydrate_g is not None
                            else None,
                            "fiber_g": float(entry.fiber_g)
                            if entry.fiber_g is not None
                            else None,
                            "fat_g": float(entry.fat_g)
                            if entry.fat_g is not None
                            else None,
                            "sugars_g": float(entry.sugars_g)
                            if entry.sugars_g is not None
                            else None,
                            "iron_mg": float(entry.iron_mg)
                            if entry.iron_mg is not None
                            else None,
                            "calcium_mg": float(entry.calcium_mg)
                            if entry.calcium_mg is not None
                            else None,
                            "vitamin_c_mg": float(entry.vitamin_c_mg)
                            if entry.vitamin_c_mg is not None
                            else None,
                            "potassium_mg": float(entry.potassium_mg)
                            if entry.potassium_mg is not None
                            else None,
                        },
                        "source": {
                            "name": entry.source,
                            "id": entry.source_id,
                            "url": entry.source_url,
                            "retrieved_on": entry.retrieved_on,
                            "license": entry.license,
                        },
                        "notes": entry.notes,
                    }
                )

        return Response({"crops": items}, status=status.HTTP_200_OK)
