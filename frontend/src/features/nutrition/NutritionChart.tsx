import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CropComparisonItem, NutrientValues } from './types';

interface NutritionChartProps {
  nutrients?: NutrientValues;
  comparisonCrops?: CropComparisonItem[];
  cropName?: string;
}

const CROP_COLORS = ['#0F4A32', '#3B8E4F', '#D9A93F'];

export const NutritionChart: React.FC<NutritionChartProps> = ({
  nutrients,
  comparisonCrops,
  cropName = 'Crop',
}) => {
  const { t } = useTranslation();

  const isComparison = Boolean(comparisonCrops && comparisonCrops.length > 0);

  // Prepare chart data: 4 macronutrient categories
  const chartData = [
    {
      nutrient: t('nutrition.protein', 'Protein'),
      key: 'protein_g',
      unit: 'g',
    },
    {
      nutrient: t('nutrition.carbohydrate', 'Carbohydrate'),
      key: 'carbohydrate_g',
      unit: 'g',
    },
    {
      nutrient: t('nutrition.fiber', 'Dietary Fiber'),
      key: 'fiber_g',
      unit: 'g',
    },
    {
      nutrient: t('nutrition.fat', 'Total Fat'),
      key: 'fat_g',
      unit: 'g',
    },
  ].map((item) => {
    if (isComparison && comparisonCrops) {
      const row: Record<string, string | number | null> = {
        name: item.nutrient,
        unit: item.unit,
      };
      comparisonCrops.forEach((c) => {
        row[c.crop_name] = c.nutrients[item.key as keyof NutrientValues] ?? 0;
      });
      return row;
    }
    return {
      name: item.nutrient,
      amount: nutrients?.[item.key as keyof NutrientValues] ?? 0,
      unit: item.unit,
    };
  });

  return (
    <div
      className="rounded-xl border border-soil/15 bg-white p-4 shadow-sm sm:p-6"
      role="region"
      aria-label={t('nutrition.chart_aria_label', 'Macronutrient breakdown chart')}
    >
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-heading">
            {t('nutrition.macro_breakdown', 'Macronutrient Breakdown (grams per 100g)')}
          </h3>
          <p className="text-xs text-muted">
            {t(
              'nutrition.macro_subtitle',
              'Compares major nutrients on equal scale. Energy (kcal) is displayed separately.'
            )}
          </p>
        </div>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4ECDD" />
            <XAxis
              dataKey="name"
              stroke="#4D6854"
              tick={{ fill: '#1D2B22', fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              stroke="#4D6854"
              tick={{ fill: '#1D2B22', fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              unit="g"
            />
            <Tooltip
              formatter={(value) => [`${value ?? 0} g`, '']}
              contentStyle={{
                backgroundColor: '#0F4A32',
                color: '#F5F0DC',
                borderRadius: '8px',
                border: '1px solid #D9A93F',
                fontSize: '12px',
                fontWeight: 500,
              }}
              itemStyle={{ color: '#F5F0DC' }}
              labelStyle={{ color: '#D9A93F', fontWeight: 700 }}
            />
            {isComparison && comparisonCrops ? (
              <>
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ color: '#1D2B22', fontSize: '12px', fontWeight: 600 }}
                />
                {comparisonCrops.map((c, idx) => (
                  <Bar
                    key={c.crop_key}
                    dataKey={c.crop_name}
                    fill={CROP_COLORS[idx % CROP_COLORS.length]}
                    stroke={idx % CROP_COLORS.length === 2 ? '#8C5E06' : undefined}
                    strokeWidth={idx % CROP_COLORS.length === 2 ? 1 : 0}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </>
            ) : (
              <Bar
                dataKey="amount"
                name={cropName}
                fill="#0F4A32"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="sr-only">
        {t(
          'nutrition.chart_text_summary',
          'Macronutrient summary: Protein, Carbohydrate, Dietary Fiber, and Total Fat shown in grams per 100 grams edible portion.'
        )}
      </div>
    </div>
  );
};
