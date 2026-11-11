import { ChatFeedbackPayload, ChatMessage, ChatSource, StreamEvent } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function streamChat(
  message: string,
  history: ChatMessage[],
  language: string,
  sessionId: string | null,
  onSources: (sources: ChatSource[]) => void,
  onToken: (token: string) => void,
  onDone: (sessionId: string, language: string) => void,
  onError: (errorMsg: string, errorCode?: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const historyPayload = history.slice(-6).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const payload = {
    message,
    history: historyPayload,
    language,
    session_id: sessionId,
    stream: true,
  };

  try {
    const response = await fetch(`${API_BASE}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      let errorCode = 'server_error';
      let errorMsg = 'Failed to connect to Krishi Mitra. Please try again.';
      try {
        const errorData = await response.json();
        if (errorData?.error?.code) {
          errorCode = errorData.error.code;
        }
        if (errorData?.error?.message) {
          errorMsg = errorData.error.message;
        }
      } catch {
        // Fallback to HTTP status text
        if (response.status === 429) {
          errorCode = 'chat_busy';
          errorMsg = 'Daily chat quota exceeded or rate limit reached.';
        }
      }
      onError(errorMsg, errorCode);
      return;
    }

    if (!response.body) {
      onError('No response stream available.', 'stream_unavailable');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6).trim();
        try {
          const event: StreamEvent = JSON.parse(jsonStr);
          if (event.type === 'sources' && event.sources) {
            onSources(event.sources);
          } else if (event.type === 'token' && event.content !== undefined) {
            onToken(event.content);
          } else if (event.type === 'done') {
            onDone(event.session_id || '', event.language || language);
          } else if (event.type === 'error') {
            onError(event.message || 'Stream error occurred.', 'stream_error');
          }
        } catch {
          // Ignore JSON parse error for partial lines
        }
      }
    }
  } catch (err: unknown) {
    if (signal?.aborted) {
      return;
    }
    const msg = err instanceof Error ? err.message : 'Network connection failed.';
    onError(msg, 'network_error');
  }
}

export async function submitChatFeedback(payload: ChatFeedbackPayload): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/feedback/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback.');
  }
}
