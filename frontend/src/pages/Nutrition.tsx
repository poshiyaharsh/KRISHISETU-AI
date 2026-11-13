import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { KrishiLoader } from '@/components';
import { compareCropNutrition, fetchCropNutrition } from '@/features/nutrition/api';
import { NutritionChart } from '@/features/nutrition/NutritionChart';
import { NutritionTable } from '@/features/nutrition/NutritionTable';
import type {
  CropComparisonItem,
  CropNutritionResponse,
  NutritionEntry,
} from '@/features/nutrition/types';

const ALL_CROPS = [
  { key: 'apple', defaultName: 'Apple' },
  { key: 'banana', defaultName: 'Banana' },
  { key: 'blackgram', defaultName: 'Black Gram (Urad)' },
  { key: 'chickpea', defaultName: 'Chickpea (Chana)' },
  { key: 'coconut', defaultName: 'Coconut' },
  { key: 'coffee', defaultName: 'Coffee' },
  { key: 'cotton', defaultName: 'Cotton' },
  { key: 'grapes', defaultName: 'Grapes' },
  { key: 'jute', defaultName: 'Jute' },
  { key: 'kidneybeans', defaultName: 'Kidney Beans (Rajma)' },
  { key: 'lentil', defaultName: 'Lentil (Masoor)' },
  { key: 'maize', defaultName: 'Maize (Corn)' },
  { key: 'mango', defaultName: 'Mango' },
  { key: 'mothbeans', defaultName: 'Moth Beans (Matki)' },
  { key: 'mungbean', defaultName: 'Mung Bean (Moong)' },
  { key: 'muskmelon', defaultName: 'Muskmelon' },
  { key: 'orange', defaultName: 'Orange' },
  { key: 'papaya', defaultName: 'Papaya' },
  { key: 'pigeonpeas', defaultName: 'Pigeon Peas (Arhar/Toor)' },
  { key: 'pomegranate', defaultName: 'Pomegranate' },
  { key: 'rice', defaultName: 'Rice' },
  { key: 'watermelon', defaultName: 'Watermelon' },
];

