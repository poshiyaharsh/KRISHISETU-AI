import React from 'react';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  colsSm?: 1 | 2 | 3 | 4;
  colsMd?: 1 | 2 | 3 | 4;
  colsLg?: 1 | 2 | 3 | 4;
  gap?: '2' | '3' | '4' | '6' | '8';
  children: React.ReactNode;
}

const gapClasses: Record<string, string> = {
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
};

const colClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

const colSmClasses: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

const colMdClasses: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

const colLgClasses: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

export const Grid: React.FC<GridProps> = ({
  as: Component = 'div',
  cols = 1,
  colsSm,
  colsMd,
  colsLg,
  gap = '4',
  className = '',
  children,
  ...props
}) => {
  const dynamicClasses = [
    colClasses[cols] || 'grid-cols-1',
    colsSm ? colSmClasses[colsSm] : '',
    colsMd ? colMdClasses[colsMd] : '',
    colsLg ? colLgClasses[colsLg] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      className={`grid min-w-0 ${gapClasses[gap]} ${dynamicClasses} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
