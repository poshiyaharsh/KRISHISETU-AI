export interface SchemeCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface FarmerType {
  id: number;
  name: string;
  slug: string;
}

export interface SchemeListItem {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  level: 'central' | 'state';
  state_name: string | null;
  department: string;
  category: string;
  category_slug: string;
  farmer_types: string[];
  official_url: string;
  last_verified_on: string;
  status: 'active' | 'expired' | 'unknown';
}

export interface SchemeDetail {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  level: 'central' | 'state';
  state_name: string | null;
  department: string;
  category: SchemeCategory;
  farmer_types: FarmerType[];
  eligibility: string;
  benefits: string;
  documents_required: string;
  how_to_apply: string;
  official_url: string;
  source_name: string;
  source_url: string;
  source_id: string;
  last_verified_on: string;
  status: 'active' | 'expired' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface SchemeFacetItem {
  id: string;
  name: string;
  count: number;
}

export interface SchemeFacetsResponse {
  categories: SchemeFacetItem[];
  levels: SchemeFacetItem[];
  farmer_types: SchemeFacetItem[];
  states: SchemeFacetItem[];
  total_active_schemes: number;
}

export interface SchemeListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SchemeListItem[];
}

export interface SchemeFilterParams {
  q?: string;
  level?: string;
  category?: string;
  farmer_type?: string;
  state?: string;
  page?: number;
  page_size?: number;
}
