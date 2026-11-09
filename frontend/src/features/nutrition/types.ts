export interface NutrientValues {
  energy_kcal: number | null;
  protein_g: number | null;
  carbohydrate_g: number | null;
  fiber_g: number | null;
  fat_g: number | null;
  sugars_g: number | null;
  iron_mg: number | null;
  calcium_mg: number | null;
  vitamin_c_mg: number | null;
  potassium_mg: number | null;
}

export interface SourceMetadata {
  name: string;
  id: string;
  url: string;
  retrieved_on: string | null;
  license: string;
}

export interface NutritionEntry {
  form: string;
  form_label: string;
  food_item_name: string;
  basis: string;
  is_default: boolean;
  is_food: boolean;
  nutrients: NutrientValues;
  source: SourceMetadata;
  notes: string;
}

export interface CropNutritionResponse {
  crop_key: string;
  crop_name: string;
  food_crop: boolean;
  message?: string;
  default_form: string | null;
  entries: NutritionEntry[];
}

export interface CropComparisonItem {
  crop_key: string;
  crop_name: string;
  food_crop: boolean;
  form: string;
  form_label: string;
  food_item_name: string;
  basis: string;
  nutrients: NutrientValues;
  source: SourceMetadata;
  notes: string;
}

export interface NutritionCompareResponse {
  crops: CropComparisonItem[];
}
