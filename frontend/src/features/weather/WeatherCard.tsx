import React from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, Wind, CloudRain, Clock, AlertCircle } from 'lucide-react';
import type { CurrentWeather } from './types';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain as RainIcon,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  CloudFog,
  HelpCircle,
} from 'lucide-react';

interface WeatherCardProps {
  current: CurrentWeather;
  stale?: boolean;
  fetchedAt?: string;
  locationName: string;
}

export function renderConditionIcon(condition: string, className = 'w-10 h-10') {
  switch (condition) {
    case 'clear':
      return <Sun className={`${className} text-wheat`} aria-hidden="true" />;
    case 'mainly_clear':
      return <CloudSun className={`${className} text-wheat`} aria-hidden="true" />;
    case 'partly_cloudy':
    case 'overcast':
      return <Cloud className={`${className} text-slate-400`} aria-hidden="true" />;
    case 'fog':
      return <CloudFog className={`${className} text-slate-400`} aria-hidden="true" />;
    case 'drizzle':
      return <CloudDrizzle className={`${className} text-sky-600`} aria-hidden="true" />;
    case 'rain':
    case 'heavy_rain':
      return <RainIcon className={`${className} text-sky-600`} aria-hidden="true" />;
    case 'snow':
      return <Snowflake className={`${className} text-blue-300`} aria-hidden="true" />;
    case 'thunderstorm':
      return <CloudLightning className={`${className} text-amber-500`} aria-hidden="true" />;
    default:
      return <HelpCircle className={`${className} text-slate-400`} aria-hidden="true" />;
  }
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  current,
  stale = false,
  fetchedAt,
  locationName,
}) => {
  const { t } = useTranslation();

  const formattedTime = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-gradient-to-br from-paddy/95 to-soil text-white rounded-xl shadow-md p-6 relative overflow-hidden">
      {stale && (
        <div
          role="status"
          className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-400/20 text-amber-200 border border-amber-300/30"
        >
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t('weather.current.staleNotice')}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-mist/80 font-semibold">
            {t('weather.current.title')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-cream">{locationName}</h2>
          <div className="flex items-center gap-2 mt-2 text-mist/90 text-sm">
            <span>{t(`weather.conditions.${current.condition}`, { defaultValue: current.condition })}</span>
            {formattedTime && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {formattedTime}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            {renderConditionIcon(current.condition, 'w-12 h-12')}
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            {Math.round(current.temperature)}°C
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
        <div className="flex flex-col items-center sm:items-start p-2.5 rounded-lg bg-white/5">
          <div className="flex items-center gap-1.5 text-xs text-mist/80 mb-1">
            <Droplets className="w-3.5 h-3.5 text-leaf" aria-hidden="true" />
            <span>{t('weather.current.humidity')}</span>
          </div>
          <span className="text-lg font-bold text-white">{Math.round(current.relative_humidity)}%</span>
        </div>

        <div className="flex flex-col items-center sm:items-start p-2.5 rounded-lg bg-white/5">
          <div className="flex items-center gap-1.5 text-xs text-mist/80 mb-1">
            <Wind className="w-3.5 h-3.5 text-sprout" aria-hidden="true" />
            <span>{t('weather.current.wind')}</span>
          </div>
          <span className="text-lg font-bold text-white">{Math.round(current.wind_speed)} km/h</span>
        </div>

        <div className="flex flex-col items-center sm:items-start p-2.5 rounded-lg bg-white/5">
          <div className="flex items-center gap-1.5 text-xs text-mist/80 mb-1">
            <CloudRain className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
            <span>{t('weather.current.rain')}</span>
          </div>
          <span className="text-lg font-bold text-white">{current.precipitation} mm</span>
        </div>
      </div>
    </div>
  );
};
