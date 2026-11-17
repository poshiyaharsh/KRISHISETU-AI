import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-8 text-center bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center text-danger mb-1">
        <AlertTriangle className="w-7 h-7" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-heavy text-soil">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-2">
          <Button
            variant="danger"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
