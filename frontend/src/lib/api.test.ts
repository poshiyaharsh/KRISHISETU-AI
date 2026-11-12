import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiGet, apiPost, ApiError, getApiBaseUrl, HealthCheckResponse } from './api';

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

  it('apiPost sends JSON payload and parses response', async () => {
    const responsePayload = { ok: true, id: 42 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => responsePayload,
    } as Response);

    const res = await apiPost<{ ok: boolean; id: number }>('items/', { name: 'Wheat' });
    expect(res).toEqual(responsePayload);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/items/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Wheat' }),
      })
    );
  });

  it('apiPost falls back to text body on non-JSON error and maps network errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Invalid JSON');
      },
      text: async () => 'Bad Gateway HTML',
    } as unknown as Response);

    await expect(apiPost('/items/', { a: 1 })).rejects.toMatchObject({
      status: 502,
      data: 'Bad Gateway HTML',
    });

    global.fetch = vi.fn().mockRejectedValue(new Error('Network down'));
    await expect(apiPost('/items/', { a: 1 })).rejects.toMatchObject({
      status: 0,
      message: 'Network down',
    });

    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });
    await expect(apiPost('/items/', { a: 1 }, { timeoutMs: 50 })).rejects.toMatchObject({
      status: 408,
    });
  });
});
