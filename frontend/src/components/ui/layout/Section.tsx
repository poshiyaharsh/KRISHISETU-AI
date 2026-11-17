import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  variant?: 'default' | 'sunken' | 'surface';
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  as: Component = 'section',
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const bgClass =
    variant === 'sunken'
      ? 'bg-surface-sunken'
      : variant === 'surface'
      ? 'bg-surface'
      : 'bg-transparent';

  return (
    <Component
      className={`w-full py-8 sm:py-12 min-w-0 [overflow-wrap:anywhere] ${bgClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
