import React from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-drawer flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        className={`relative w-full bg-surface rounded-t-2xl border-t border-border shadow-2xl p-5 z-drawer max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom duration-200 pb-safe ${className}`}
      >
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4" aria-hidden="true" />
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <h3 className="text-lg font-heavy text-soil">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="p-2 rounded-lg text-text-muted hover:text-soil hover:bg-surface-sunken"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
