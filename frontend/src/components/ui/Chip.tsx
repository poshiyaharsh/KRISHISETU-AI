import React from 'react';
import { X } from 'lucide-react';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onSelect,
  onRemove,
  icon,
  className = '',
}) => {
  return (
    <span
      onClick={onSelect}
      className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-pill text-sm font-bold border transition-colors select-none ${
        onSelect ? 'cursor-pointer active:scale-95' : ''
      } ${
        selected
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-surface text-soil border-border hover:bg-surface-sunken'
      } ${className}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label}`}
          className="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors focus:outline-none"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </span>
  );
};
