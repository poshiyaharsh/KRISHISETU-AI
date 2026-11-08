import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Foundation Test', () => {
  it('renders the KrishiSetu logo and foundation status', () => {
    render(<App />);
    const logo = screen.getByAltText('KrishiSetu AI');
    expect(logo).toBeInTheDocument();
    expect(screen.getByText(/Phase 1 Foundation Live/i)).toBeInTheDocument();
  });

  it('renders the KrishiLoader message and tips', () => {
    render(<App />);
    expect(screen.getByText(/Analyzing agricultural parameters.../i)).toBeInTheDocument();
  });

  it('renders the skeleton verification card', () => {
    render(<App />);
    expect(screen.getByText(/Shimmer Skeleton State Verification/i)).toBeInTheDocument();
  });
});
