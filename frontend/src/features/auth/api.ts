import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type {
  FarmerProfile,
  FarmPlot,
  SavedSchemeItem,
  User,
  UserPredictionRecord,
} from './types';

export interface RequestCodeResponse {
  status: string;
  message: string;
}

export interface VerifyCodeResponse {
  status: string;
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshTokenResponse {
  status: string;
  access_token: string;
  refresh_token: string;
}

export interface PaginatedPredictionsResponse {
  count: number;
  num_pages: number;
  current_page: number;
  results: UserPredictionRecord[];
}

export interface ClaimHistoryResponse {
  status: string;
  claimed_count: number;
  message: string;
}

export async function requestCodeApi(
  email: string,
  language = 'en'
): Promise<RequestCodeResponse> {
  return apiPost<RequestCodeResponse>('/auth/request-code/', { email, language });
}

export async function verifyCodeApi(
  email: string,
  code: string,
  language = 'en'
): Promise<VerifyCodeResponse> {
  return apiPost<VerifyCodeResponse>('/auth/verify-code/', { email, code, language });
}

export async function refreshTokenApi(refreshToken: string): Promise<RefreshTokenResponse> {
  return apiPost<RefreshTokenResponse>('/auth/refresh/', { refresh_token: refreshToken });
}

export async function logoutApi(refreshToken: string): Promise<{ status: string }> {
  return apiPost<{ status: string }>('/auth/logout/', { refresh_token: refreshToken });
}

export async function getMeApi(): Promise<User> {
  return apiGet<User>('/me/');
}

export async function getProfileApi(): Promise<FarmerProfile> {
  return apiGet<FarmerProfile>('/me/profile/');
}

export async function updateProfileApi(
  data: Partial<FarmerProfile>
): Promise<FarmerProfile> {
  return apiPatch<FarmerProfile>('/me/profile/', data);
}

export async function getPlotsApi(): Promise<FarmPlot[]> {
  return apiGet<FarmPlot[]>('/me/plots/');
}

export async function createPlotApi(
  data: Omit<FarmPlot, 'id' | 'created_at' | 'updated_at' | 'district_name'>
): Promise<FarmPlot> {
  return apiPost<FarmPlot>('/me/plots/', data);
}

export async function updatePlotApi(
  id: number,
  data: Partial<FarmPlot>
): Promise<FarmPlot> {
  return apiPatch<FarmPlot>(`/me/plots/${id}/`, data);
}

export async function deletePlotApi(id: number): Promise<void> {
  return apiDelete(`/me/plots/${id}/`);
}

export async function getSavedSchemesApi(): Promise<SavedSchemeItem[]> {
  return apiGet<SavedSchemeItem[]>('/me/saved-schemes/');
}

export async function saveSchemeApi(schemeSlug: string): Promise<SavedSchemeItem> {
  return apiPost<SavedSchemeItem>('/me/saved-schemes/', { scheme_slug: schemeSlug });
}

export async function deleteSavedSchemeApi(schemeSlug: string): Promise<void> {
  return apiDelete(`/me/saved-schemes/${schemeSlug}/`);
}

export async function getPredictionsHistoryApi(
  page = 1
): Promise<PaginatedPredictionsResponse> {
  return apiGet<PaginatedPredictionsResponse>(`/me/predictions/?page=${page}`);
}

export async function claimHistoryApi(
  predictionIds: number[]
): Promise<ClaimHistoryResponse> {
  return apiPost<ClaimHistoryResponse>('/me/claim-history/', {
    prediction_ids: predictionIds,
  });
}
