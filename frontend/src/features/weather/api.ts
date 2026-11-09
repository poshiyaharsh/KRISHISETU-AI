import { apiGet } from '../../lib/api';
import type { StateItem, DistrictItem, LocationSearchResult, WeatherResponse } from './types';

export async function fetchStates(): Promise<StateItem[]> {
  const data = await apiGet<{ results?: StateItem[] } | StateItem[]>('/locations/states/');
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function fetchDistricts(stateId: number): Promise<DistrictItem[]> {
  const data = await apiGet<{ results?: DistrictItem[] } | DistrictItem[]>(`/locations/districts/?state=${stateId}`);
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 3) return [];
  const data = await apiGet<{ results?: LocationSearchResult[] } | LocationSearchResult[]>(
    `/locations/search/?q=${encodeURIComponent(query.trim())}`
  );
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function fetchWeather(params: {
  lat?: number;
  lon?: number;
  district?: number;
}): Promise<WeatherResponse> {
  const queryParams = new URLSearchParams();
  if (params.district !== undefined) {
    queryParams.append('district', params.district.toString());
  } else if (params.lat !== undefined && params.lon !== undefined) {
    queryParams.append('lat', params.lat.toString());
    queryParams.append('lon', params.lon.toString());
  } else {
    throw new Error('Either district or lat/lon coordinates must be provided');
  }

  return apiGet<WeatherResponse>(`/weather/?${queryParams.toString()}`);
}
