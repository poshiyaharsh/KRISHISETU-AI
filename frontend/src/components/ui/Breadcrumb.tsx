import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = '',
}) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${className}`}>
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {idx > 0 && (
                <ChevronRight className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
              )}
              {isLast || !item.href ? (
                <span className="font-bold text-soil" aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="text-text-muted hover:text-primary transition-colors font-medium"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
