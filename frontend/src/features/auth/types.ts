export interface FarmerProfile {
  display_name: string;
  preferred_language: string;
  state: number | null;
  state_name?: string;
  district: number | null;
  district_name?: string;
  farmer_type: number | null;
  farmer_type_name?: string;
  land_area_value: number | null;
  land_area_unit: 'acre' | 'hectare' | 'bigha' | 'guntha';
  primary_irrigation_source:
    | 'rainfed'
    | 'canal'
    | 'borewell'
    | 'open_well'
    | 'drip_sprinkler'
    | 'other';
  created_at: string;
  updated_at: string;
}

export interface FarmPlot {
  id: number;
  name: string;
  area_value: number;
  area_unit: 'acre' | 'hectare' | 'bigha' | 'guntha';
  soil_type: string | null;
  district: number | null;
  district_name?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SavedSchemeItem {
  id: number;
  scheme_id: number;
  slug: string;
  name: string;
  short_description: string;
  category: string;
  category_slug: string;
  level: string;
  official_url: string;
  created_at: string;
}

export interface UserPredictionRecord {
  id: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  results: Array<{ crop: string; score: number; label?: string }>;
  warnings: string[];
  model_version: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  is_active?: boolean;
  created_at: string;
  last_login?: string | null;
  consented_at?: string | null;
  consent_version?: string;
  profile: FarmerProfile;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}
