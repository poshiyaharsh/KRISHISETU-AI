import React from 'react';

export interface RangeBarProps {
  label: string;
  value: number;
  min: number;
  max: number;
  idealMin: number;
  idealMax: number;
  unit: string;
  className?: string;
}

export const RangeBar: React.FC<RangeBarProps> = ({
  label,
  value,
  min,
  max,
  idealMin,
  idealMax,
  unit,
  className = '',
}) => {
  const range = max - min;
  const leftPercent = Math.max(0, Math.min(100, ((idealMin - min) / range) * 100));
  const widthPercent = Math.max(0, Math.min(100, ((idealMax - idealMin) / range) * 100));
  const valPercent = Math.max(0, Math.min(100, ((value - min) / range) * 100));
  const isIdeal = value >= idealMin && value <= idealMax;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-baseline text-xs">
        <span className="font-bold text-soil">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`font-heavy tabular-nums ${isIdeal ? 'text-leaf' : 'text-warning'}`}>
            {value} {unit}
          </span>
          <span className="text-text-muted">
            (Ideal: {idealMin}–{idealMax})
          </span>
        </div>
      </div>

      <div className="relative w-full h-3 bg-surface-sunken border border-border rounded-full overflow-hidden">
        {/* Ideal range zone */}
        <div
          className="absolute h-full bg-[#C3DEC9] opacity-80"
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
        />
        {/* Current value pin */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-primary -ml-0.5 shadow-sm"
          style={{ left: `${valPercent}%` }}
        />
      </div>
    </div>
  );
};
