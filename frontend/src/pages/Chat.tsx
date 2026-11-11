import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, RotateCcw, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { ChatBubble } from '../features/chat/ChatBubble';
import { ChatInput } from '../features/chat/ChatInput';
import { StarterQuestions } from '../features/chat/StarterQuestions';
import { streamChat, submitChatFeedback } from '../features/chat/api';
import { ChatMessage, ChatSource } from '../features/chat/types';

const STORAGE_KEY_MESSAGES = 'krishisetu_chat_messages_v1';
const STORAGE_KEY_SESSION = 'krishisetu_chat_session_id_v1';

export const Chat: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SESSION) || null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{ message: string; code?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch {
      // Ignore quota storage exceptions
    }
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, sessionId);
      } catch {
        // Ignore
      }
    }
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearHistory = () => {
    if (window.confirm(t('chat.confirmClear', 'Start a new conversation and clear your chat history?'))) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setMessages([]);
      setSessionId(null);
      setErrorBanner(null);
      try {
        localStorage.removeItem(STORAGE_KEY_MESSAGES);
        localStorage.removeItem(STORAGE_KEY_SESSION);
      } catch {
        // Ignore
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    setErrorBanner(null);
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      sources: [],
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    await streamChat(
      text,
      messages,
      i18n.language || 'en',
      sessionId,
      (sources: ChatSource[]) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, sources } : msg))
        );
      },
      (token: string) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, content: msg.content + token } : msg))
        );
      },
      (newSessionId: string) => {
        if (newSessionId) {
          setSessionId(newSessionId);
        }
        setIsLoading(false);
      },
      (errorMsg: string, errorCode?: string) => {
        setIsLoading(false);
        setErrorBanner({ message: errorMsg, code: errorCode });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId && !msg.content
              ? { ...msg, content: errorMsg, error: true }
              : msg
          )
        );
      },
      abortController.signal
    );
  };

  const handleFeedback = async (messageId: string, rating: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: rating } : msg))
    );
    try {
      await submitChatFeedback({
        session_id: sessionId || undefined,
        message_id: messageId,
        rating,
      });
    } catch {
      // Feedback is non-blocking
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-3 sm:px-6 py-4">
      {/* Header with Title and Clear Chat */}
      <header className="flex items-center justify-between pb-3.5 mb-2 border-b border-forest-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-900 text-leaf-400 flex items-center justify-center shadow-xs">
            <Bot className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-forest-950 font-display">
                {t('chat.title', 'Krishi Mitra')}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-leaf-100 text-leaf-800 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-leaf-600" aria-hidden="true" />
                <span>AI 24/7</span>
              </span>
            </div>
            <p className="text-xs text-forest-600">
              {t('chat.subtitle', 'Multilingual 24/7 Agricultural Advisory & Scheme Guide')}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 text-xs text-forest-600 hover:text-forest-900 px-3 py-1.5 rounded-lg border border-forest-200 bg-white hover:bg-forest-50 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t('chat.newChat', 'New Chat')}</span>
          </button>
        )}
      </header>

      {/* Persistent Safety Notice */}
      <div
        role="region"
        aria-label="Agricultural Safety Notice"
        className="mb-3 px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 shrink-0"
      >
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
        <span className="leading-snug">
          <strong>Notice:</strong> Krishi Mitra can make mistakes. Always confirm important farming decisions with your
          local agriculture officer (Gram Sevak) or Krishi Vigyan Kendra (KVK).
        </span>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div
          role="alert"
          className="mb-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-red-700 hover:text-red-900 font-semibold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Thread */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto min-h-[320px] max-h-[calc(100vh-17rem)] py-2 pr-1"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center px-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 mb-3 shadow-xs">
              <Bot className="w-8 h-8 text-forest-800" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-forest-950 mb-1">
              Namaste! How can Krishi Mitra help you today?
            </h2>
            <p className="text-xs sm:text-sm text-forest-600 max-w-md mb-4">
              Ask any question about crops, weather forecasts, government subsidies, soil testing, or crop nutrition.
            </p>
            <StarterQuestions onSelect={handleSendMessage} disabled={isLoading} />
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} onFeedback={handleFeedback} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Tray */}
      <div className="pt-2 border-t border-forest-100 shrink-0 bg-cream/30">
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Chat;
