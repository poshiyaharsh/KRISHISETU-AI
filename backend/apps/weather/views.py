"""
Views for location-based current weather and 7-day forecast with caching and stale fallback.
"""

import logging
from typing import Any
from django.conf import settings
from django.core.cache import cache
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.locations.models import District
from apps.weather.schemas import WeatherForecast
from apps.weather.serializers import WeatherForecastResponseSerializer
from apps.weather.services import WeatherServiceError, fetch_forecast_from_provider

logger = logging.getLogger(__name__)


class WeatherForecastView(APIView):
    """
    Retrieve current weather and 7-day agricultural forecast.
    Accepts latitude/longitude or district ID.
    Caches results for 30 minutes. Falls back to stale cache on upstream failure.
    """

    @extend_schema(
        summary="Get 7-day weather forecast",
        description="Returns current conditions and 7-day daily agricultural forecast from Open-Meteo with 30-min cache.",
        parameters=[
            OpenApiParameter(name="lat", description="Latitude coordinate", required=False, type=float),
            OpenApiParameter(name="lon", description="Longitude coordinate", required=False, type=float),
            OpenApiParameter(name="district", description="District ID", required=False, type=int),
        ],
        responses={
            200: WeatherForecastResponseSerializer,
            400: OpenApiResponse(description="Invalid coordinates or missing location parameter"),
            404: OpenApiResponse(description="District not found"),
            503: OpenApiResponse(description="Weather provider unavailable"),
        },
    )
    def get(self, request: Request) -> Response:
        lat_param = request.query_params.get("lat")
        lon_param = request.query_params.get("lon")
        district_id = request.query_params.get("district")

        lat: float | None = None
        lon: float | None = None

        if district_id:
            try:
                district = District.objects.get(id=district_id)
                lat, lon = district.lat, district.lon
            except District.DoesNotExist:
                return Response(
                    {
                        "error": {
                            "code": "not_found",
                            "message": f"District with ID {district_id} does not exist.",
                            "fields": {"district": ["not_found"]},
                        }
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif lat_param is not None and lon_param is not None:
            try:
                lat = float(lat_param)
                lon = float(lon_param)
                if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
                    raise ValueError("Coordinates out of range")
            except (ValueError, TypeError):
                return Response(
                    {
                        "error": {
                            "code": "validation_error",
                            "message": "Invalid latitude or longitude coordinates.",
                            "fields": {"coordinates": ["invalid_range"]},
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Please provide either district ID or lat and lon coordinates.",
                        "fields": {"location": ["required"]},
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cache key rounded to 2 decimals
        cache_key = f"weather:{round(lat, 2)}:{round(lon, 2)}"
        stale_cache_key = f"{cache_key}:stale_backup"
        ttl = getattr(settings, "WEATHER_CACHE_TTL", 1800)

        # 1. Return fresh cached copy if present
        cached_data: dict[str, Any] | None = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        # 2. Query upstream provider
        try:
            forecast: WeatherForecast = fetch_forecast_from_provider(lat, lon)
            data = forecast.to_dict()

            # Store in fresh cache and stale backup
            cache.set(cache_key, data, timeout=ttl)
            cache.set(stale_cache_key, data, timeout=ttl * 12)  # Backup persists 6 hours

            return Response(data, status=status.HTTP_200_OK)
        except WeatherServiceError as err:
            logger.error("Weather provider failed: %s", err)

            # 3. Fallback to stale backup if available
            stale_data: dict[str, Any] | None = cache.get(stale_cache_key)
            if stale_data:
                stale_data["stale"] = True
                return Response(stale_data, status=status.HTTP_200_OK)

            # 4. Standard 503 error if no cache exists
            return Response(
                {
                    "error": {
                        "code": "weather_unavailable",
                        "message": "Weather service is temporarily unavailable. Please try again shortly.",
                        "fields": {},
                    }
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
