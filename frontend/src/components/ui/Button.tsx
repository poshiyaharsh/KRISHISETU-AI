import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary text-primary-contrast hover:bg-primary-light active:scale-[0.98] border border-transparent shadow-sm',
  secondary: 'bg-surface text-soil border border-border hover:bg-surface-sunken active:scale-[0.98]',
  accent: 'bg-accent text-accent-contrast font-bold hover:bg-accent/90 active:scale-[0.98] shadow-sm',
  ghost: 'bg-transparent text-soil hover:bg-surface-sunken active:scale-[0.98]',
  danger: 'bg-danger text-white hover:bg-danger/90 active:scale-[0.98] shadow-sm',
};

const sizeStyles: Record<string, string> = {
  sm: 'min-h-[40px] px-3 py-1.5 text-sm rounded-md',
  md: 'min-h-[48px] px-4 py-2.5 text-base rounded-lg',
  lg: 'min-h-[54px] px-6 py-3.5 text-lg rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-bold tracking-tight gap-2 transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';
