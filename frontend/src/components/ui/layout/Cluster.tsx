import React from 'react';

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  gap?: '1' | '2' | '3' | '4' | '6' | '8';
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  children: React.ReactNode;
}

const gapClasses: Record<string, string> = {
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
};

const alignClasses: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
};

const justifyClasses: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export const Cluster: React.FC<ClusterProps> = ({
  as: Component = 'div',
  gap = '3',
  align = 'center',
  justify = 'start',
  wrap = true,
  className = '',
  children,
  ...props
}) => {
  return (
    <Component
      className={`flex min-w-0 ${wrap ? 'flex-wrap' : 'flex-nowrap'} ${gapClasses[gap]} ${alignClasses[align]} ${justifyClasses[justify]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
