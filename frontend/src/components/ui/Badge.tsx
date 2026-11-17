import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: 'bg-[#E3EFE6] text-[#236E3B] border-[#C3DEC9]',
  warning: 'bg-[#FEF3C7] text-[#8C5E06] border-[#FDE68A]',
  danger: 'bg-[#FEE2E2] text-[#B3402F] border-[#FECACA]',
  info: 'bg-[#E0F2FE] text-[#2B6C8F] border-[#BAE6FD]',
  accent: 'bg-accent text-accent-contrast border-accent',
  neutral: 'bg-surface-sunken text-soil border-border',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border leading-none ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
