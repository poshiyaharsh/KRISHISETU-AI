import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiGet, ApiError, getApiBaseUrl, HealthCheckResponse } from './api';

describe('api client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('resolves correct default API base URL', () => {
    expect(getApiBaseUrl()).toBe('/api');
  });

  it('successfully fetches and parses JSON data', async () => {
    const mockData: HealthCheckResponse = {
      status: 'ok',
      service: 'krishisetu-api',
      version: '0.1.0',
      time: '2026-11-09T05:00:00Z',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as Response);

    const result = await apiGet<HealthCheckResponse>('/health/');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/health/',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Accept: 'application/json' }),
      }),
    );
  });

  it('throws ApiError on HTTP 404 or 500 responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    } as Response);

    await expect(apiGet('/health/')).rejects.toThrow(ApiError);
    try {
      await apiGet('/health/');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiError);
      if (err instanceof ApiError) {
        expect(err.status).toBe(500);
      }
    }
  });

  it('handles abort/timeout correctly', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(apiGet('/health/', { timeoutMs: 100 })).rejects.toThrow(ApiError);
    try {
      await apiGet('/health/', { timeoutMs: 100 });
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiError);
      if (err instanceof ApiError) {
        expect(err.status).toBe(408);
      }
    }
  });
});
