import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, ThumbsUp, ThumbsDown, Copy, Check, ExternalLink, AlertCircle, RotateCcw } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ChatMessage, ChatSource } from './types';

interface ChatBubbleProps {
  message: ChatMessage;
  onFeedback?: (messageId: string, rating: 'up' | 'down') => void;
  onSelectSuggestion?: (question: string) => void;
  onRetry?: (text: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onFeedback,
  onSelectSuggestion,
  onRetry,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render markdown-like simple line formatting (bolding, lists, linebreaks)
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-paddy">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc my-1 text-soil leading-relaxed">
            {renderedLine}
          </li>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-1 leading-relaxed text-soil">
          {renderedLine}
        </p>
      );
    });
  };

  if (isUser) {
    const errorKey = message.error?.code ? `chat.errors.${message.error.code}` : 'chat.errors.generic';
    const errorText = message.error ? t(errorKey, message.error.message || t('chat.errors.generic')) : null;

    return (
      <div className="flex flex-col items-end mb-4 group">
        <div className="flex gap-2 max-w-[85%] sm:max-w-[75%] items-start flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-paddy text-cream flex items-center justify-center shrink-0 shadow-xs">
            <User className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">You</span>
          </div>
          <div className="bg-paddy text-cream px-4 py-3 rounded-2xl rounded-tr-xs shadow-xs text-sm sm:text-base leading-relaxed break-words">
            {message.content}
          </div>
        </div>

        {/* Inline Error Notice Directly Under User Message */}
        {message.error && (
          <div
            role="alert"
            className="mt-2 mr-10 max-w-[85%] sm:max-w-[75%] p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
              <span className="font-medium text-red-900">{errorText}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.content)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('chat.tryAgain', 'Try again')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 group">
      <div className="flex gap-2.5 max-w-[95%] sm:max-w-[85%] items-start">
        <div className="w-8 h-8 rounded-full bg-cream border border-mist p-1 flex items-center justify-center shrink-0 shadow-xs">
          <BrandLogo variant="icon" size={24} className="w-6 h-6 shrink-0" />
          <span className="sr-only">Krishi Mitra</span>
        </div>

        <div className="flex-1 bg-white border border-mist rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-mist">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-paddy">Krishi Mitra</span>
              <span className="text-[10px] font-medium bg-mist text-paddy px-1.5 py-0.5 rounded-full">Guide</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied' : 'Copy message'}
                className="p-1 text-soil/60 hover:text-paddy rounded transition-colors focus:outline-none focus:ring-1 focus:ring-paddy"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-leaf" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="text-sm sm:text-base text-soil space-y-1">
            {renderFormattedContent(message.content)}
          </div>

          {/* Suggested follow-up questions / chips */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-mist">
              <div className="text-xs font-semibold text-paddy mb-2">
                {t('chat.suggestedQuestions', 'Suggested Questions:')}
              </div>
              <div className="flex flex-wrap gap-2">
                {message.suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectSuggestion?.(s)}
                    className="text-left text-xs px-3 py-1.5 rounded-full bg-cream/70 hover:bg-mist text-paddy border border-mist transition-colors font-medium shadow-2xs hover:border-leaf/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Source Citation Chips */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-mist">
              <div className="text-xs font-semibold text-paddy mb-2 flex items-center gap-1">
                <span>{t('chat.verifiedSources', 'Verified Data Sources:')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((src: ChatSource, sIdx: number) => {
                  const isInternal = src.url.startsWith('/');
                  if (isInternal) {
                    return (
                      <Link
                        key={sIdx}
                        to={src.url}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-mist/60 hover:bg-mist text-paddy border border-mist transition-colors font-medium"
                      >
                        <span>{src.title}</span>
                      </Link>
                    );
                  }
                  return (
                    <a
                      key={sIdx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-mist/60 hover:bg-mist text-paddy border border-mist transition-colors font-medium"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="w-3 h-3 text-soil/60" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feedback Thumbs */}
          <div className="mt-3.5 pt-2 flex items-center justify-between text-xs text-soil/60">
            <span className="text-[11px] text-soil/60">{t('chat.helpfulPrompt', 'Was this advice helpful?')}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onFeedback?.(message.id, 'up')}
                aria-label="Thumbs up - response was helpful"
                className={`p-1.5 rounded hover:bg-mist/50 transition-colors ${
                  message.feedback === 'up' ? 'text-paddy bg-mist font-bold' : 'text-soil/60'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onFeedback?.(message.id, 'down')}
                aria-label="Thumbs down - response was unhelpful"
                className={`p-1.5 rounded hover:bg-mist/50 transition-colors ${
                  message.feedback === 'down' ? 'text-paddy bg-mist font-bold' : 'text-soil/60'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
