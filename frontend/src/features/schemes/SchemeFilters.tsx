import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import type { SchemeFacetsResponse, SchemeFilterParams } from './types';

interface SchemeFiltersProps {
  filters: SchemeFilterParams;
  facets: SchemeFacetsResponse | undefined;
  onFilterChange: (newFilters: Partial<SchemeFilterParams>) => void;
  onReset: () => void;
}

export const SchemeFilters: React.FC<SchemeFiltersProps> = ({
  filters,
  facets,
  onFilterChange,
  onReset,
}) => {
  const { t } = useTranslation();
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const hasActiveFilters = Boolean(
    filters.q || filters.level || filters.category || filters.farmer_type || filters.state
  );

  return (
    <div className="bg-white rounded-xl shadow-xs border border-mist p-4 sm:p-6 space-y-4">
      {/* Search Bar + Mobile Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            id="scheme-search-input"
            type="text"
            value={filters.q ?? ''}
            onChange={(e) => onFilterChange({ q: e.target.value, page: 1 })}
            placeholder={t('schemes.searchPlaceholder')}
            className="w-full h-12 pl-10 pr-10 bg-white border border-mist rounded-lg text-soil focus:outline-none focus:ring-2 focus:ring-leaf text-sm"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" aria-hidden="true" />
          {filters.q && (
            <button
              type="button"
              onClick={() => onFilterChange({ q: '', page: 1 })}
              aria-label="Clear search"
              className="absolute right-3 top-3.5 text-gray-400 hover:text-soil"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="sm:hidden flex items-center justify-center gap-2 h-12 px-4 rounded-lg bg-mist/40 text-soil text-sm font-semibold border border-mist"
        >
          <Filter className="w-4 h-4 text-paddy" aria-hidden="true" />
          <span>{t('schemes.filters.filterTitle')}</span>
        </button>
      </div>

      {/* Filter Controls (Desktop visible, Mobile collapsible) */}
      <div className={`space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 ${mobileExpanded ? 'block' : 'hidden sm:grid'}`}>
        {/* Level Select */}
        <div>
          <label htmlFor="filter-level" className="block text-xs font-semibold text-gray-600 mb-1">
            Level
          </label>
          <select
            id="filter-level"
            value={filters.level ?? ''}
            onChange={(e) => onFilterChange({ level: e.target.value, page: 1 })}
            className="w-full h-11 px-3 py-2 bg-white border border-mist rounded-lg text-soil focus:outline-none focus:ring-2 focus:ring-leaf text-sm"
          >
            <option value="">{t('schemes.filters.allLevels')}</option>
            <option value="central">{t('schemes.filters.centralOnly')}</option>
            <option value="state">{t('schemes.filters.stateOnly')}</option>
          </select>
        </div>

        {/* Category Select */}
        <div>
          <label htmlFor="filter-category" className="block text-xs font-semibold text-gray-600 mb-1">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category ?? ''}
            onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
            className="w-full h-11 px-3 py-2 bg-white border border-mist rounded-lg text-soil focus:outline-none focus:ring-2 focus:ring-leaf text-sm"
          >
            <option value="">{t('schemes.filters.allCategories')}</option>
            {facets?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </div>

        {/* State Select */}
        <div>
          <label htmlFor="filter-state" className="block text-xs font-semibold text-gray-600 mb-1">
            State
          </label>
          <select
            id="filter-state"
            value={filters.state ?? ''}
            onChange={(e) => onFilterChange({ state: e.target.value, page: 1 })}
            className="w-full h-11 px-3 py-2 bg-white border border-mist rounded-lg text-soil focus:outline-none focus:ring-2 focus:ring-leaf text-sm"
          >
            <option value="">{t('schemes.filters.allStates')}</option>
            {facets?.states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.count})
              </option>
            ))}
          </select>
        </div>

        {/* Farmer Type Select */}
        <div>
          <label htmlFor="filter-farmer-type" className="block text-xs font-semibold text-gray-600 mb-1">
            {t('schemes.filters.farmerTypes')}
          </label>
          <select
            id="filter-farmer-type"
            value={filters.farmer_type ?? ''}
            onChange={(e) => onFilterChange({ farmer_type: e.target.value, page: 1 })}
            className="w-full h-11 px-3 py-2 bg-white border border-mist rounded-lg text-soil focus:outline-none focus:ring-2 focus:ring-leaf text-sm"
          >
            <option value="">All Farmer Types</option>
            {facets?.farmer_types.map((ft) => (
              <option key={ft.id} value={ft.id}>
                {ft.name} ({ft.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset button when active */}
      {hasActiveFilters && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-soil hover:bg-mist/40 transition-colors focus:outline-none focus:ring-2 focus:ring-leaf min-h-[36px]"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('schemes.filters.clearFilters')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
