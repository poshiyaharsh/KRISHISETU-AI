import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Nutrition } from './Nutrition';
import * as nutritionApi from '../features/nutrition/api';
import type { CropNutritionResponse, NutritionCompareResponse } from '../features/nutrition/types';
import '@/i18n';

vi.mock('../features/nutrition/api', () => ({
  fetchCropNutrition: vi.fn(),
  compareCropNutrition: vi.fn(),
}));

const mockRiceNutrition: CropNutritionResponse = {
  crop_key: 'rice',
  crop_name: 'Rice',
  food_crop: true,
  message: '',
  default_form: 'cooked',
  entries: [
    {
      form: 'cooked',
      form_label: 'Cooked / Boiled',
      food_item_name: 'Rice, white, long-grain, regular, enriched, cooked',
      basis: 'per_100g',
      is_default: true,
      is_food: true,
      nutrients: {
        energy_kcal: 130.0,
        protein_g: 2.69,
        carbohydrate_g: 28.17,
        fiber_g: 0.4,
        fat_g: 0.28,
        sugars_g: 0.05,
        iron_mg: 1.2,
        calcium_mg: 10.0,
        vitamin_c_mg: 0.0,
        potassium_mg: 35.0,
      },
      source: {
        name: 'USDA FoodData Central',
        id: '168878',
        url: 'https://fdc.nal.usda.gov/fdc-app.html#/food-details/168878/nutrients',
        retrieved_on: '2026-11-09',
        license: 'Public Domain (U.S. Government Work)',
      },
      notes: 'Steamed/boiled white rice portion',
    },
    {
      form: 'raw',
      form_label: 'Raw (Dry/Fresh)',
      food_item_name: 'Rice, white, long-grain, regular, raw, unenriched',
      basis: 'per_100g',
      is_default: false,
      is_food: true,
      nutrients: {
        energy_kcal: 365.0,
        protein_g: 7.13,
        carbohydrate_g: 79.95,
        fiber_g: 1.3,
        fat_g: 0.66,
        sugars_g: 0.12,
        iron_mg: 0.8,
        calcium_mg: 28.0,
        vitamin_c_mg: 0.0,
        potassium_mg: 115.0,
      },
      source: {
        name: 'USDA FoodData Central',
        id: '169756',
        url: 'https://fdc.nal.usda.gov/fdc-app.html#/food-details/169756/nutrients',
        retrieved_on: '2026-11-09',
        license: 'Public Domain (U.S. Government Work)',
      },
      notes: 'Dry raw white rice grains baseline',
    },
  ],
};

const mockCottonNutrition: CropNutritionResponse = {
  crop_key: 'cotton',
  crop_name: 'Cotton',
  food_crop: false,
  message: 'Not a food crop',
  default_form: null,
  entries: [],
};

const mockCompareResponse: NutritionCompareResponse = {
  crops: [
    {
      crop_key: 'rice',
      crop_name: 'Rice',
      food_crop: true,
      form: 'cooked',
      form_label: 'Cooked / Boiled',
      food_item_name: 'Rice cooked',
      basis: 'per_100g',
      nutrients: {
        energy_kcal: 130.0,
        protein_g: 2.69,
        carbohydrate_g: 28.17,
        fiber_g: 0.4,
        fat_g: 0.28,
        sugars_g: 0.05,
        iron_mg: 1.2,
        calcium_mg: 10.0,
        vitamin_c_mg: 0.0,
        potassium_mg: 35.0,
      },
      source: {
        name: 'USDA FoodData Central',
        id: '168878',
        url: 'https://fdc.nal.usda.gov/',
        retrieved_on: '2026-11-09',
        license: 'Public Domain',
      },
      notes: '',
    },
    {
      crop_key: 'maize',
      crop_name: 'Maize (Corn)',
      food_crop: true,
      form: 'cooked',
      form_label: 'Cooked / Boiled',
      food_item_name: 'Corn sweet cooked',
      basis: 'per_100g',
      nutrients: {
        energy_kcal: 96.0,
        protein_g: 3.41,
        carbohydrate_g: 20.98,
        fiber_g: 2.4,
        fat_g: 1.5,
        sugars_g: 4.54,
        iron_mg: 0.45,
        calcium_mg: 3.0,
        vitamin_c_mg: 5.5,
        potassium_mg: 218.0,
      },
      source: {
        name: 'USDA FoodData Central',
        id: '169999',
        url: 'https://fdc.nal.usda.gov/',
        retrieved_on: '2026-11-09',
        license: 'Public Domain',
      },
      notes: '',
    },
  ],
};

describe('Nutrition Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, select crop dropdown, and energy metric card for food crop', async () => {
    vi.mocked(nutritionApi.fetchCropNutrition).mockResolvedValue(mockRiceNutrition);

    render(
      <MemoryRouter initialEntries={['/nutrition?crop=rice']}>
        <Nutrition />
      </MemoryRouter>
    );

    expect(screen.getByText('Crop Nutrition & Dietary Composition')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('130 kcal').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('2.69 g').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Source: USDA FoodData Central/)).toBeInTheDocument();
    });
  });

  it('switches between cooked and raw forms when clicking form toggle buttons', async () => {
    vi.mocked(nutritionApi.fetchCropNutrition).mockResolvedValue(mockRiceNutrition);

    render(
      <MemoryRouter initialEntries={['/nutrition?crop=rice']}>
        <Nutrition />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('130 kcal').length).toBeGreaterThanOrEqual(1);
    });

    // Click Raw form button
    const rawButton = screen.getByRole('button', { name: /Raw \(Dry\/Fresh\)/i });
    fireEvent.click(rawButton);

    await waitFor(() => {
      expect(screen.getAllByText('365 kcal').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('7.13 g').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders non-food notice when a non-food crop like Cotton is selected', async () => {
    vi.mocked(nutritionApi.fetchCropNutrition).mockResolvedValue(mockCottonNutrition);

    render(
      <MemoryRouter initialEntries={['/nutrition?crop=cotton']}>
        <Nutrition />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Not a food crop/i)).toBeInTheDocument();
      expect(
        screen.getByText(/commercial industrial fiber or non-edible crop/i)
      ).toBeInTheDocument();
    });
  });

  it('switches to compare mode and renders comparative crop data', async () => {
    vi.mocked(nutritionApi.fetchCropNutrition).mockResolvedValue(mockRiceNutrition);
    vi.mocked(nutritionApi.compareCropNutrition).mockResolvedValue(mockCompareResponse);

    render(
      <MemoryRouter initialEntries={['/nutrition?crop=rice']}>
        <Nutrition />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('130 kcal').length).toBeGreaterThanOrEqual(1);
    });

    // Switch to compare mode
    const compareModeButton = screen.getByRole('button', { name: /Compare Crops/i });
    fireEvent.click(compareModeButton);

    await waitFor(() => {
      expect(nutritionApi.compareCropNutrition).toHaveBeenCalled();
      expect(screen.getByText(/Selected Crops to Compare/i)).toBeInTheDocument();
    });
  });
});
