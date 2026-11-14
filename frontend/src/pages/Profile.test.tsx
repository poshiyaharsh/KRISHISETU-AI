import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import Profile from './Profile';
import * as authModule from '@/features/auth/AuthContext';
import * as authApi from '@/features/auth/api';
import * as weatherApi from '@/features/weather/api';

describe('Profile Page', () => {
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

    vi.spyOn(weatherApi, 'fetchStates').mockResolvedValue([
      { id: 1, name: 'Gujarat', code: 'GJ', latitude: 22.25, longitude: 71.19 },
    ]);
    vi.spyOn(weatherApi, 'fetchDistricts').mockResolvedValue([
      {
        id: 10,
        state: 1,
        state_name: 'Gujarat',
        name: 'Rajkot',
        latitude: 22.3,
        longitude: 70.8,
        coord_source: 'curated',
      },
    ]);
    vi.spyOn(authApi, 'getPlotsApi').mockResolvedValue([]);
  });

  it('renders farmer profile form with existing display name and email', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/farmer profile & settings/i);
    expect(screen.getByLabelText(/farmer name \/ nickname/i)).toHaveValue('Rameshbhai');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('ramesh@example.com');
  });

  it('renders plots manager section with add plot button', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByText(/your land plots/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new plot/i })).toBeInTheDocument();
  });
});
