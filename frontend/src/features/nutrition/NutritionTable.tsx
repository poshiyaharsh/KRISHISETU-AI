import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CropComparisonItem, NutrientValues } from './types';

interface NutritionTableProps {
  nutrients?: NutrientValues;
  comparisonCrops?: CropComparisonItem[];
}

interface NutrientDef {
  key: keyof NutrientValues;
  labelKey: string;
  unit: string;
  category: 'energy' | 'macro' | 'micro';
}

const NUTRIENT_DEFS: NutrientDef[] = [
  { key: 'energy_kcal', labelKey: 'nutrition.energy', unit: 'kcal', category: 'energy' },
  { key: 'protein_g', labelKey: 'nutrition.protein', unit: 'g', category: 'macro' },
  { key: 'carbohydrate_g', labelKey: 'nutrition.carbohydrate', unit: 'g', category: 'macro' },
  { key: 'fiber_g', labelKey: 'nutrition.fiber', unit: 'g', category: 'macro' },
  { key: 'fat_g', labelKey: 'nutrition.fat', unit: 'g', category: 'macro' },
  { key: 'sugars_g', labelKey: 'nutrition.sugars', unit: 'g', category: 'macro' },
  { key: 'iron_mg', labelKey: 'nutrition.iron', unit: 'mg', category: 'micro' },
  { key: 'calcium_mg', labelKey: 'nutrition.calcium', unit: 'mg', category: 'micro' },
  { key: 'vitamin_c_mg', labelKey: 'nutrition.vitamin_c', unit: 'mg', category: 'micro' },
  { key: 'potassium_mg', labelKey: 'nutrition.potassium', unit: 'mg', category: 'micro' },
];

export const NutritionTable: React.FC<NutritionTableProps> = ({
  nutrients,
  comparisonCrops,
}) => {
  const { t } = useTranslation();

  const isComparison = Boolean(comparisonCrops && comparisonCrops.length > 0);

  const formatValue = (val: number | null | undefined, unit: string): string => {
    if (val === null || val === undefined) return '—';
    return `${val} ${unit}`;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-soil/15 bg-white shadow-sm dark:border-soil/30 dark:bg-soil/20">
      <table
        className="w-full text-left text-sm"
        aria-label={t('nutrition.table_aria_label', 'Nutritional composition table per 100 grams edible portion')}
      >
        <caption className="sr-only">
          {t('nutrition.table_caption', 'Nutritional profile values per 100 grams edible portion')}
        </caption>
        <thead className="border-b border-soil/10 bg-cream/40 text-xs font-semibold uppercase tracking-wider text-soil dark:border-soil/20 dark:bg-soil/40 dark:text-cream">
          <tr>
            <th scope="col" className="px-4 py-3 sm:px-6">
              {t('nutrition.nutrient_header', 'Nutrient (per 100g)')}
            </th>
            {isComparison ? (
              comparisonCrops?.map((crop) => (
                <th key={crop.crop_key} scope="col" className="px-4 py-3 text-right sm:px-6">
                  <div>{t(`crops.${crop.crop_key}`, crop.crop_name)}</div>
                  <span className="text-[11px] font-normal lowercase tracking-normal text-soil/60 dark:text-cream/60">
                    ({crop.form})
                  </span>
                </th>
              ))
            ) : (
              <th scope="col" className="px-4 py-3 text-right sm:px-6">
                {t('nutrition.amount_header', 'Amount')}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-soil/10 dark:divide-soil/20">
          {NUTRIENT_DEFS.map((def) => {
            const isEnergy = def.category === 'energy';
            return (
              <tr
                key={def.key}
                className={isEnergy ? 'bg-harvest-sun/10 font-medium dark:bg-harvest-sun/5' : 'hover:bg-cream/20'}
              >
                <th
                  scope="row"
                  className="px-4 py-3 font-medium text-soil dark:text-cream sm:px-6"
                >
                  {t(def.labelKey, def.key)}
                </th>
                {isComparison ? (
                  comparisonCrops?.map((crop) => (
                    <td
                      key={crop.crop_key}
                      className="px-4 py-3 text-right font-mono text-soil dark:text-cream sm:px-6"
                    >
                      {formatValue(crop.nutrients[def.key], def.unit)}
                    </td>
                  ))
                ) : (
                  <td className="px-4 py-3 text-right font-mono text-soil dark:text-cream sm:px-6">
                    {formatValue(nutrients?.[def.key], def.unit)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-soil/10 px-4 py-2 text-xs text-soil/60 dark:border-soil/20 dark:text-cream/60">
        * {t('nutrition.basis_note', 'Basis: per 100 g edible portion. Missing values (—) indicate nutrient not analyzed or not reported in source.')}
      </div>
    </div>
  );
};
