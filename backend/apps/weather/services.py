"""
Weather service layer communicating with Open-Meteo API.
Implements retry logic, timeouts, and normalization to WeatherForecast schema.
"""

from datetime import UTC, datetime
import logging
from typing import Any
from django.conf import settings
import requests
from apps.weather.schemas import (
    CurrentWeather,
    DailyForecastItem,
    WeatherForecast,
    map_wmo_code_to_condition,
)

logger = logging.getLogger(__name__)

OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


class WeatherServiceError(Exception):
    """Raised when weather API cannot be reached or returns invalid response."""


def fetch_forecast_from_provider(lat: float, lon: float) -> WeatherForecast:
    """
    Fetch current conditions and 7-day forecast from Open-Meteo.
    Retries once on timeout or transient failure.
    """
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "precipitation",
            "weather_code",
        ],
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max",
            "wind_speed_10m_max",
            "weather_code",
            "et0_fao_evapotranspiration",
        ],
        "timezone": "Asia/Kolkata",
        "forecast_days": 7,
    }

    timeout = getattr(settings, "WEATHER_REQUEST_TIMEOUT", 5)
    last_error: Exception | None = None

    for attempt in range(2):
        try:
            resp = requests.get(OPEN_METEO_FORECAST_URL, params=params, timeout=timeout)
            resp.raise_for_status()
            data = resp.json()
            return parse_open_meteo_response(data, lat, lon)
        except Exception as err:
            last_error = err
            logger.warning(
                "Open-Meteo request attempt %d failed for lat=%f, lon=%f: %s",
                attempt + 1,
                lat,
                lon,
                err,
            )

    raise WeatherServiceError(f"Failed to fetch forecast from Open-Meteo after 2 attempts: {last_error}")


def parse_open_meteo_response(data: dict[str, Any], requested_lat: float, requested_lon: float) -> WeatherForecast:
    """Normalize raw Open-Meteo response into typed WeatherForecast."""
    current_raw = data.get("current", {})
    daily_raw = data.get("daily", {})

    current_wmo = current_raw.get("weather_code", -1)
    current = CurrentWeather(
        temperature=float(current_raw.get("temperature_2m", 0.0)),
        relative_humidity=float(current_raw.get("relative_humidity_2m", 0.0)),
        wind_speed=float(current_raw.get("wind_speed_10m", 0.0)),
        precipitation=float(current_raw.get("precipitation", 0.0)),
        weather_code=int(current_wmo),
        condition=map_wmo_code_to_condition(current_wmo),
    )

    dates = daily_raw.get("time", [])
    temp_maxes = daily_raw.get("temperature_2m_max", [])
    temp_mins = daily_raw.get("temperature_2m_min", [])
    precip_sums = daily_raw.get("precipitation_sum", [])
    precip_probs = daily_raw.get("precipitation_probability_max", [])
    wind_maxes = daily_raw.get("wind_speed_10m_max", [])
    weather_codes = daily_raw.get("weather_code", [])
    et0_values = daily_raw.get("et0_fao_evapotranspiration", [])

    daily_items: list[DailyForecastItem] = []
    for i in range(len(dates)):
        wmo = int(weather_codes[i]) if i < len(weather_codes) and weather_codes[i] is not None else -1
        daily_items.append(
            DailyForecastItem(
                date=dates[i],
                temp_max=float(temp_maxes[i]) if i < len(temp_maxes) else 0.0,
                temp_min=float(temp_mins[i]) if i < len(temp_mins) else 0.0,
                precipitation_sum=float(precip_sums[i]) if i < len(precip_sums) else 0.0,
                precipitation_probability_max=float(precip_probs[i]) if i < len(precip_probs) and precip_probs[i] is not None else 0.0,
                wind_speed_max=float(wind_maxes[i]) if i < len(wind_maxes) else 0.0,
                weather_code=wmo,
                condition=map_wmo_code_to_condition(wmo),
                et0_evapotranspiration=float(et0_values[i]) if i < len(et0_values) and et0_values[i] is not None else 0.0,
            )
        )

    now_utc = datetime.now(UTC).isoformat()
    return WeatherForecast(
        latitude=float(data.get("latitude", requested_lat)),
        longitude=float(data.get("longitude", requested_lon)),
        timezone=str(data.get("timezone", "Asia/Kolkata")),
        fetched_at=now_utc,
        stale=False,
        current=current,
        daily=daily_items,
    )
