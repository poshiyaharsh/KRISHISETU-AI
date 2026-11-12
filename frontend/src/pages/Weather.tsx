import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CloudSun, AlertTriangle, RefreshCw } from 'lucide-react';
import { LocationPicker } from '../features/weather/LocationPicker';
import { WeatherCard } from '../features/weather/WeatherCard';
import { ForecastStrip } from '../features/weather/ForecastStrip';
import { ForecastChart } from '../features/weather/ForecastChart';
import { WeatherAlerts } from '../features/weather/WeatherAlerts';
import { fetchWeather } from '../features/weather/api';
import { Skeleton } from '../components/Skeleton/Skeleton';
import type { SelectedLocation } from '../features/weather/types';

const STORAGE_KEY = 'krishisetu_weather_location';

const DEFAULT_LOCATION: SelectedLocation = {
  label: 'Rajkot, Gujarat',
  latitude: 22.3,
  longitude: 70.8,
};

export const Weather: React.FC = () => {
  const { t } = useTranslation();

  const [location, setLocation] = useState<SelectedLocation>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_LOCATION;
  });

  const handleSelectLocation = (newLoc: SelectedLocation) => {
    setLocation(newLoc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
    } catch {
      // ignore storage errors
    }
  };

  const {
    data: weatherData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['weather', location?.latitude, location?.longitude, location?.districtId],
    queryFn: () =>
      fetchWeather({
        lat: location.latitude,
        lon: location.longitude,
        district: location.districtId,
      }),
    staleTime: 1000 * 60 * 15, // 15 mins
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mist/60 text-soil text-xs font-semibold">
          <CloudSun className="w-4 h-4 text-leaf" aria-hidden="true" />
          <span>Weather Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-soil tracking-tight">
          {t('weather.title')}
        </h1>
        <p className="text-gray-600 max-w-2xl text-base sm:text-lg">
          {t('weather.subtitle')}
        </p>
      </div>

      {/* Location Picker */}
      <LocationPicker
        selectedLocation={location}
        onSelectLocation={handleSelectLocation}
      />

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6" aria-busy="true" aria-label="Loading weather data">
          <Skeleton height={220} className="rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} height={160} className="rounded-xl" />
            ))}
          </div>
          <Skeleton height={320} className="rounded-xl" />
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div
          role="alert"
          className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-base">Unable to load weather forecast</h2>
              <p className="text-sm text-red-700 mt-0.5">
                {error instanceof Error ? error.message : t('errors.network')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Weather Content */}
      {weatherData && !isLoading && (
        <div className="space-y-8">
          {/* Rule-based Agronomic Alerts */}
          <WeatherAlerts daily={weatherData.daily} />

          {/* Current Weather Card */}
          <WeatherCard
            current={weatherData.current}
            stale={weatherData.stale}
            fetchedAt={weatherData.fetched_at}
            locationName={location.label}
          />

          {/* 7-Day Forecast Cards */}
          <ForecastStrip daily={weatherData.daily} />

          {/* Forecast Chart */}
          <ForecastChart daily={weatherData.daily} />

          {/* Attribution Footer */}
          <footer className="pt-6 border-t border-mist text-center text-xs text-soil/80">
            <p>
              {t('weather.attribution')}{' '}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-paddy font-medium underline hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-paddy rounded"
              >
                Open-Meteo.com
              </a>
            </p>
          </footer>
        </div>
      )}
    </div>
  );
};

export default Weather;
