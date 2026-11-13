import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, ShieldAlert, AlertTriangle } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ChatBubble } from '../features/chat/ChatBubble';
import { ChatInput } from '../features/chat/ChatInput';
import { StarterQuestions } from '../features/chat/StarterQuestions';
import { streamChat, submitChatFeedback, fetchChatStatus } from '../features/chat/api';
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
  const [isUnavailable, setIsUnavailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check chat status on mount
  useEffect(() => {
    let isMounted = true;
    fetchChatStatus().then((status) => {
      if (isMounted && !status.available) {
        setIsUnavailable(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
      try {
        localStorage.removeItem(STORAGE_KEY_MESSAGES);
        localStorage.removeItem(STORAGE_KEY_SESSION);
      } catch {
        // Ignore
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    if (isUnavailable) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    // Offline check before network request
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: Date.now(),
        error: {
          code: 'offline',
          message: t('chat.errors.offline'),
        },
      };
      setMessages((prev) => [...prev, offlineMsg]);
      return;
    }

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
      (suggestions: string[]) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, suggestions } : msg))
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
        // Single error surface: attach error to user message, remove empty assistant bubble
        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== assistantMsgId)
            .map((msg) =>
              msg.id === userMsgId
                ? {
                    ...msg,
                    error: {
                      code: errorCode || 'chat_provider_unavailable',
                      message: errorMsg,
                    },
                  }
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
      {/* Header with Brand Logo and Clear Chat */}
      <header className="flex items-center justify-between pb-3.5 mb-2 border-b border-mist shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-paddy text-cream flex items-center justify-center shadow-xs shrink-0 p-1">
            <BrandLogo variant="reversed" size={28} className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-paddy font-display">
                {t('chat.title', 'Krishi Mitra')}
              </h1>
              <span className="inline-flex items-center text-[11px] font-semibold bg-mist text-paddy px-2 py-0.5 rounded-full">
                Advisory
              </span>
            </div>
            <p className="text-xs text-soil/70">
              {t('chat.subtitle', 'Grounded Agricultural Advisory & Scheme Guide')}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 text-xs text-soil/70 hover:text-paddy px-3 py-1.5 rounded-lg border border-mist bg-white hover:bg-mist/40 transition-colors shadow-2xs"
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
          <strong>Notice:</strong> {t('chat.disclaimerNotice')}
        </span>
      </div>

      {/* Unavailable Status Notice */}
      {isUnavailable && (
        <div
          role="alert"
          className="mb-3 px-4 py-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-center gap-2.5 shrink-0"
        >
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <span>{t('chat.unavailableBanner')}</span>
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
            <div className="w-16 h-16 rounded-2xl bg-mist/60 border border-mist flex items-center justify-center p-2 text-paddy mb-3 shadow-xs">
              <BrandLogo variant="icon" size={40} className="w-10 h-10" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-paddy mb-1">
              {t('chat.emptyHeading', 'Namaste! How can Krishi Mitra help you today?')}
            </h2>
            <p className="text-xs sm:text-sm text-soil/70 max-w-md mb-4">
              {t('chat.emptyDesc', 'Ask any question about crops, weather forecasts, government subsidies, soil testing, or crop nutrition.')}
            </p>
            <StarterQuestions onSelect={handleSendMessage} disabled={isLoading || isUnavailable} />
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onFeedback={handleFeedback}
                onSelectSuggestion={handleSendMessage}
                onRetry={handleSendMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Tray */}
      <div className="pt-2 border-t border-mist shrink-0 bg-cream/30">
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          disabled={isUnavailable}
        />
      </div>
    </div>
  );
};

export default Chat;
