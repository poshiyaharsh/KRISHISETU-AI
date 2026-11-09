import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('App Foundation Test', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'ok',
        service: 'krishisetu-api',
        version: '0.1.0',
        time: '2026-11-09T05:00:00Z',
      }),
    } as Response);
  });

  it('renders the KrishiSetu logo and foundation status', async () => {
    render(<App />);
    const logo = screen.getByAltText('KrishiSetu AI');
    expect(logo).toBeInTheDocument();
    expect(screen.getByText(/Phase 1 Foundation Live/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Service Healthy/i)).toBeInTheDocument();
    });
  });

  it('renders the KrishiLoader message and tips', async () => {
    render(<App />);
    expect(screen.getByText(/Analyzing agricultural parameters.../i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Service Healthy/i)).toBeInTheDocument();
    });
  });

  it('renders the skeleton verification card', async () => {
    render(<App />);
    expect(screen.getByText(/Shimmer Skeleton State Verification/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Service Healthy/i)).toBeInTheDocument();
    });
  });

  it('renders the backend API health status section and data', async () => {
    render(<App />);
    expect(screen.getByText(/3. Backend API Connection/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Service Healthy/i)).toBeInTheDocument();
    });
  });
});
