import React from 'react';

export interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div
      role="radiogroup"
      className={`inline-flex p-1 bg-surface-sunken border border-border rounded-xl gap-1 select-none ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className={`min-h-[44px] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isSelected
                ? 'bg-surface text-primary shadow-sm'
                : 'text-text-muted hover:text-soil'
            }`}
          >
            {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
