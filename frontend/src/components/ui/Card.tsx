import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  stripe?: 'wheat' | 'green' | 'none';
  variant?: 'surface' | 'sunken';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  stripe = 'wheat',
  variant = 'surface',
  className = '',
  children,
  ...props
}) => {
  const bgClass = variant === 'sunken' ? 'bg-surface-sunken' : 'bg-surface';

  return (
    <div
      className={`rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${bgClass} ${className}`}
      {...props}
    >
      {stripe !== 'none' && (
        <div
          className={`h-1.5 w-full ${
            stripe === 'wheat' ? 'bg-border-wheat' : 'bg-primary'
          }`}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
};
