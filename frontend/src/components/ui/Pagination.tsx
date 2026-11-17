import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-center gap-2 select-none ${className}`}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg border border-border bg-surface text-soil disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-sunken flex items-center justify-center"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      <span className="text-sm font-bold text-soil px-3">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg border border-border bg-surface text-soil disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-sunken flex items-center justify-center"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </nav>
  );
};
