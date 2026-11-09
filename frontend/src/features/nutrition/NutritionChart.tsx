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

const CROP_COLORS = ['#126A08', '#93C810', '#FAC13E'];

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
      className="rounded-xl border border-soil/15 bg-white p-4 shadow-sm dark:border-soil/30 dark:bg-soil/20 sm:p-6"
      role="region"
      aria-label={t('nutrition.chart_aria_label', 'Macronutrient breakdown chart')}
    >
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-soil dark:text-cream">
            {t('nutrition.macro_breakdown', 'Macronutrient Breakdown (grams per 100g)')}
          </h3>
          <p className="text-xs text-soil/60 dark:text-cream/60">
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              interval={0}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              unit="g"
            />
            <Tooltip
              formatter={(value?: number | string) => [`${value ?? 0} g`, '']}
              contentStyle={{
                backgroundColor: '#02280C',
                color: '#F5F0DC',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
              }}
            />
            {isComparison && comparisonCrops ? (
              <>
                <Legend verticalAlign="top" height={36} />
                {comparisonCrops.map((c, idx) => (
                  <Bar
                    key={c.crop_key}
                    dataKey={c.crop_name}
                    fill={CROP_COLORS[idx % CROP_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </>
            ) : (
              <Bar
                dataKey="amount"
                name={cropName}
                fill="#126A08"
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
