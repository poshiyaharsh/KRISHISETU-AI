import React from 'react';

export interface NumberStepperFieldProps {
  id?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  helperText?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const NumberStepperField: React.FC<NumberStepperFieldProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  helperText,
  onChange,
  className = '',
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  const handleStep = (delta: number) => {
    let nextVal = value + delta;
    if (nextVal < min) nextVal = min;
    if (nextVal > max) nextVal = max;
    // Round to avoid float precision issues
    const decimals = step.toString().split('.')[1]?.length || 0;
    const factor = Math.pow(10, decimals);
    onChange(Math.round(nextVal * factor) / factor);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className={`bg-surface-sunken border border-border rounded-lg p-4 flex flex-col gap-3 ${className}`}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={inputId} className="text-base font-bold text-soil">
          {label}
        </label>
        <span className="text-xs font-bold text-text-muted bg-[#EAE6DE] px-2.5 py-1 rounded-md">
          {unit}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => handleStep(-step)}
          disabled={value <= min}
          aria-label={`Decrease ${label} by ${step}`}
          className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl border border-border bg-surface text-soil text-2xl font-bold flex items-center justify-center cursor-pointer select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-sunken transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          −
        </button>

        <span className="flex-1 text-center text-2xl font-heavy text-primary tabular-nums">
          {value}
        </span>

        <button
          type="button"
          onClick={() => handleStep(step)}
          disabled={value >= max}
          aria-label={`Increase ${label} by ${step}`}
          className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl border border-border bg-surface text-soil text-2xl font-bold flex items-center justify-center cursor-pointer select-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-sunken transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          +
        </button>
      </div>

      <input
        type="range"
        id={inputId}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        aria-label={`${label} slider`}
        className="w-full h-7 py-2.5 bg-transparent cursor-pointer accent-primary"
      />

      {helperText && (
        <p className="text-xs text-text-muted mt-0.5">{helperText}</p>
      )}
    </div>
  );
};