export const Nutrition: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: single crop vs compare
  const isCompareMode = searchParams.get('mode') === 'compare';
  const initialCrop = searchParams.get('crop') || 'rice';

  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop);
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [cropData, setCropData] = useState<CropNutritionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Compare mode state
  const initialCompareParam = searchParams.get('crops');
  const [compareCrops, setCompareCrops] = useState<string[]>(
    initialCompareParam ? initialCompareParam.split(',').filter(Boolean) : ['rice', 'maize']
  );
  const [compareData, setCompareData] = useState<CropComparisonItem[]>([]);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);

  // Synchronize state with URL params
  useEffect(() => {
    const cropFromUrl = searchParams.get('crop');
    if (cropFromUrl && cropFromUrl !== selectedCrop) {
      setSelectedCrop(cropFromUrl);
    }
  }, [searchParams]);

  // Fetch single crop nutrition
  useEffect(() => {
    if (isCompareMode) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchCropNutrition(selectedCrop)
      .then((data) => {
        if (!isMounted) return;
        setCropData(data);
        if (data.default_form) {
          setSelectedForm(data.default_form);
        } else if (data.entries.length > 0) {
          setSelectedForm(data.entries[0].form);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load crop nutrition data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCrop, isCompareMode]);

  // Fetch comparison nutrition
  useEffect(() => {
    if (!isCompareMode || compareCrops.length === 0) return;

    let isMounted = true;
    setCompareLoading(true);

    compareCropNutrition(compareCrops)
      .then((res) => {
        if (!isMounted) return;
        setCompareData(res.crops);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load comparison data.');
      })
      .finally(() => {
        if (isMounted) setCompareLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isCompareMode, compareCrops]);

  const handleSelectCrop = (key: string) => {
    setSelectedCrop(key);
    setSearchParams({ crop: key });
  };

  const handleToggleMode = (compare: boolean) => {
    if (compare) {
      setSearchParams({ mode: 'compare', crops: compareCrops.join(',') });
    } else {
      setSearchParams({ crop: selectedCrop });
    }
  };

  const handleAddCompareCrop = (key: string) => {
    if (compareCrops.length >= 3 || compareCrops.includes(key)) return;
    const next = [...compareCrops, key];
    setCompareCrops(next);
    setSearchParams({ mode: 'compare', crops: next.join(',') });
  };

  const handleRemoveCompareCrop = (key: string) => {
    if (compareCrops.length <= 1) return;
    const next = compareCrops.filter((k) => k !== key);
    setCompareCrops(next);
    setSearchParams({ mode: 'compare', crops: next.join(',') });
  };

  const activeEntry: NutritionEntry | undefined = cropData?.entries.find(
    (e) => e.form === selectedForm
  ) || cropData?.entries[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header and Mode Toggle */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">
            {t('nutrition.title', 'Crop nutrition')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t(
              'nutrition.subtitle',
              'Nutritional profiles per 100g edible portion for all supported agricultural crops.'
            )}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex self-start rounded-xl border border-soil/20 bg-mist/50 p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => handleToggleMode(false)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              !isCompareMode
                ? 'bg-paddy text-cream shadow-xs'
                : 'bg-transparent text-soil hover:text-paddy'
            }`}
          >
            {t('nutrition.single_crop_view', 'Single Crop View')}
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode(true)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              isCompareMode
                ? 'bg-paddy text-cream shadow-xs'
                : 'bg-transparent text-soil hover:text-paddy'
            }`}
          >
            {t('nutrition.compare_view', 'Compare Crops (up to 3)')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!isCompareMode ? (
        <div className="space-y-6">
          {/* Crop Selector Card */}
          <div className="rounded-xl border border-soil/15 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <label
                  htmlFor="crop-select"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  {t('nutrition.select_crop_label', 'Select Crop')}
                </label>
                <div className="relative">
                  <select
                    id="crop-select"
                    value={selectedCrop}
                    onChange={(e) => handleSelectCrop(e.target.value)}
                    className="w-full rounded-lg border border-soil/30 bg-white px-3 py-2 text-sm font-medium text-soil shadow-xs focus:border-paddy focus:outline-none focus:ring-2 focus:ring-paddy"
                  >
                    {ALL_CROPS.map((c) => (
                      <option key={c.key} value={c.key} className="text-soil bg-white">
                        {t(`crops.${c.key}`, c.defaultName)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Toggle (Raw vs Cooked) if crop has multiple forms */}
              {cropData?.food_crop && cropData.entries.length > 1 && (
                <div>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
                    {t('nutrition.form_label', 'Consumption State')}
                  </span>
                  <div className="inline-flex rounded-lg border border-soil/20 bg-mist/50 p-1">
                    {cropData.entries.map((entry) => (
                      <button
                        key={entry.form}
                        type="button"
                        onClick={() => setSelectedForm(entry.form)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                          selectedForm === entry.form
                            ? 'bg-paddy text-cream shadow-xs'
                            : 'bg-transparent text-soil hover:text-paddy'
                        }`}
                      >
                        {t(`nutrition.form_${entry.form}`, entry.form_label)}
                        {entry.is_default && (
                          <span
                            className={`ml-1 text-[10px] ${
                              selectedForm === entry.form ? 'text-cream/80' : 'text-muted'
                            }`}
                          >
                            ({t('nutrition.default_badge', 'Default')})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading or Error State */}
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <KrishiLoader />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-900"
            >
              {error}
            </div>
          )}

          {/* Non-Food Crop Message Card */}
          {!loading && !error && cropData && !cropData.food_crop && (
            <div
              role="region"
              aria-label="Non-food crop notice"
              className="rounded-xl border border-wheat/60 bg-wheat/15 p-6"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl" aria-hidden="true">🌱</span>
                <div>
                  <h2 className="text-lg font-bold text-heading">
                    {t(`crops.${cropData.crop_key}`, cropData.crop_name)} —{' '}
                    {t('nutrition.not_a_food_crop', 'Not a food crop')}
                  </h2>
                  <p className="mt-1 text-sm text-soil">
                    {t(
                      'nutrition.non_food_explanation',
                      'This crop is cultivated primarily as a commercial industrial fiber or non-edible crop. It has no standard dietary food portion.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Food Crop Nutrition Content */}
          {!loading && !error && cropData && cropData.food_crop && activeEntry && (
            <>
              {/* Highlight Metrics */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-soil/15 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t('nutrition.energy', 'Energy')}
                  </div>
                  <div className="mt-1 text-2xl font-bold font-sans tabular-nums text-heading">
                    {activeEntry.nutrients.energy_kcal !== null ? `${activeEntry.nutrients.energy_kcal} kcal` : '—'}
                  </div>
                  <div className="text-xs text-muted">per 100g</div>
                </div>

                <div className="rounded-xl border border-soil/15 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t('nutrition.protein', 'Protein')}
                  </div>
                  <div className="mt-1 text-2xl font-bold font-sans tabular-nums text-soil">
                    {activeEntry.nutrients.protein_g !== null ? `${activeEntry.nutrients.protein_g} g` : '—'}
                  </div>
                  <div className="text-xs text-muted">per 100g</div>
                </div>

                <div className="rounded-xl border border-soil/15 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t('nutrition.carbohydrate', 'Carbohydrate')}
                  </div>
                  <div className="mt-1 text-2xl font-bold font-sans tabular-nums text-soil">
                    {activeEntry.nutrients.carbohydrate_g !== null ? `${activeEntry.nutrients.carbohydrate_g} g` : '—'}
                  </div>
                  <div className="text-xs text-muted">per 100g</div>
                </div>

                <div className="rounded-xl border border-soil/15 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t('nutrition.fiber', 'Dietary Fiber')}
                  </div>
                  <div className="mt-1 text-2xl font-bold font-sans tabular-nums text-soil">
                    {activeEntry.nutrients.fiber_g !== null ? `${activeEntry.nutrients.fiber_g} g` : '—'}
                  </div>
                  <div className="text-xs text-muted">per 100g</div>
                </div>
              </div>

              {/* Chart & Table Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <NutritionChart
                  nutrients={activeEntry.nutrients}
                  cropName={t(`crops.${cropData.crop_key}`, cropData.crop_name)}
                />
                <NutritionTable nutrients={activeEntry.nutrients} />
              </div>

              {/* Provenance & Citation Disclaimer */}
              <div className="rounded-xl border border-soil/15 bg-mist/30 p-4 text-xs text-soil">
                <p className="font-semibold text-heading">
                  {t(
                    'nutrition.provenance_line',
                    'Source: {{name}} (ID: {{id}}), retrieved {{date}}. Values are per 100 g and vary by variety and growing conditions.',
                    {
                      name: activeEntry.source.name,
                      id: activeEntry.source.id,
                      date: activeEntry.source.retrieved_on || '2026-11-09',
                    }
                  )}
                </p>
                <p className="mt-1 text-soil">
                  {t(
                    'nutrition.safety_disclaimer',
                    'Notice: For general agricultural and dietary awareness only. Does not constitute medical or therapeutic nutrition advice.'
                  )}
                </p>
                {activeEntry.source.url && (
                  <p className="mt-1">
                    <a
                      href={activeEntry.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-paddy font-semibold underline hover:text-paddyLight"
                    >
                      {t('nutrition.view_official_source', 'View official USDA FoodData Central catalog profile')} &rarr;
                    </a>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Comparison Mode */
        <div className="space-y-6">
          {/* Comparison Picker Card */}
          <div className="rounded-xl border border-soil/15 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t('nutrition.compare_selector_heading', 'Selected Crops to Compare (Select 1 to 3)')}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {compareCrops.map((ckey) => {
                const item = ALL_CROPS.find((c) => c.key === ckey);
                return (
                  <span
                    key={ckey}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-mist/80 px-3 py-1.5 text-sm font-semibold text-soil border border-soil/10"
                  >
                    {t(`crops.${ckey}`, item?.defaultName || ckey)}
                    {compareCrops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCompareCrop(ckey)}
                        className="text-soil/70 hover:text-red-700 font-bold ml-1"
                        aria-label={`Remove ${ckey}`}
                      >
                        &times;
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            {compareCrops.length < 3 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-muted self-center">
                  {t('nutrition.add_crop_prompt', 'Add to comparison:')}
                </span>
                {ALL_CROPS.filter((c) => !compareCrops.includes(c.key)).slice(0, 8).map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => handleAddCompareCrop(c.key)}
                    className="rounded-md border border-soil/20 bg-white px-2.5 py-1 text-xs font-semibold text-soil hover:bg-mist/50 transition-colors"
                  >
                    + {t(`crops.${c.key}`, c.defaultName)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {compareLoading && (
            <div className="flex h-64 items-center justify-center">
              <KrishiLoader />
            </div>
          )}

          {!compareLoading && compareData.length > 0 && (
            <>
              <NutritionChart comparisonCrops={compareData} />
              <NutritionTable comparisonCrops={compareData} />

              <div className="rounded-xl border border-soil/15 bg-mist/30 p-4 text-xs text-soil">
                <p>
                  {t(
                    'nutrition.compare_disclaimer',
                    'Source: USDA FoodData Central. Values are per 100 g edible portion in standard consumption form and vary by cultivar and growing conditions. No medical advice implied.'
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Nutrition;
