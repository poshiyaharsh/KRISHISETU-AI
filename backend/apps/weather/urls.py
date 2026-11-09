"""
URLs for Weather forecasting endpoint.
"""

from django.urls import path
from apps.weather.views import WeatherForecastView

urlpatterns = [
    path("", WeatherForecastView.as_view(), name="weather-forecast"),
]
