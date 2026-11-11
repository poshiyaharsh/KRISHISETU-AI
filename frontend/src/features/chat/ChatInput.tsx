import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const MAX_CHARS = 1000;

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled || trimmed.length > MAX_CHARS) {
      return;
    }
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const charsLeft = MAX_CHARS - text.length;
  const isOverLimit = charsLeft < 0;

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="flex items-end gap-2 bg-white rounded-2xl border border-mist shadow-sm p-2 focus-within:ring-2 focus-within:ring-paddy focus-within:border-paddy transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          placeholder="Ask Krishi Mitra about crops, schemes, soil, or weather..."
          rows={1}
          aria-label="Ask Krishi Mitra"
          className="w-full resize-none max-h-36 px-2.5 py-1.5 text-sm sm:text-base text-soil placeholder:text-soil/40 focus:outline-none bg-transparent disabled:opacity-50"
        />

        {/* 48px minimum accessible tap target send button */}
        <button
          type="submit"
          disabled={!text.trim() || isLoading || disabled || isOverLimit}
          aria-label="Send message"
          className="w-12 h-12 shrink-0 rounded-xl bg-paddy hover:bg-paddy/90 text-cream flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-paddy"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-cream" aria-hidden="true" />
          ) : (
            <Send className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {text.length > 800 && (
        <div
          className={`text-[11px] mt-1 text-right font-medium px-2 ${
            isOverLimit ? 'text-danger' : 'text-soil/60'
          }`}
        >
          {charsLeft} characters remaining
        </div>
      )}
    </form>
  );
};
