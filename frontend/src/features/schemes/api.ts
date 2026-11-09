import { apiGet } from '../../lib/api';
import type {
  SchemeDetail,
  SchemeFacetsResponse,
  SchemeFilterParams,
  SchemeListResponse,
} from './types';

export async function fetchSchemes(params: SchemeFilterParams = {}): Promise<SchemeListResponse> {
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.append('q', params.q.trim());
  if (params.level) queryParams.append('level', params.level);
  if (params.category) queryParams.append('category', params.category);
  if (params.farmer_type) queryParams.append('farmer_type', params.farmer_type);
  if (params.state) queryParams.append('state', params.state);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.page_size) queryParams.append('page_size', params.page_size.toString());

  const queryStr = queryParams.toString();
  return apiGet<SchemeListResponse>(`/schemes/${queryStr ? `?${queryStr}` : ''}`);
}

export async function fetchSchemeDetail(slug: string): Promise<SchemeDetail> {
  return apiGet<SchemeDetail>(`/schemes/${encodeURIComponent(slug)}/`);
}

export async function fetchSchemeFacets(): Promise<SchemeFacetsResponse> {
  return apiGet<SchemeFacetsResponse>('/schemes/facets/');
}
