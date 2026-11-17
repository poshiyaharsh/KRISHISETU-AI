import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from './Card';

export interface TaskTileProps {
  href: string;
  title: string;
  description: string;
  badge?: string;
  icon?: React.ReactNode;
  photoSrc?: string;
  stripe?: 'wheat' | 'green';
  actionLabel?: string;
  className?: string;
}

export const TaskTile: React.FC<TaskTileProps> = ({
  href,
  title,
  description,
  badge,
  icon,
  photoSrc,
  stripe = 'wheat',
  actionLabel = 'Explore',
  className = '',
}) => {
  return (
    <a
      href={href}
      className={`block text-decoration-none group select-none ${className}`}
    >
      <Card stripe={stripe} className="h-full flex flex-col justify-between">
        {photoSrc && (
          <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-surface-sunken">
            <img
              src={photoSrc}
              alt=""
              width={400}
              height={250}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {badge && (
              <span className="absolute top-3 left-3 px-3 py-1 bg-primary text-white text-xs font-bold rounded-pill shadow-sm">
                {badge}
              </span>
            )}
          </div>
        )}

        <div className="p-5 flex-1 flex flex-col justify-between gap-3">
          <div>
            {!photoSrc && badge && (
              <span className="inline-block mb-2 px-2.5 py-0.5 bg-accent-light text-soil text-xs font-bold rounded-md">
                {badge}
              </span>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              {icon && <span className="text-xl" aria-hidden="true">{icon}</span>}
              <h3 className="text-xl font-heavy text-soil group-hover:text-primary transition-colors">
                {title}
              </h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              {description}
            </p>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-sm font-bold text-primary group-hover:text-primary-light">
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </div>
        </div>
      </Card>
    </a>
  );
};
