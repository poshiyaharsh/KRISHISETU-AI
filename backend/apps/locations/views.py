"""
Views for State listing, District lookup, and Open-Meteo Indian village/town geocoding search.
"""

import logging
from typing import Any
from django.conf import settings
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
import requests
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.locations.models import District, State
from apps.locations.serializers import (
    DistrictSerializer,
    LocationSearchResultSerializer,
    StateSerializer,
)

logger = logging.getLogger(__name__)


class StateListView(APIView):
    """List all Indian states and union territories."""

    @extend_schema(
        summary="List all states",
        description="Returns all Indian states and union territories with centroid coordinates.",
        responses={200: StateSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        states = State.objects.all().order_by("name")
        serializer = StateSerializer(states, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DistrictListView(APIView):
    """List districts filtered by state ID."""

    @extend_schema(
        summary="List districts by state",
        description="Returns all agricultural districts belonging to the specified state ID.",
        parameters=[
            OpenApiParameter(
                name="state",
                description="ID of the State",
                required=False,
                type=int,
            )
        ],
        responses={200: DistrictSerializer(many=True)},
    )
    def get(self, request: Request) -> Response:
        state_id = request.query_params.get("state")
        queryset = District.objects.select_related("state").all()
        if state_id:
            queryset = queryset.filter(state_id=state_id)
        serializer = DistrictSerializer(queryset.order_by("name"), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LocationSearchView(APIView):
    """Free-text search for Indian towns and villages via Open-Meteo geocoding."""

    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        summary="Search Indian locations",
        description="Searches Indian towns, mandis, and villages via Open-Meteo Geocoding API (min 3 characters).",
        parameters=[
            OpenApiParameter(
                name="q",
                description="Place name search query (min 3 chars)",
                required=True,
                type=str,
            )
        ],
        responses={
            200: LocationSearchResultSerializer(many=True),
            400: OpenApiResponse(description="Query string too short"),
            503: OpenApiResponse(description="Geocoding service unavailable"),
        },
    )
    def get(self, request: Request) -> Response:
        query = request.query_params.get("q", "").strip()
        if len(query) < 3:
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Search query must be at least 3 characters.",
                        "fields": {"q": ["min_length_3"]},
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Open-Meteo Geocoding endpoint restricted to India (country_code=IN)
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": query,
            "count": 10,
            "language": "en",
            "format": "json",
            "country_code": "IN",
        }
        timeout = getattr(settings, "WEATHER_REQUEST_TIMEOUT", 5)

        try:
            resp = requests.get(url, params=params, timeout=timeout)
            resp.raise_for_status()
            data = resp.json()
            results_raw: list[dict[str, Any]] = data.get("results") or []

            # Format results
            formatted = []
            for item in results_raw:
                formatted.append(
                    {
                        "id": item.get("id"),
                        "name": item.get("name"),
                        "state": item.get("admin1", ""),
                        "latitude": item.get("latitude"),
                        "longitude": item.get("longitude"),
                        "country": "India",
                    }
                )

            return Response(formatted, status=status.HTTP_200_OK)
        except Exception as err:
            logger.error("Geocoding lookup failed for query '%s': %s", query, err)
            return Response(
                {
                    "error": {
                        "code": "service_unavailable",
                        "message": "Geocoding search service is temporarily unavailable.",
                        "fields": {},
                    }
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
