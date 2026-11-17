import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-[1200px]',
  full: 'max-w-full',
};

export const Container: React.FC<ContainerProps> = ({
  as: Component = 'div',
  size = 'lg',
  className = '',
  children,
  ...props
}) => {
  return (
    <Component
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 min-w-0 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
