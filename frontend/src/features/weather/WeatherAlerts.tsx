import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloudRain, Wind, Sun } from 'lucide-react';
import type { DailyForecastItem } from './types';

interface WeatherAlertsProps {
  daily: DailyForecastItem[];
}

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ daily }) => {
  const { t } = useTranslation();

  if (!daily || daily.length === 0) return null;

  const alerts: Array<{
    id: string;
    icon: React.ReactNode;
    message: string;
    type: 'warning' | 'info';
  }> = [];

  // Heavy rain alert: max rain >= 25mm in 7-day or >= 20mm in next 2 days
  const maxRainDay = daily.reduce(
    (max, item) => (item.precipitation_sum > max.precipitation_sum ? item : max),
    daily[0]
  );
  if (maxRainDay.precipitation_sum >= 20) {
    alerts.push({
      id: 'heavy-rain',
      icon: <CloudRain className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />,
      message: t('weather.alerts.heavyRain', { rain: Math.round(maxRainDay.precipitation_sum) }),
      type: 'warning',
    });
  }

  // High wind alert: max wind >= 35 km/h
  const maxWindDay = daily.reduce(
    (max, item) => (item.wind_speed_max > max.wind_speed_max ? item : max),
    daily[0]
  );
  if (maxWindDay.wind_speed_max >= 35) {
    alerts.push({
      id: 'high-wind',
      icon: <Wind className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />,
      message: t('weather.alerts.highWind', { wind: Math.round(maxWindDay.wind_speed_max) }),
      type: 'warning',
    });
  }

  // Dry spell alert: 5 consecutive days < 1mm rain and temp_max >= 34
  const dryCondition =
    daily.slice(0, 5).every((d) => d.precipitation_sum < 1) &&
    daily.some((d) => d.temp_max >= 34);
  if (dryCondition) {
    alerts.push({
      id: 'dry-spell',
      icon: <Sun className="w-5 h-5 text-wheat shrink-0" aria-hidden="true" />,
      message: t('weather.alerts.drySpell'),
      type: 'info',
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3" role="region" aria-label="Agricultural Weather Alerts">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            alert.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          {alert.icon}
          <div className="text-sm leading-relaxed">
            <span className="font-semibold block mb-0.5">
              {alert.type === 'warning' ? 'Farm Weather Advisory' : 'Farming Tip'}
            </span>
            <span>{alert.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
