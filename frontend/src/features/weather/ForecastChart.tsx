import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DailyForecastItem } from './types';

interface ForecastChartProps {
  daily: DailyForecastItem[];
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  temp_max: number;
  temp_min: number;
  rainfall: number;
  rainProb: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ daily }) => {
  const { t, i18n } = useTranslation();

  const chartData: ChartDataPoint[] = daily.map((item) => {
    let displayDate = item.date;
    try {
      const d = new Date(item.date);
      displayDate = d.toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric' });
    } catch {
      // keep fallback
    }

    return {
      date: item.date,
      displayDate,
      temp_max: Math.round(item.temp_max),
      temp_min: Math.round(item.temp_min),
      rainfall: Number(item.precipitation_sum.toFixed(1)),
      rainProb: item.precipitation_probability,
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-md border border-mist p-6 space-y-4">
      <h3 className="text-lg font-bold text-soil">
        {t('weather.forecast.chartTitle')}
      </h3>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4ECDD" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E4ECDD' }}
            />
            {/* Left Y-axis: Temperature in °C */}
            <YAxis
              yAxisId="temp"
              orientation="left"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              unit="°"
            />
            {/* Right Y-axis: Precipitation in mm */}
            <YAxis
              yAxisId="rain"
              orientation="right"
              stroke="#2B6C8F"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              unit=" mm"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E4ECDD',
                boxShadow: '0 4px 12px rgba(15, 74, 50, 0.08)',
                fontSize: '12px',
              }}
              formatter={(value: unknown, name: unknown) => {
                const nameStr = String(name);
                if (nameStr === t('weather.forecast.tempMax') || nameStr === t('weather.forecast.tempMin')) {
                  return [`${value}°C`, nameStr];
                }
                if (nameStr === t('weather.forecast.rainfall')) {
                  return [`${value} mm`, nameStr];
                }
                return [String(value), nameStr];
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            />
            <Bar
              yAxisId="rain"
              dataKey="rainfall"
              name={t('weather.forecast.rainfall')}
              fill="#2B6C8F"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp_max"
              name={t('weather.forecast.tempMax')}
              stroke="#B3402F"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#B3402F' }}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp_min"
              name={t('weather.forecast.tempMin')}
              stroke="#236E3B"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#236E3B' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
