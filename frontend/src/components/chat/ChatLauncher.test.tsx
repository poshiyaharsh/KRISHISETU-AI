import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChatLauncher } from './ChatLauncher';

describe('ChatLauncher Component', () => {
  it('renders floating launcher on non-chat routes', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatLauncher />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /Chat with Krishi Mitra/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/chat');
    expect(link).toHaveClass('fixed');
  });

  it('hides floating launcher when on the /chat route', () => {
    render(
      <MemoryRouter initialEntries={['/chat']}>
        <ChatLauncher />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: /Chat with Krishi Mitra/i })).not.toBeInTheDocument();
  });
});
