import { apiGet } from '../../lib/api';
import type { CropNutritionResponse, NutritionCompareResponse } from './types';

export async function fetchCropNutrition(cropKey: string): Promise<CropNutritionResponse> {
  return apiGet<CropNutritionResponse>(`/crops/${encodeURIComponent(cropKey)}/nutrition/`);
}

export async function compareCropNutrition(cropKeys: string[]): Promise<NutritionCompareResponse> {
  const param = cropKeys.map((k) => k.trim().toLowerCase()).join(',');
  return apiGet<NutritionCompareResponse>(`/nutrition/compare/?crops=${encodeURIComponent(param)}`);
}
