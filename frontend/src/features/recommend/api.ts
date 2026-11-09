import { apiGet, apiPost, ApiError } from "@/lib/api";
import type {
  CropInputs,
  InputRangesResponse,
  RecommendationResponse,
  ApiErrorPayload,
} from "./types";

export interface AppError {
  code: string;
  translationKey: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}

export function mapApiError(error: unknown): AppError {
  if (error instanceof ApiError) {
    const data = error.data as ApiErrorPayload | undefined;
    const backendCode = data?.error?.code;

    if (error.status === 400 && backendCode === "validation_error") {
      return {
        code: "validation_error",
        translationKey: "errors.validation.invalid",
        status: 400,
        fieldErrors: data?.error?.fields,
      };
    }

    if (error.status === 429 || backendCode === "throttled") {
      return {
        code: "throttled",
        translationKey: "errors.throttled",
        status: 429,
      };
    }

    if (error.status === 503 || backendCode === "service_unavailable") {
      return {
        code: "service_unavailable",
        translationKey: "errors.service_unavailable",
        status: 503,
      };
    }

    if (error.status === 0 || error.status === 408) {
      return {
        code: "network_error",
        translationKey: "errors.network",
        status: error.status,
      };
    }

    return {
      code: backendCode || "server_error",
      translationKey: "errors.generic",
      status: error.status,
    };
  }

  return {
    code: "unknown_error",
    translationKey: "errors.generic",
    status: 0,
  };
}

export async function fetchInputRanges(): Promise<InputRangesResponse> {
  return apiGet<InputRangesResponse>("/crops/input-ranges/");
}

export async function fetchCropRecommendation(
  inputs: CropInputs
): Promise<RecommendationResponse> {
  return apiPost<RecommendationResponse>("/crops/recommend/", inputs);
}
