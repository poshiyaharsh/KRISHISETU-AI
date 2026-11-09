"""
Schemas and WMO weather condition code mappings for normalized agricultural weather.
"""

from dataclasses import asdict, dataclass
from typing import Any

# WMO Weather interpretation codes (WW)
WMO_CONDITION_MAP: dict[int, str] = {
    0: "clear",
    1: "mainly_clear",
    2: "partly_cloudy",
    3: "overcast",
    45: "fog",
    48: "fog",
    51: "drizzle",
    53: "drizzle",
    55: "drizzle",
    56: "drizzle",
    57: "drizzle",
    61: "rain",
    63: "rain",
    65: "heavy_rain",
    66: "rain",
    67: "heavy_rain",
    71: "snow",
    73: "snow",
    75: "snow",
    77: "snow",
    80: "rain",
    81: "heavy_rain",
    82: "heavy_rain",
    85: "snow",
    86: "snow",
    95: "thunderstorm",
    96: "thunderstorm",
    99: "thunderstorm",
}


def map_wmo_code_to_condition(code: int) -> str:
    """Safely map numerical WMO weather code to standard condition identifier."""
    return WMO_CONDITION_MAP.get(code, "unknown")


@dataclass(frozen=True)
class CurrentWeather:
    temperature: float
    relative_humidity: float
    wind_speed: float
    precipitation: float
    weather_code: int
    condition: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class DailyForecastItem:
    date: str
    temp_max: float
    temp_min: float
    precipitation_sum: float
    precipitation_probability_max: float
    wind_speed_max: float
    weather_code: int
    condition: str
    et0_evapotranspiration: float

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class WeatherForecast:
    latitude: float
    longitude: float
    timezone: str
    fetched_at: str
    stale: bool
    current: CurrentWeather
    daily: list[DailyForecastItem]
    provider: str = "Open-Meteo"
    attribution: str = (
        "Weather data provided by Open-Meteo (Non-Commercial Agricultural Advisory)"
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timezone": self.timezone,
            "fetched_at": self.fetched_at,
            "stale": self.stale,
            "current": self.current.to_dict(),
            "daily": [d.to_dict() for d in self.daily],
            "provider": self.provider,
            "attribution": self.attribution,
        }
