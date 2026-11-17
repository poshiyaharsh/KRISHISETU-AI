import React from 'react';

export interface ScoreBarProps {
  score: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  score,
  label,
  showPercentage = true,
  className = '',
}) => {
  const boundedScore = Math.max(0, Math.min(100, score));

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs font-bold text-soil">
          {label && <span>{label}</span>}
          {showPercentage && <span className="tabular-nums">{boundedScore}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={boundedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-3 bg-surface-sunken border border-border rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${boundedScore}%` }}
        />
      </div>
    </div>
  );
};
