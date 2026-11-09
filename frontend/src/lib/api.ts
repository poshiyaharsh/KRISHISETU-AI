export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  time: string;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = '/api';

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  return DEFAULT_BASE_URL;
}

/**
 * Perform a typed HTTP GET request to the KrishiSetu backend API.
 * Handles timeouts, network errors, and JSON response parsing.
 */
export async function apiGet<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { timeoutMs = 8000, ...fetchOptions } = options;
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(fetchOptions.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(
        `API request failed with status ${response.status}`,
        response.status,
        errorBody,
      );
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`, 408);
      }
      throw new ApiError(err.message, 0);
    }
    throw new ApiError('An unknown network error occurred', 0);
  }
}

/**
 * Perform a typed HTTP POST request to the KrishiSetu backend API.
 */
export async function apiPost<T>(
  endpoint: string,
  body: unknown,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { timeoutMs = 12000, ...fetchOptions } = options;
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(fetchOptions.headers || {}),
      },
      body: JSON.stringify(body),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(
        `API request failed with status ${response.status}`,
        response.status,
        errorBody
      );
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`, 408);
      }
      throw new ApiError(err.message, 0);
    }
    throw new ApiError('An unknown network error occurred', 0);
  }
}
