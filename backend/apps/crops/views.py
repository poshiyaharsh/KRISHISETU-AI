"""
Views for crop recommendations, catalog discovery, and agronomic input ranges.
"""

import hashlib
import uuid
from typing import Any

from django.conf import settings
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.crops.models import Crop, PredictionRecord
from apps.crops.serializers import (
    CropDetailSerializer,
    CropListSerializer,
    CropRecommendationRequestSerializer,
    CropRecommendationResponseSerializer,
    InputRangeDetailSerializer,
)
from apps.crops.services import input_ranges, recommend


def _get_client_ip(request: Request) -> str:
    """Extract client IP address, respecting reverse proxies."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def _hash_client_ip(request: Request) -> str:
    """Create a salted SHA-256 hash of the client IP to preserve farmer privacy."""
    ip = _get_client_ip(request)
    if not ip:
        return ""
    salt = getattr(settings, "SECRET_KEY", "krishisetu-salt")
    return hashlib.sha256(f"{salt}:{ip}".encode("utf-8")).hexdigest()


def _get_recommendation_label(score: float) -> str:
    """Determine confidence label based on configured thresholds."""
    thresholds = getattr(
        settings,
        "CROP_RECOMMENDATION_THRESHOLDS",
        {"STRONGLY_RECOMMENDED": 0.70, "RECOMMENDED": 0.35},
    )
    if score >= thresholds.get("STRONGLY_RECOMMENDED", 0.70):
        return "strongly_recommended"
    if score >= thresholds.get("RECOMMENDED", 0.35):
        return "recommended"
    return "conditional"


class CropRecommendationView(APIView):
    """
    Generate top-3 crop recommendations based on soil NPK and atmospheric parameters.
    Saves an anonymized audit record of the prediction.
    """

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "recommend"

    @extend_schema(
        summary="Predict optimal crops",
        description="Analyzes soil and weather parameters and returns top-3 recommended crops with confidence scores.",
        request=CropRecommendationRequestSerializer,
        responses={
            200: CropRecommendationResponseSerializer,
            400: OpenApiResponse(
                description="Validation error (out-of-range or missing values)"
            ),
            429: OpenApiResponse(description="Rate limit exceeded"),
            503: OpenApiResponse(description="ML model unavailable"),
        },
    )
    def post(self, request: Request) -> Response:
        serializer = CropRecommendationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_inputs = serializer.validated_data

        # Run prediction engine
        prediction_result = recommend(validated_inputs)

        # Map crop keys to registered names in database
        crops_in_db = {
            c.key: c.name_en
            for c in Crop.objects.filter(
                key__in=[item.crop for item in prediction_result.results]
            )
        }

        results_payload: list[dict[str, Any]] = []
        for item in prediction_result.results:
            crop_key = item.crop.lower()
            crop_name = crops_in_db.get(crop_key, crop_key.capitalize())
            label = _get_recommendation_label(item.score)
            results_payload.append(
                {
                    "rank": item.rank,
                    "crop": {
                        "key": crop_key,
                        "name": crop_name,
                    },
                    "score": round(item.score, 4),
                    "label": label,
                }
            )

        request_id = str(uuid.uuid4())
        client_hash = _hash_client_ip(request)

        # Audit log prediction record (linking to authenticated farmer if logged in)
        user = (
            request.user
            if getattr(request, "user", None) and request.user.is_authenticated
            else None
        )
        record = PredictionRecord.objects.create(
            user=user,
            nitrogen=validated_inputs["nitrogen"],
            phosphorus=validated_inputs["phosphorus"],
            potassium=validated_inputs["potassium"],
            temperature=validated_inputs["temperature"],
            humidity=validated_inputs["humidity"],
            ph=validated_inputs["ph"],
            rainfall=validated_inputs["rainfall"],
            results=results_payload,
            warnings=prediction_result.warnings,
            model_version=prediction_result.model_version,
            client_hash=client_hash,
        )

        response_data = {
            "request_id": request_id,
            "prediction_id": record.id,
            "results": results_payload,
            "warnings": prediction_result.warnings,
            "model": {
                "version": prediction_result.model_version,
            },
        }

        return Response(response_data, status=status.HTTP_200_OK)


class CropListView(APIView):
    """List all active crops in the advisory catalog."""

    @extend_schema(
        summary="List active crops",
        description="Returns lightweight identifiers and categories for all crops in the knowledge catalog.",
        responses={200: CropListSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        crops = Crop.objects.filter(is_active=True).order_by("name_en")
        serializer = CropListSerializer(crops, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CropDetailView(APIView):
    """Retrieve detailed agronomic profile and ideal ranges for a specific crop."""

    @extend_schema(
        summary="Get crop details",
        description="Returns factual agronomic profile, category, and ideal growth parameter ranges for a single crop.",
        responses={
            200: CropDetailSerializer,
            404: OpenApiResponse(description="Crop not found"),
        },
    )
    def get(self, request: Request, key: str) -> Response:
        crop = get_object_or_404(Crop, key=key.lower(), is_active=True)
        serializer = CropDetailSerializer(crop)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InputRangesView(APIView):
    """Retrieve single-source-of-truth input parameter ranges, steps, and units for frontend forms."""

    @extend_schema(
        summary="Get input parameter ranges",
        description="Returns training boundaries, physical limits, units, and slider step increments for the 7 inputs.",
        responses={200: InputRangeDetailSerializer(many=False)},
    )
    def get(self, request: Request) -> Response:
        ranges = input_ranges()
        return Response(ranges, status=status.HTTP_200_OK)
