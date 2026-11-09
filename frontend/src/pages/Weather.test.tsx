import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Weather } from './Weather';
import * as weatherApi from '../features/weather/api';
import type { WeatherResponse } from '../features/weather/types';
import '@/i18n';

vi.mock('../features/weather/api', () => ({
  fetchWeather: vi.fn(),
  fetchStates: vi.fn().mockResolvedValue([]),
  fetchDistricts: vi.fn().mockResolvedValue([]),
  searchLocations: vi.fn().mockResolvedValue([]),
}));

const mockWeatherResponse: WeatherResponse = {
  latitude: 22.3,
  longitude: 70.8,
  timezone: 'Asia/Kolkata',
  fetched_at: '2026-11-09T10:00:00Z',
  stale: false,
  current: {
    temperature: 28.5,
    relative_humidity: 62.0,
    wind_speed: 14.2,
    precipitation: 0.0,
    weather_code: 0,
    condition: 'clear',
  },
  daily: [
    {
      date: '2026-11-09',
      temp_max: 32.0,
      temp_min: 21.0,
      precipitation_sum: 0.0,
      precipitation_probability: 5,
      wind_speed_max: 15.0,
      weather_code: 0,
      condition: 'clear',
      et0: 4.5,
    },
    {
      date: '2026-11-10',
      temp_max: 31.5,
      temp_min: 20.5,
      precipitation_sum: 2.0,
      precipitation_probability: 40,
      wind_speed_max: 18.0,
      weather_code: 61,
      condition: 'rain',
      et0: 3.8,
    },
  ],
};

const renderWeather = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Weather />
    </QueryClientProvider>
  );
};

describe('Weather Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders page heading and current weather card when data loads', async () => {
    vi.mocked(weatherApi.fetchWeather).mockResolvedValue(mockWeatherResponse);

    renderWeather();

    expect(screen.getByRole('heading', { level: 1, name: /Hyperlocal Weather Intelligence/i })).toBeInTheDocument();

    await waitFor(() => {
      // 28.5 rounds to 29°C
      expect(screen.getByText('29°C')).toBeInTheDocument();
      expect(screen.getByText('62%')).toBeInTheDocument();
      expect(screen.getByText('14 km/h')).toBeInTheDocument();
      expect(screen.getAllByText('0 mm').length).toBeGreaterThan(0);
    });
  });

  it('renders 7-day forecast items as accessible list', async () => {
    vi.mocked(weatherApi.fetchWeather).mockResolvedValue(mockWeatherResponse);

    renderWeather();

    await waitFor(() => {
      const forecastList = screen.getByRole('list', { name: /7-Day Agricultural Forecast/i });
      expect(forecastList).toBeInTheDocument();
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(2);
    });
  });

  it('renders stale notice when response has stale=true', async () => {
    vi.mocked(weatherApi.fetchWeather).mockResolvedValue({
      ...mockWeatherResponse,
      stale: true,
    });

    renderWeather();

    await waitFor(() => {
      expect(
        screen.getByText(/Showing cached weather data due to temporary provider unavailability./i)
      ).toBeInTheDocument();
    });
  });

  it('renders Open-Meteo attribution link in footer', async () => {
    vi.mocked(weatherApi.fetchWeather).mockResolvedValue(mockWeatherResponse);

    renderWeather();

    await waitFor(() => {
      const attributionLink = screen.getByRole('link', { name: /Open-Meteo.com/i });
      expect(attributionLink).toHaveAttribute('href', 'https://open-meteo.com/');
    });
  });

  it('renders error state and allows retry', async () => {
    vi.mocked(weatherApi.fetchWeather).mockRejectedValue(new Error('Network error'));

    renderWeather();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Unable to load weather forecast/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });
  });
});
