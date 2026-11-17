import React from 'react';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary text-primary-contrast hover:bg-primary-light active:scale-[0.96] border border-transparent',
  secondary: 'bg-surface text-soil border border-border hover:bg-surface-sunken active:scale-[0.96]',
  ghost: 'bg-transparent text-soil hover:bg-surface-sunken active:scale-[0.96]',
  danger: 'bg-danger text-white hover:bg-danger/90 active:scale-[0.96]',
};

const sizeStyles: Record<string, string> = {
  sm: 'w-10 h-10 min-w-[40px] min-h-[40px] p-2 rounded-lg text-sm',
  md: 'w-12 h-12 min-w-[48px] min-h-[48px] p-2.5 rounded-xl text-base',
  lg: 'w-14 h-14 min-w-[54px] min-h-[54px] p-3 rounded-2xl text-lg',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        ) : (
          icon
        )}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
