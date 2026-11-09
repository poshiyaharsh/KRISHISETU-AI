import { z } from "zod";
import type { CropInputs, InputRangesResponse } from "./types";

export const SAMPLE_VALUES: CropInputs = {
  nitrogen: 90.0,
  phosphorus: 42.0,
  potassium: 43.0,
  temperature: 20.8,
  humidity: 82.0,
  ph: 6.5,
  rainfall: 202.9,
};

// Fallback ranges while loading from server
export const FALLBACK_RANGES: InputRangesResponse = {
  nitrogen: { min: 0, max: 140, absolute_min: 0, absolute_max: 300, unit: "kg/ha", step: 1.0 },
  phosphorus: { min: 5, max: 145, absolute_min: 0, absolute_max: 300, unit: "kg/ha", step: 1.0 },
  potassium: { min: 5, max: 205, absolute_min: 0, absolute_max: 350, unit: "kg/ha", step: 1.0 },
  temperature: { min: 8.8, max: 43.7, absolute_min: -10, absolute_max: 60, unit: "°C", step: 0.1 },
  humidity: { min: 14, max: 100, absolute_min: 0, absolute_max: 100, unit: "%", step: 0.1 },
  ph: { min: 3.5, max: 9.9, absolute_min: 0, absolute_max: 14, unit: "pH", step: 0.1 },
  rainfall: { min: 20, max: 300, absolute_min: 0, absolute_max: 1000, unit: "mm", step: 0.5 },
};

export function createRecommendSchema(ranges: InputRangesResponse = FALLBACK_RANGES) {
  const getBounds = (key: keyof CropInputs) => {
    const meta = ranges[key] || FALLBACK_RANGES[key];
    return {
      min: meta.absolute_min,
      max: meta.absolute_max,
      unit: meta.unit,
    };
  };

  const createField = (key: keyof CropInputs) => {
    const { min, max, unit } = getBounds(key);
    return z
      .number()
      .min(min, {
        message: `Value must be at least ${min} ${unit}`,
      })
      .max(max, {
        message: `Value must be at most ${max} ${unit}`,
      });
  };

  return z.object({
    nitrogen: createField("nitrogen"),
    phosphorus: createField("phosphorus"),
    potassium: createField("potassium"),
    temperature: createField("temperature"),
    humidity: createField("humidity"),
    ph: createField("ph"),
    rainfall: createField("rainfall"),
  });
}

export type RecommendFormData = z.infer<ReturnType<typeof createRecommendSchema>>;
