export interface ChatSource {
  title: string;
  url: string;
  source_type: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: number;
  feedback?: 'up' | 'down';
  error?: boolean;
}

export interface ChatFeedbackPayload {
  session_id?: string;
  message_id?: string;
  rating: 'up' | 'down';
  feedback_text?: string;
}

export interface StreamEvent {
  type: 'sources' | 'token' | 'done' | 'error';
  sources?: ChatSource[];
  content?: string;
  message?: string;
  session_id?: string;
  language?: string;
}
