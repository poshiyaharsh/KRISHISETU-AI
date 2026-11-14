import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import Dashboard from './Dashboard';
import * as authModule from '@/features/auth/AuthContext';
import * as authApi from '@/features/auth/api';

describe('Dashboard Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');

    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        email: 'ramesh@example.com',
        created_at: '2026-11-14T10:00:00Z',
        profile: {
          display_name: 'Rameshbhai',
          preferred_language: 'gu',
          state: 1,
          state_name: 'Gujarat',
          district: 10,
          district_name: 'Rajkot',
          farmer_type: null,
          farmer_type_name: undefined,
          land_area_value: 4.5,
          land_area_unit: 'acre',
          primary_irrigation_source: 'borewell',
          created_at: '2026-11-14T10:00:00Z',
          updated_at: '2026-11-14T10:00:00Z',
        },
      },
      tokens: { access_token: 'acc', refresh_token: 'ref' },
      isAuthenticated: true,
      isLoading: false,
      requestCode: vi.fn(),
      verifyCode: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      refreshMe: vi.fn(),
      claimLocalPredictions: vi.fn(),
    });

    vi.spyOn(authApi, 'getPlotsApi').mockResolvedValue([]);
    vi.spyOn(authApi, 'getPredictionsHistoryApi').mockResolvedValue({
      count: 0,
      num_pages: 1,
      current_page: 1,
      results: [],
    });
    vi.spyOn(authApi, 'getSavedSchemesApi').mockResolvedValue([]);
  });

  it('renders farmer greeting with display name', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Namaste, Rameshbhai!/i)).toBeInTheDocument();
  });

  it('renders quick tools section', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Crop Advice' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Weather' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Schemes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Krishi Mitra' })).toBeInTheDocument();
  });
});
