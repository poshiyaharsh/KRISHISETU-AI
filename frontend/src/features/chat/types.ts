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
  suggestions?: string[];
  timestamp: number;
  feedback?: 'up' | 'down';
  error?: {
    code: string;
    message?: string;
  };
}

export interface ChatFeedbackPayload {
  session_id?: string;
  message_id?: string;
  rating: 'up' | 'down';
  feedback_text?: string;
}

export interface StreamEvent {
  type: 'sources' | 'token' | 'suggestions' | 'done' | 'error';
  sources?: ChatSource[];
  content?: string;
  message?: string;
  code?: string;
  suggestions?: string[];
  session_id?: string;
  language?: string;
}
