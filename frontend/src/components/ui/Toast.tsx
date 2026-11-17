import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  onClose,
  className = '',
}) => {
  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-toast min-w-[300px] max-w-md p-4 rounded-xl shadow-lg bg-soil text-white border border-border/20 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 ${className}`}
    >
      <div className="flex items-center gap-3">
        {type === 'success' && <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />}
        {type === 'error' && <AlertCircle className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />}
        {type === 'info' && <Info className="w-5 h-5 text-accent-light shrink-0" aria-hidden="true" />}
        <p className="text-sm font-semibold">{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
