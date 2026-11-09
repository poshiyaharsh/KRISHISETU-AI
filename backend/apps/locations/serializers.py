"""
Serializers for States, Districts, and Open-Meteo Geocoding search results.
"""

from rest_framework import serializers
from apps.locations.models import District, State


class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ["id", "name", "code", "lat", "lon"]


class DistrictSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source="state.name", read_only=True)

    class Meta:
        model = District
        fields = ["id", "name", "state", "state_name", "lat", "lon"]


class LocationSearchResultSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    name = serializers.CharField()
    state = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    country = serializers.CharField(default="India")
