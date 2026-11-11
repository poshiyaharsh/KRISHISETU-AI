import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherCard } from './WeatherCard';
import type { CurrentWeather } from './types';
import '@/i18n';

describe('WeatherCard Component', () => {
  const mockCurrent: CurrentWeather = {
    temperature: 28.4,
    relative_humidity: 65,
    wind_speed: 12,
    precipitation: 1.5,
    weather_code: 0,
    condition: 'clear',
  };

  it('renders solid background fallback and gradient with cream text', () => {
    const { container } = render(
      <WeatherCard
        current={mockCurrent}
        locationName="Rajkot, Gujarat"
        fetchedAt="2026-11-11T10:00:00Z"
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-paddy');
    expect(card).toHaveClass('text-cream');
    expect(card.style.backgroundColor).toBe('var(--ks-color-paddy)');
    expect(card.style.backgroundImage).toContain('linear-gradient');
    expect(card.style.backgroundImage).toContain('var(--ks-color-paddy)');
    expect(card.style.backgroundImage).toContain('var(--ks-color-paddy-light)');

    // Title and location
    expect(screen.getByText('Rajkot, Gujarat')).toBeInTheDocument();
    expect(screen.getByText('Rajkot, Gujarat')).toHaveClass('text-cream');
  });

  it('renders large 56px bold temperature and condition icon', () => {
    render(
      <WeatherCard
        current={mockCurrent}
        locationName="Rajkot, Gujarat"
        fetchedAt="2026-11-11T10:00:00Z"
      />
    );

    const tempElement = screen.getByText('28°C');
    expect(tempElement).toBeInTheDocument();
    expect(tempElement.className).toContain('text-[56px]');
    expect(tempElement.className).toContain('font-bold');
    expect(tempElement.className).toContain('text-cream');
  });

  it('renders stat tiles with high contrast labels and bold values', () => {
    render(
      <WeatherCard
        current={mockCurrent}
        locationName="Rajkot, Gujarat"
      />
    );

    // Humidity
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('65%')).toHaveClass('text-2xl', 'font-bold', 'text-cream');

    // Wind
    expect(screen.getByText('12 km/h')).toBeInTheDocument();
    expect(screen.getByText('12 km/h')).toHaveClass('text-2xl', 'font-bold', 'text-cream');

    // Rain
    expect(screen.getByText('1.5 mm')).toBeInTheDocument();
    expect(screen.getByText('1.5 mm')).toHaveClass('text-2xl', 'font-bold', 'text-cream');
  });
});
