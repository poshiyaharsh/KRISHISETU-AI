"""
Serializers for Weather endpoints schema output.
"""

from rest_framework import serializers


class CurrentWeatherSerializer(serializers.Serializer):
    temperature = serializers.FloatField()
    relative_humidity = serializers.FloatField()
    wind_speed = serializers.FloatField()
    precipitation = serializers.FloatField()
    weather_code = serializers.IntegerField()
    condition = serializers.CharField()


class DailyForecastItemSerializer(serializers.Serializer):
    date = serializers.CharField()
    temp_max = serializers.FloatField()
    temp_min = serializers.FloatField()
    precipitation_sum = serializers.FloatField()
    precipitation_probability_max = serializers.FloatField()
    wind_speed_max = serializers.FloatField()
    weather_code = serializers.IntegerField()
    condition = serializers.CharField()
    et0_evapotranspiration = serializers.FloatField()


class WeatherForecastResponseSerializer(serializers.Serializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    timezone = serializers.CharField()
    fetched_at = serializers.CharField()
    stale = serializers.BooleanField()
    current = CurrentWeatherSerializer()
    daily = DailyForecastItemSerializer(many=True)
    provider = serializers.CharField()
    attribution = serializers.CharField()
