import { ChatFeedbackPayload, ChatMessage, ChatSource, StreamEvent } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ChatStatusResponse {
  available: boolean;
  reason_code: string;
  knowledge_chunks: number;
}

export async function fetchChatStatus(): Promise<ChatStatusResponse> {
  try {
    const response = await fetch(`${API_BASE}/chat/status/`);
    if (!response.ok) {
      return { available: false, reason_code: 'status_check_failed', knowledge_chunks: 0 };
    }
    return response.json();
  } catch {
    return { available: false, reason_code: 'network_unavailable', knowledge_chunks: 0 };
  }
}

export async function streamChat(
  message: string,
  history: ChatMessage[],
  language: string,
  sessionId: string | null,
  onSources: (sources: ChatSource[]) => void,
  onToken: (token: string) => void,
  onSuggestions: (suggestions: string[]) => void,
  onDone: (sessionId: string, language: string) => void,
  onError: (errorMsg: string, errorCode?: string) => void,
  signal?: AbortSignal
): Promise<void> {
  // If browser is offline, fail immediately with offline error code
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    onError('You are currently offline.', 'offline');
    return;
  }

  const historyPayload = history
    .filter((msg) => !msg.error && msg.content)
    .slice(-6)
    .map((msg) => ({
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
      let errorCode = 'chat_provider_unavailable';
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
        if (response.status === 429) {
          errorCode = 'chat_busy';
        } else if (response.status === 400) {
          errorCode = 'bad_request';
        }
      }
      onError(errorMsg, errorCode);
      return;
    }

    if (!response.body) {
      onError('No response stream available.', 'chat_provider_unavailable');
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
          } else if (event.type === 'suggestions' && event.suggestions) {
            onSuggestions(event.suggestions);
          } else if (event.type === 'done') {
            onDone(event.session_id || '', event.language || language);
          } else if (event.type === 'error') {
            onError(event.message || 'Stream error occurred.', event.code || 'chat_provider_unavailable');
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
    const isNetwork = !navigator.onLine || (err instanceof TypeError && err.message.includes('fetch'));
    onError(
      isNetwork ? 'You are currently offline.' : 'Advisory connection interrupted. Please try again.',
      isNetwork ? 'offline' : 'chat_provider_unavailable'
    );
  }
}

export async function submitChatFeedback(payload: ChatFeedbackPayload): Promise<void> {
  await fetch(`${API_BASE}/chat/feedback/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
