import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  action,
  className = '',
}) => {
  return (
    <div
      className={`pb-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-heavy text-soil tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-base text-text-muted mt-2 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
