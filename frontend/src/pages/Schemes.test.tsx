import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Schemes } from './Schemes';
import * as schemesApi from '../features/schemes/api';
import type { SchemeListResponse, SchemeFacetsResponse } from '../features/schemes/types';
import '@/i18n';

vi.mock('../features/schemes/api', () => ({
  fetchSchemes: vi.fn(),
  fetchSchemeFacets: vi.fn(),
}));

const mockSchemesResponse: SchemeListResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      slug: 'pm-kisan',
      name: 'Pradhan Mantri Kisan Samman Nidhi',
      short_description: 'Income support of ₹6,000 per year in three installments.',
      level: 'central',
      state_name: null,
      department: 'Ministry of Agriculture',
      category: 'Financial Support',
      category_slug: 'financial-support',
      farmer_types: ['Small & Marginal Farmers'],
      official_url: 'https://pmkisan.gov.in/',
      last_verified_on: '2026-11-09',
      status: 'active',
    },
    {
      id: 2,
      slug: 'pm-kusum',
      name: 'PM-KUSUM Solar Pump Scheme',
      short_description: 'Subsidies for standalone solar pumps.',
      level: 'central',
      state_name: null,
      department: 'Ministry of New and Renewable Energy',
      category: 'Solar & Renewable Energy',
      category_slug: 'solar-renewable-energy',
      farmer_types: ['All Farmers'],
      official_url: 'https://mnre.gov.in/pm-kusum/',
      last_verified_on: '2026-11-09',
      status: 'active',
    },
  ],
};

const mockFacetsResponse: SchemeFacetsResponse = {
  categories: [
    { id: 'financial-support', name: 'Financial Support', count: 1 },
    { id: 'solar-renewable-energy', name: 'Solar & Renewable Energy', count: 1 },
  ],
  levels: [
    { id: 'central', name: 'Central Schemes', count: 2 },
    { id: 'state', name: 'State Schemes', count: 0 },
  ],
  farmer_types: [
    { id: 'small-marginal-farmers', name: 'Small & Marginal Farmers', count: 1 },
  ],
  states: [],
  total_active_schemes: 2,
};

const renderSchemes = (initialEntries = ['/schemes']) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Schemes />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Schemes Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(schemesApi.fetchSchemes).mockResolvedValue(mockSchemesResponse);
    vi.mocked(schemesApi.fetchSchemeFacets).mockResolvedValue(mockFacetsResponse);
  });

  it('renders page header, search input, and scheme cards', async () => {
    renderSchemes();

    expect(screen.getByRole('heading', { level: 1, name: /Government Agricultural Schemes/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search schemes by name, department, or keyword/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Pradhan Mantri Kisan Samman Nidhi')).toBeInTheDocument();
      expect(screen.getByText('PM-KUSUM Solar Pump Scheme')).toBeInTheDocument();
      expect(screen.getByText(/Showing 2 schemes/i)).toBeInTheDocument();
    });
  });

  it('allows searching schemes and filters query', async () => {
    renderSchemes();

    const searchInput = screen.getByPlaceholderText(/Search schemes by name, department, or keyword/i);
    fireEvent.change(searchInput, { target: { value: 'Solar' } });

    await waitFor(() => {
      expect(schemesApi.fetchSchemes).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'Solar' })
      );
    });
  });

  it('renders empty state when no schemes match criteria', async () => {
    vi.mocked(schemesApi.fetchSchemes).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    renderSchemes();

    await waitFor(() => {
      expect(screen.getByText(/No schemes match your filter criteria/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear Filters/i })).toBeInTheDocument();
    });
  });
});
