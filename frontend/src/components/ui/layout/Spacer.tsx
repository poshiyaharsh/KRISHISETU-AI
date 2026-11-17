import React from 'react';

export interface SpacerProps {
  size?: '1' | '2' | '4' | '6' | '8' | '12' | '16';
  axis?: 'vertical' | 'horizontal';
}

const sizeMap: Record<string, string> = {
  '1': '0.25rem',
  '2': '0.5rem',
  '4': '1rem',
  '6': '1.5rem',
  '8': '2rem',
  '12': '3rem',
  '16': '4rem',
};

export const Spacer: React.FC<SpacerProps> = ({
  size = '4',
  axis = 'vertical',
}) => {
  const dimension = sizeMap[size] || '1rem';
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        width: axis === 'horizontal' ? dimension : '1px',
        height: axis === 'vertical' ? dimension : '1px',
        flexShrink: 0,
      }}
    />
  );
};
