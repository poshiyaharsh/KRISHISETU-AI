import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchInputRanges,
  fetchCropRecommendation,
  mapApiError,
} from "./api";
import { ApiError } from "@/lib/api";

describe("recommend api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches input ranges successfully", async () => {
    const mockRanges = {
      nitrogen: { min: 0, max: 140, absolute_min: 0, absolute_max: 300, unit: "kg/ha", step: 1 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRanges,
    });

    const result = await fetchInputRanges();
    expect(result).toEqual(mockRanges);
  });

  it("posts recommendation inputs and receives top 3 response", async () => {
    const mockResponse = {
      request_id: "test-uuid",
      results: [
        { rank: 1, crop: { key: "rice", name: "Rice" }, score: 0.92, label: "strongly_recommended" },
      ],
      warnings: [],
      model: { version: "crs-1.0.0" },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const inputs = {
      nitrogen: 90,
      phosphorus: 42,
      potassium: 43,
      temperature: 20.8,
      humidity: 82,
      ph: 6.5,
      rainfall: 202.9,
    };

    const result = await fetchCropRecommendation(inputs);
    expect(result.results[0].crop.name).toBe("Rice");
    expect(result.request_id).toBe("test-uuid");
  });

  describe("mapApiError", () => {
    it("maps 400 validation error with field errors", () => {
      const err = new ApiError("Bad request", 400, {
        error: {
          code: "validation_error",
          message: "Please check values",
          fields: { ph: ["out_of_range"] },
        },
      });

      const mapped = mapApiError(err);
      expect(mapped.code).toBe("validation_error");
      expect(mapped.translationKey).toBe("errors.validation.invalid");
      expect(mapped.fieldErrors?.ph).toEqual(["out_of_range"]);
    });

    it("maps 429 throttled error", () => {
      const err = new ApiError("Throttled", 429, {
        error: { code: "throttled", message: "Rate limit exceeded" },
      });

      const mapped = mapApiError(err);
      expect(mapped.code).toBe("throttled");
      expect(mapped.translationKey).toBe("errors.throttled");
    });

    it("maps 503 service unavailable error", () => {
      const err = new ApiError("Unavailable", 503, {
        error: { code: "service_unavailable", message: "Model missing" },
      });

      const mapped = mapApiError(err);
      expect(mapped.code).toBe("service_unavailable");
      expect(mapped.translationKey).toBe("errors.service_unavailable");
    });

    it("maps network or timeout error (status 0 / 408)", () => {
      const err = new ApiError("Timeout", 408);
      const mapped = mapApiError(err);
      expect(mapped.code).toBe("network_error");
      expect(mapped.translationKey).toBe("errors.network");
    });

    it("maps fallback unknown error", () => {
      const mapped = mapApiError(new Error("Something broke"));
      expect(mapped.code).toBe("unknown_error");
      expect(mapped.translationKey).toBe("errors.generic");
    });
  });
});
