import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      id,
      className = '',
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId();
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-bold text-soil flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-danger" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full min-h-[48px] px-4 py-2.5 pr-10 bg-surface text-soil rounded-md border text-base appearance-none transition-colors disabled:bg-surface-sunken disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer ${
              error ? 'border-danger focus:ring-danger' : 'border-border'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-text-muted" aria-hidden="true">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        {error && (
          <p id={errorId} className="text-xs font-bold text-danger mt-0.5" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-text-muted mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
