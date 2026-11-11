import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Chat } from './Chat';
import * as chatApi from '../features/chat/api';

vi.mock('../features/chat/api', () => ({
  streamChat: vi.fn(),
  submitChatFeedback: vi.fn(),
}));

describe('Chat Page Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders page header, safety notice, and empty state greeting', () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Krishi Mitra/i })).toBeInTheDocument();
    expect(screen.getByText(/Krishi Mitra can make mistakes/i)).toBeInTheDocument();
    expect(screen.getByText(/Namaste! How can Krishi Mitra help you today\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask Krishi Mitra about crops/i)).toBeInTheDocument();
  });

  it('handles sending a message and renders streamed response', async () => {
    const mockStreamChat = vi.mocked(chatApi.streamChat);
    mockStreamChat.mockImplementation(
      async (_msg, _hist, _lang, _sess, onSources, onToken, onDone) => {
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

  it('handles thumbs-up feedback submission', async () => {
    const mockSubmitFeedback = vi.mocked(chatApi.submitChatFeedback);
    mockSubmitFeedback.mockResolvedValue();

    // Seed localStorage with an assistant message
    const initialMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Tell me about PM-KISAN',
        timestamp: Date.now(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
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

