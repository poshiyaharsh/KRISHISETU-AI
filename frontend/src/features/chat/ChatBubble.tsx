import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, User, ThumbsUp, ThumbsDown, Copy, Check, ExternalLink } from 'lucide-react';
import { ChatMessage, ChatSource } from './types';

interface ChatBubbleProps {
  message: ChatMessage;
  onFeedback?: (messageId: string, rating: 'up' | 'down') => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onFeedback }) => {
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
      // Bold text formatting **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-forest-950">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc my-1 text-forest-900 leading-relaxed">
            {renderedLine}
          </li>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-1 leading-relaxed text-forest-900">
          {renderedLine}
        </p>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="flex gap-2 max-w-[85%] sm:max-w-[75%] items-start flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-forest-800 text-cream flex items-center justify-center shrink-0 shadow-xs">
            <User className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">You</span>
          </div>
          <div className="bg-forest-900 text-white px-4 py-3 rounded-2xl rounded-tr-xs shadow-xs text-sm sm:text-base leading-relaxed break-words">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 group">
      <div className="flex gap-2.5 max-w-[95%] sm:max-w-[85%] items-start">
        <div className="w-8 h-8 rounded-full bg-leaf-600 text-forest-950 font-bold flex items-center justify-center shrink-0 shadow-xs border border-leaf-400">
          <Bot className="w-4 h-4 text-forest-950" aria-hidden="true" />
          <span className="sr-only">Krishi Mitra</span>
        </div>

        <div className="flex-1 bg-white border border-forest-100 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-forest-50">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-forest-800">Krishi Mitra</span>
              <span className="text-[10px] font-medium bg-leaf-100 text-leaf-800 px-1.5 py-0.5 rounded-full">AI Guide</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied' : 'Copy message'}
                className="p-1 text-forest-400 hover:text-forest-700 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-forest-400"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="text-sm sm:text-base text-forest-900 space-y-1">
            {renderFormattedContent(message.content)}
          </div>

          {/* Source Citation Chips */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-forest-100">
              <div className="text-xs font-semibold text-forest-700 mb-2 flex items-center gap-1">
                <span>Verified Data Sources:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((src: ChatSource, sIdx: number) => {
                  const isInternal = src.url.startsWith('/');
                  if (isInternal) {
                    return (
                      <Link
                        key={sIdx}
                        to={src.url}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 transition-colors font-medium"
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
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 transition-colors font-medium"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="w-3 h-3 text-forest-500" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feedback Thumbs */}
          <div className="mt-3.5 pt-2 flex items-center justify-between text-xs text-forest-500">
            <span className="text-[11px] text-forest-400">Was this advice helpful?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onFeedback?.(message.id, 'up')}
                aria-label="Thumbs up - response was helpful"
                className={`p-1.5 rounded hover:bg-forest-50 transition-colors ${
                  message.feedback === 'up' ? 'text-forest-800 bg-forest-100 font-bold' : 'text-forest-400'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onFeedback?.(message.id, 'down')}
                aria-label="Thumbs down - response was unhelpful"
                className={`p-1.5 rounded hover:bg-forest-50 transition-colors ${
                  message.feedback === 'down' ? 'text-forest-800 bg-forest-100 font-bold' : 'text-forest-400'
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
