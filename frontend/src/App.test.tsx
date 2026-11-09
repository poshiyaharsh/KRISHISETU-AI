import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('App Core Layout and Routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the KrishiSetu navbar, brand title and skip link', async () => {
    render(<App />);

    // Brand link in navbar
    const brandLink = screen.getByRole('link', { name: /KrishiSetu AI/i });
    expect(brandLink).toBeInTheDocument();

    // Skip link
    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeInTheDocument();

    // Navigation items
    expect(screen.getByRole('navigation', { name: /Main Navigation/i })).toBeInTheDocument();
  });

  it('renders the landing page hero section and CTA button', async () => {
    render(<App />);

    const heroHeading = await screen.findByRole('heading', {
      name: /AI-Powered Crop Advisory for Indian Farmers/i,
    });
    expect(heroHeading).toBeInTheDocument();

    const ctaButtons = screen.getAllByRole('link', { name: /Get Crop Advice/i });
    expect(ctaButtons.length).toBeGreaterThan(0);
  });

  it("renders the 3-step 'How It Works' workflow", async () => {
    render(<App />);

    const howItWorks = await screen.findByText(/How It Works/i);
    expect(howItWorks).toBeInTheDocument();
    expect(screen.getByText(/1\. Enter Field Data/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. AI Model Evaluation/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Get Ranked Recommendations/i)).toBeInTheDocument();
  });

  it('renders the safety advisory disclaimer in the footer', () => {
    render(<App />);

    expect(screen.getByText(/Advisory Notice:/i)).toBeInTheDocument();
    expect(screen.getByText(/Krishi Vigyan Kendra/i)).toBeInTheDocument();
  });
});
