import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 text-center bg-surface border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-3 ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-sunken flex items-center justify-center text-3xl text-primary mb-2">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-heavy text-soil">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-2">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
