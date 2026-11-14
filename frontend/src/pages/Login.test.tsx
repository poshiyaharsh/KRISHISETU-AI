import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import Login from './Login';
import * as authModule from '@/features/auth/AuthContext';

describe('Login Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  it('renders email input and sign-in button initially', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument();
  });

  it('progresses to OTP verification step on successful code request', async () => {
    const requestCodeMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      requestCode: requestCodeMock,
      verifyCode: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      refreshMe: vi.fn(),
      claimLocalPredictions: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'farmer@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /send verification code/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(requestCodeMock).toHaveBeenCalledWith('farmer@example.com', 'en');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument();
    });
  });

  it('displays rate-limit error message when rate-limited error occurs', async () => {
    const requestCodeMock = vi.fn().mockRejectedValue(
      new Error('Too many code requests. Please wait an hour before trying again.')
    );

    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      requestCode: requestCodeMock,
      verifyCode: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      refreshMe: vi.fn(),
      claimLocalPredictions: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'farmer@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /send verification code/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/too many code requests/i)).toBeInTheDocument();
    });
  });
});
