import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as authModule from '@/features/auth/AuthContext';

describe('ProtectedRoute Component', () => {
  it('redirects unauthenticated user to login with redirect parameter', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      requestCode: vi.fn(),
      verifyCode: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      refreshMe: vi.fn(),
      claimLocalPredictions: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Private Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Target</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Target')).toBeInTheDocument();
    expect(screen.queryByText('Private Dashboard Content')).not.toBeInTheDocument();
  });

  it('renders child component when user is authenticated', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        email: 'farmer@example.com',
        created_at: '2026-11-14T10:00:00Z',
        profile: {
          display_name: 'Patel Bhai',
          preferred_language: 'gu',
          state: 1,
          state_name: 'Gujarat',
          district: 10,
          district_name: 'Rajkot',
          farmer_type: null,
          farmer_type_name: undefined,
          land_area_value: 5,
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

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Private Dashboard Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Private Dashboard Content')).toBeInTheDocument();
  });
});
