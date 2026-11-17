import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  trend,
  icon,
  className = '',
}) => {
  return (
    <Card stripe="none" className={`p-4 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between text-text-muted text-xs font-bold mb-2">
        <span>{label}</span>
        {icon && <span aria-hidden="true">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-heavy text-soil tabular-nums">{value}</span>
        {unit && <span className="text-sm font-bold text-text-muted">{unit}</span>}
      </div>
      {trend && (
        <span className="text-xs font-semibold text-leaf mt-1">
          {trend}
        </span>
      )}
    </Card>
  );
};
