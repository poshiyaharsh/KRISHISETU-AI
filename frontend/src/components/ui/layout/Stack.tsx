import React from 'react';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  gap?: '1' | '2' | '3' | '4' | '6' | '8' | '12';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  children: React.ReactNode;
}

const gapClasses: Record<string, string> = {
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
  '12': 'gap-12',
};

const alignClasses: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export const Stack: React.FC<StackProps> = ({
  as: Component = 'div',
  gap = '4',
  align = 'stretch',
  justify = 'start',
  className = '',
  children,
  ...props
}) => {
  return (
    <Component
      className={`flex flex-col min-w-0 ${gapClasses[gap]} ${alignClasses[align]} ${justifyClasses[justify]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
