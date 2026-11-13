import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Chat } from './Chat';
import * as chatApi from '../features/chat/api';

vi.mock('../features/chat/api', () => ({
  streamChat: vi.fn(),
  submitChatFeedback: vi.fn(),
  fetchChatStatus: vi.fn().mockResolvedValue({ available: true, reason_code: 'ready', knowledge_chunks: 70 }),
}));

describe('Chat Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders chat header with BrandLogo reversed and empty starter prompt', () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Krishi Mitra/i })).toBeInTheDocument();
    expect(screen.getByText(/Grounded Agricultural Advisory/i)).toBeInTheDocument();
    expect(screen.getByText(/Namaste! How can Krishi Mitra help you today/i)).toBeInTheDocument();
  });

  it('handles sending a message and renders streamed response', async () => {
    const mockStreamChat = vi.mocked(chatApi.streamChat);
    mockStreamChat.mockImplementation(
      async (_msg, _hist, _lang, _sess, onSources, onToken, _onSugg, onDone) => {
        onSources([
          {
            title: 'Rice Profile',
            url: '/recommend?crop=rice',
            source_type: 'crop',
            score: 0.95,
          },
        ]);
        onToken('Rice thrives in clayey loamy soils with 1000-1500mm rainfall.');
        onDone('sess-123', 'en');
      }
    );

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Ask Krishi Mitra about crops/i);
    const sendButton = screen.getByRole('button', { name: /Send message/i });

    fireEvent.change(input, { target: { value: 'How to grow rice?' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('How to grow rice?')).toBeInTheDocument();
      expect(screen.getByText(/Rice thrives in clayey loamy soils/i)).toBeInTheDocument();
      expect(screen.getByText('Rice Profile')).toBeInTheDocument();
    });
  });

  it('renders inline error directly under user message with Try again button when stream fails', async () => {
    const mockStreamChat = vi.mocked(chatApi.streamChat);
    mockStreamChat.mockImplementation(
      async (_msg, _hist, _lang, _sess, _onSources, _onToken, _onSugg, _onDone, onError) => {
        onError('The advisory provider is temporarily unavailable.', 'chat_provider_unavailable');
      }
    );

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Ask Krishi Mitra about crops/i);
    const sendButton = screen.getByRole('button', { name: /Send message/i });

    fireEvent.change(input, { target: { value: 'hy' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      // User message is present
      expect(screen.getByText('hy')).toBeInTheDocument();
      // Inline error message is shown
      expect(screen.getByRole('alert')).toBeInTheDocument();
      // Try again button is shown
      expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
      // No assistant message with thumbs up exists
      expect(screen.queryByRole('button', { name: /Thumbs up/i })).not.toBeInTheDocument();
    });
  });

  it('handles thumbs-up feedback submission', async () => {
    const mockSubmitFeedback = vi.mocked(chatApi.submitChatFeedback);
    mockSubmitFeedback.mockResolvedValue();

    const initialMessages = [
      {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Tell me about PM-KISAN',
        timestamp: Date.now(),
      },
      {
        id: 'msg-2',
        role: 'assistant' as const,
        content: 'PM-KISAN provides Rs 6,000 per year.',
        sources: [],
        timestamp: Date.now(),
      },
    ];
    localStorage.setItem('krishisetu_chat_messages_v1', JSON.stringify(initialMessages));

    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>
    );

    expect(screen.getByText('PM-KISAN provides Rs 6,000 per year.')).toBeInTheDocument();

    const thumbsUpBtn = screen.getByRole('button', { name: /Thumbs up/i });
    fireEvent.click(thumbsUpBtn);

    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        message_id: 'msg-2',
        rating: 'up',
      })
    );
  });
});
