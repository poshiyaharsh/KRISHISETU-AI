import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SchemeDetail } from './SchemeDetail';
import * as schemesApi from '../features/schemes/api';
import type { SchemeDetail as SchemeDetailType } from '../features/schemes/types';
import '@/i18n';

vi.mock('../features/schemes/api', () => ({
  fetchSchemeDetail: vi.fn(),
}));

const mockSchemeDetail: SchemeDetailType = {
  id: 1,
  slug: 'pm-kisan',
  name: 'Pradhan Mantri Kisan Samman Nidhi',
  short_description: 'Income support of ₹6,000 per year.',
  description: 'Full scheme description for PM-KISAN.',
  level: 'central',
  state_name: null,
  department: 'Ministry of Agriculture and Farmers Welfare',
  category: {
    id: 1,
    name: 'Financial Support',
    slug: 'financial-support',
    description: 'Direct financial assistance',
  },
  farmer_types: [{ id: 1, name: 'Small & Marginal Farmers', slug: 'small-marginal' }],
  eligibility: 'All landholding farmer families across India.',
  benefits: '₹6,000 per year in three installments of ₹2,000 directly via DBT.',
  documents_required: 'Aadhaar Card, Land ownership papers (RoR), Bank details.',
  how_to_apply: 'Register on pmkisan.gov.in under Farmers Corner or visit CSC.',
  official_url: 'https://pmkisan.gov.in/',
  source_name: 'myScheme / MoA&FW',
  source_url: 'https://www.myscheme.gov.in/schemes/pm-kisan',
  source_id: 'MYS-PM-KISAN-001',
  last_verified_on: '2026-11-09',
  status: 'active',
  created_at: '2026-11-09T00:00:00Z',
  updated_at: '2026-11-09T00:00:00Z',
};

const renderDetail = (slug = 'pm-kisan') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/schemes/${slug}`]}>
        <Routes>
          <Route path="/schemes/:slug" element={<SchemeDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('SchemeDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders scheme name, department, benefits, and eligibility', async () => {
    vi.mocked(schemesApi.fetchSchemeDetail).mockResolvedValue(mockSchemeDetail);

    renderDetail('pm-kisan');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Pradhan Mantri Kisan Samman Nidhi/i })).toBeInTheDocument();
      expect(screen.getByText('Ministry of Agriculture and Farmers Welfare')).toBeInTheDocument();
      expect(screen.getByText(/₹6,000 per year in three installments/i)).toBeInTheDocument();
      expect(screen.getByText(/All landholding farmer families across India/i)).toBeInTheDocument();
      expect(screen.getByText(/Aadhaar Card, Land ownership papers/i)).toBeInTheDocument();
    });
  });

  it('renders official portal external application button', async () => {
    vi.mocked(schemesApi.fetchSchemeDetail).mockResolvedValue(mockSchemeDetail);

    renderDetail('pm-kisan');

    await waitFor(() => {
      const applyBtn = screen.getByRole('link', { name: /Apply on Official Portal/i });
      expect(applyBtn).toHaveAttribute('href', 'https://pmkisan.gov.in/');
      expect(applyBtn).toHaveAttribute('target', '_blank');
      expect(applyBtn).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders error state when scheme is not found', async () => {
    vi.mocked(schemesApi.fetchSchemeDetail).mockRejectedValue(new Error('Scheme not found'));

    renderDetail('invalid-slug');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Scheme Not Found/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Back to Schemes/i })).toBeInTheDocument();
    });
  });
});
