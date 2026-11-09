export interface StateItem {
  id: number;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
}

export interface DistrictItem {
  id: number;
  state: number;
  state_name: string;
  name: string;
  latitude: number;
  longitude: number;
  coord_source: string;
}

export interface LocationSearchResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export interface CurrentWeather {
  temperature: number;
  relative_humidity: number;
  wind_speed: number;
  precipitation: number;
  weather_code: number;
  condition: string;
}

export interface DailyForecastItem {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_sum: number;
  precipitation_probability: number;
  wind_speed_max: number;
  weather_code: number;
  condition: string;
  et0?: number | null;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  fetched_at: string;
  stale: boolean;
  current: CurrentWeather;
  daily: DailyForecastItem[];
}

export interface SelectedLocation {
  label: string;
  latitude: number;
  longitude: number;
  districtId?: number;
  stateId?: number;
}
