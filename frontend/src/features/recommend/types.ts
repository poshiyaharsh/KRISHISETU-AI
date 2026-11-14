export interface InputRangeMeta {
  min: number;
  max: number;
  absolute_min: number;
  absolute_max: number;
  unit: string;
  step: number;
}

export type InputRangesResponse = Record<string, InputRangeMeta>;

export interface CropInputs {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export type RecommendationSuitability =
  | "strongly_recommended"
  | "recommended"
  | "conditional";

export interface RecommendedCropItem {
  rank: number;
  crop: {
    key: string;
    name: string;
  };
  score: number;
  label: RecommendationSuitability;
}

export interface RecommendationResponse {
  request_id: string;
  prediction_id?: number;
  results: RecommendedCropItem[];
  warnings: string[];
  model: {
    version: string;
  };
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}
