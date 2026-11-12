import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloudRain } from 'lucide-react';
import type { DailyForecastItem } from './types';
import { renderConditionIcon } from './WeatherCard';

interface ForecastStripProps {
  daily: DailyForecastItem[];
}

export const ForecastStrip: React.FC<ForecastStripProps> = ({ daily }) => {
  const { t, i18n } = useTranslation();

  const formatDayName = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(i18n.language, { weekday: 'short' });
    } catch {
      return dateStr;
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-soil">
        {t('weather.forecast.title')}
      </h3>

      <ul
        role="list"
        aria-label={t('weather.forecast.title')}
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3"
      >
        {daily.map((item) => (
          <li
            key={item.date}
            className="flex flex-col items-center justify-between p-3.5 bg-white border border-mist rounded-xl shadow-xs hover:border-leaf/50 transition-colors text-center"
          >
            <div>
              <span className="block font-semibold text-soil text-sm">
                {formatDayName(item.date)}
              </span>
              <span className="block text-xs text-soil/80 mb-2">
                {formatDateDisplay(item.date)}
              </span>
            </div>

            <div className="my-2 p-2 bg-mist/30 rounded-xl flex items-center justify-center">
              {renderConditionIcon(item.condition, 'w-8 h-8')}
            </div>

            <span className="text-xs text-soil/80 line-clamp-1 mb-2 font-medium">
              {t(`weather.conditions.${item.condition}`, { defaultValue: item.condition })}
            </span>

            <div className="w-full pt-2 border-t border-mist flex items-center justify-between text-xs font-medium">
              <span className="text-danger font-bold">{Math.round(item.temp_max)}°</span>
              <span className="text-gray-400">/</span>
              <span className="text-info font-bold">{Math.round(item.temp_min)}°</span>
            </div>

            {item.precipitation_sum > 0 ? (
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-info font-medium">
                <CloudRain className="w-3 h-3" aria-hidden="true" />
                <span>{item.precipitation_sum} mm</span>
              </div>
            ) : (
              <div className="mt-1.5 text-[11px] text-gray-400">0 mm</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
