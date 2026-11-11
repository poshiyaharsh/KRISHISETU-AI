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

    // 2. Icon present
    const icon = brandLink.querySelector('img');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/logo-icon.svg');

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

  it('marks active nav link with aria-current="page"', () => {
    render(
      <MemoryRouter initialEntries={['/weather']}>
        <Header />
      </MemoryRouter>
    );

    const weatherLinks = screen.getAllByRole('link', { name: /Weather/i });
    const activeDesktopLink = weatherLinks.find((link) => link.getAttribute('aria-current') === 'page');
    expect(activeDesktopLink).toBeDefined();
    expect(activeDesktopLink).toHaveAttribute('aria-current', 'page');
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

  it('adds shadow and backdrop blur class when page is scrolled > 8px', () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const header = container.querySelector('header');
    expect(header).not.toHaveClass('shadow-sm');

    // Simulate scroll > 8px
    window.scrollY = 24;
    fireEvent.scroll(window);

    expect(header).toHaveClass('shadow-sm');
    expect(header).toHaveClass('backdrop-blur-md');
  });
});
