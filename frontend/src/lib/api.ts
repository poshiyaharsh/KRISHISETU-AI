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

let authTokenGetter: (() => string | null) | null = null;

export function setAuthTokenGetter(getter: () => string | null) {
  authTokenGetter = getter;
}

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  return DEFAULT_BASE_URL;
}

function buildHeaders(customHeaders?: HeadersInit, hasBody = false): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (authTokenGetter) {
    const token = authTokenGetter();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((val, key) => {
        headers[key] = val;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, val]) => {
        headers[key] = val;
      });
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  return headers;
}

/**
 * Perform a typed HTTP GET request to the KrishiSetu backend API.
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
      headers: buildHeaders(fetchOptions.headers, false),
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
  body?: unknown,
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
      headers: buildHeaders(fetchOptions.headers, body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

    if (response.status === 204) {
      return {} as T;
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
 * Perform a typed HTTP PATCH request to the KrishiSetu backend API.
 */
export async function apiPatch<T>(
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
      method: 'PATCH',
      signal: controller.signal,
      headers: buildHeaders(fetchOptions.headers, true),
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

/**
 * Perform a typed HTTP DELETE request to the KrishiSetu backend API.
 */
export async function apiDelete<T = void>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { timeoutMs = 10000, ...fetchOptions } = options;
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      method: 'DELETE',
      signal: controller.signal,
      headers: buildHeaders(fetchOptions.headers, false),
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

    if (response.status === 204) {
      return {} as T;
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
