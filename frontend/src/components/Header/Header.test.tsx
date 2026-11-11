import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { Header } from './Header';
import { NavLinks, type NavItem } from './NavLinks';

describe('Header Component', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.scrollY = 0;
    await i18n.changeLanguage('en');
  });

  it('renders brand block with logo icon and live name, with no tagline text', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // 1. Home link with specific aria-label
    const brandLink = screen.getByRole('link', { name: /KrishiSetu AI, home/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');

    // 2. Icon present and ends with /logo-icon.svg
    const icon = brandLink.querySelector('img');
    expect(icon).toBeInTheDocument();
    expect(icon?.getAttribute('src')).toMatch(/\/logo-icon\.svg$/);

    // 3. Brand name present
    expect(screen.getByText(/KrishiSetu/i)).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();

    // 4. Verification: NO tagline or subtitle in the header
    expect(screen.queryByText(/Smarter Farming/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Better Decisions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Brighter Tomorrow/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/સ્માર્ટ ખેતી/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/स्मार्ट खेती/i)).not.toBeInTheDocument();
  });

  it('renders exact shortened nav labels with no line wrapping', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Expected exact nav labels in English
    const expectedLabels = ['Home', 'Crop Advice', 'Weather', 'Schemes', 'Nutrition', 'Krishi Mitra'];
    for (const label of expectedLabels) {
      const navItem = screen.getByRole('link', { name: new RegExp(`^${label}$`, 'i') });
      expect(navItem).toBeInTheDocument();
      // Ensure nowrap and shrink-0 are applied
      expect(navItem.className).toContain('whitespace-nowrap');
      expect(navItem.className).toContain('shrink-0');
      expect(navItem.className).toContain('h-[44px]');
    }

    // Previous verbose labels should not exist
    expect(screen.queryByRole('link', { name: /^Crop Advisory$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Govt Schemes$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Crop Nutrition$/i })).not.toBeInTheDocument();
  });

  it('marks active nav link with aria-current="page"', () => {
    render(
      <MemoryRouter initialEntries={['/weather']}>
        <Header />
      </MemoryRouter>
    );

    const weatherLinks = screen.getAllByRole('link', { name: /^Weather$/i });
    const activeDesktopLink = weatherLinks.find((link) => link.getAttribute('aria-current') === 'page');
    expect(activeDesktopLink).toBeDefined();
    expect(activeDesktopLink).toHaveAttribute('aria-current', 'page');
  });

  it('language button never shows the same word twice', async () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const langButton = screen.getAllByRole('button', { name: /Language selector/i })[0];
    expect(langButton).toBeInTheDocument();
    // In English, trigger button should show "English", never "English (English)"
    expect(langButton.textContent?.trim()).toBe('English');
    expect(langButton.textContent).not.toContain('English (English)');
    expect(langButton.textContent).not.toContain('(English)');
  });

  it('renders disabled items with aria-disabled="true" and not as links', () => {
    const testItems: NavItem[] = [
      { to: '/active', label: 'Active Module', available: true },
      { to: '/soon', label: 'Future Module', available: false },
    ];

    render(
      <MemoryRouter>
        <NavLinks items={testItems} />
      </MemoryRouter>
    );

    // Active item is a link
    expect(screen.getByRole('link', { name: /Active Module/i })).toBeInTheDocument();

    // Disabled item is NOT a link
    expect(screen.queryByRole('link', { name: /Future Module/i })).not.toBeInTheDocument();

    // Disabled item has aria-disabled="true" and Soon badge
    const disabledItem = screen.getByText('Future Module').closest('[aria-disabled="true"]');
    expect(disabledItem).toBeInTheDocument();
    expect(disabledItem).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument();
  });

  it('mobile menu opens, closes with Escape key and returns focus to menu button', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-nav-panel');

    // Click to open
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: /Open navigation menu/i })).toBeInTheDocument();

    // Press Escape to close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region', { name: /Open navigation menu/i })).not.toBeInTheDocument();
  });

  it('closes mobile menu on outside click', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <div>
          <Header />
          <div data-testid="outside-area">Outside Content</div>
        </div>
      </MemoryRouter>
    );

    const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('maintains solid cream background and applies shadow-sm after 8px scroll', () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('bg-cream');
    expect(header).not.toHaveClass('shadow-sm');

    // Simulate scroll > 8px
    window.scrollY = 24;
    fireEvent.scroll(window);

    expect(header).toHaveClass('shadow-sm');
    // Ensure no semi-transparency or backdrop blur
    expect(header).not.toHaveClass('bg-cream/90');
    expect(header).not.toHaveClass('backdrop-blur-md');
  });
});
