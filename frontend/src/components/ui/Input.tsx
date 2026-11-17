import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  unit?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      unit,
      leftIcon,
      id,
      className = '',
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold text-soil flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
            </span>
            {unit && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-surface-sunken rounded border border-border text-text-muted">
                {unit}
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-text-muted pointer-events-none" aria-hidden="true">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full min-h-[48px] px-4 py-2.5 bg-surface text-soil rounded-md border text-base transition-colors placeholder:text-text-muted/60 disabled:bg-surface-sunken disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              leftIcon ? 'pl-11' : ''
            } ${error ? 'border-danger focus:ring-danger' : 'border-border'} ${className}`}
            {...props}
          />
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
Input.displayName = 'Input';
