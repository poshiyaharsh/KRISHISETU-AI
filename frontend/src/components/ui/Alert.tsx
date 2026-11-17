import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-[#EFF6FF]',
    border: 'border-[#BFDBFE]',
    text: 'text-[#1E40AF]',
    icon: <Info className="w-5 h-5 text-[#2563EB] shrink-0" aria-hidden="true" />,
  },
  success: {
    bg: 'bg-[#ECFDF5]',
    border: 'border-[#A7F3D0]',
    text: 'text-[#065F46]',
    icon: <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" aria-hidden="true" />,
  },
  warning: {
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#FDE68A]',
    text: 'text-[#92400E]',
    icon: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" aria-hidden="true" />,
  },
  danger: {
    bg: 'bg-[#FEF2F2]',
    border: 'border-[#FECACA]',
    text: 'text-[#991B1B]',
    icon: <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" aria-hidden="true" />,
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`rounded-lg p-4 border flex items-start gap-3 ${current.bg} ${current.border} ${current.text} ${className}`}
    >
      {current.icon}
      <div className="flex-1 text-sm leading-relaxed">
        {title && <h4 className="font-heavy text-base mb-1">{title}</h4>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="p-1 rounded-md hover:bg-black/5 text-current shrink-0 focus:outline-none"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
