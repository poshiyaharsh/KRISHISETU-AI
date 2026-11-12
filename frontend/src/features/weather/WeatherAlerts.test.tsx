import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherAlerts } from './WeatherAlerts';
import type { DailyForecastItem } from './types';
import '@/i18n';

const baseDay = (overrides: Partial<DailyForecastItem> = {}): DailyForecastItem => ({
  date: '2026-11-12',
  temp_max: 30,
  temp_min: 20,
  precipitation_sum: 0,
  precipitation_probability: 10,
  wind_speed_max: 15,
  weather_code: 0,
  condition: 'clear',
  et0: 4.0,
  ...overrides,
});

describe('WeatherAlerts Component', () => {
  it('renders nothing when daily forecast is empty or has no severe alerts', () => {
    const { container: emptyContainer } = render(<WeatherAlerts daily={[]} />);
    expect(emptyContainer).toBeEmptyDOMElement();

    const mildWeek = [baseDay({ temp_max: 29, precipitation_sum: 2, wind_speed_max: 12 })];
    const { container: mildContainer } = render(<WeatherAlerts daily={mildWeek} />);
    expect(mildContainer).toBeEmptyDOMElement();
  });

  it('renders heavy rain alert when precipitation >= 20mm', () => {
    const rainyWeek = [baseDay({ precipitation_sum: 32.4 })];
    render(<WeatherAlerts daily={rainyWeek} />);
    expect(screen.getByRole('region', { name: /Agricultural Weather Alerts/i })).toBeInTheDocument();
    expect(screen.getByText(/Farm Weather Advisory/i)).toBeInTheDocument();
    expect(screen.getByText(/32/)).toBeInTheDocument();
  });

  it('renders high wind alert when wind speed >= 35 km/h', () => {
    const windyWeek = [baseDay({ wind_speed_max: 42.6 })];
    render(<WeatherAlerts daily={windyWeek} />);
    expect(screen.getByText(/Farm Weather Advisory/i)).toBeInTheDocument();
    expect(screen.getByText(/43/)).toBeInTheDocument();
  });

  it('renders dry spell alert when 5 days have < 1mm rain and temp_max >= 34', () => {
    const dryWeek = [
      baseDay({ temp_max: 36, precipitation_sum: 0 }),
      baseDay({ temp_max: 35, precipitation_sum: 0 }),
      baseDay({ temp_max: 34, precipitation_sum: 0.5 }),
      baseDay({ temp_max: 33, precipitation_sum: 0 }),
      baseDay({ temp_max: 34, precipitation_sum: 0 }),
    ];
    render(<WeatherAlerts daily={dryWeek} />);
    expect(screen.getByText(/Farming Tip/i)).toBeInTheDocument();
  });
});
