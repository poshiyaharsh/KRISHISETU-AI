import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Landmark, AlertTriangle, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { SchemeCard } from '../features/schemes/SchemeCard';
import { SchemeFilters } from '../features/schemes/SchemeFilters';
import { fetchSchemes, fetchSchemeFacets } from '../features/schemes/api';
import { Skeleton } from '../components/Skeleton/Skeleton';
import type { SchemeFilterParams } from '../features/schemes/types';

export const Schemes: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: SchemeFilterParams = {
    q: searchParams.get('q') || undefined,
    level: searchParams.get('level') || undefined,
    category: searchParams.get('category') || undefined,
    farmer_type: searchParams.get('farmer_type') || undefined,
    state: searchParams.get('state') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  };

  const updateFilters = (newFilters: Partial<SchemeFilterParams>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        updated.set(key, String(val));
      } else {
        updated.delete(key);
      }
    });
    setSearchParams(updated);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const { data: facets } = useQuery({
    queryKey: ['schemes', 'facets'],
    queryFn: fetchSchemeFacets,
    staleTime: 1000 * 60 * 30,
  });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['schemes', 'list', filters],
    queryFn: () => fetchSchemes(filters),
    staleTime: 1000 * 60 * 5,
  });

  const totalPages = data ? Math.ceil(data.count / 12) : 1;
  const currentPage = filters.page ?? 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mist/60 text-soil text-xs font-semibold">
          <Landmark className="w-4 h-4 text-paddy" aria-hidden="true" />
          <span>Government Schemes & Subsidies</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-soil tracking-tight">
          {t('schemes.title')}
        </h1>
        <p className="text-gray-600 max-w-2xl text-base sm:text-lg">
          {t('schemes.subtitle')}
        </p>
      </div>

      {/* Filter Component */}
      <SchemeFilters
        filters={filters}
        facets={facets}
        onFilterChange={updateFilters}
        onReset={handleResetFilters}
      />

      {/* Results Count & Meta */}
      {data && !isLoading && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p className="font-medium">
            {t('schemes.filters.showingResults', { count: data.count })}
          </p>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} height={260} className="rounded-xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div
          role="alert"
          className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-base">Unable to load government schemes</h2>
              <p className="text-sm text-red-700 mt-0.5">
                {error instanceof Error ? error.message : t('errors.network')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Retry
          </button>
        </div>
      )}

      {/* Scheme Cards Grid */}
      {data && !isLoading && data.results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.results.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {data && !isLoading && data.results.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-xl border border-mist space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-mist/60 flex items-center justify-center text-soil/60">
            <Inbox className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-soil">{t('schemes.filters.noResults')}</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {t('schemes.filters.noResultsAction')}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-lg bg-paddy text-white text-sm font-semibold hover:bg-leaf transition-colors focus:outline-none focus:ring-2 focus:ring-leaf min-h-[44px]"
          >
            {t('schemes.filters.clearFilters')}
          </button>
        </div>
      )}

      {/* Pagination */}
      {data && !isLoading && totalPages > 1 && (
        <nav
          role="navigation"
          aria-label="Pagination"
          className="flex items-center justify-center gap-3 pt-6 border-t border-mist"
        >
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => updateFilters({ page: currentPage - 1 })}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-mist bg-white text-soil text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-mist/30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => updateFilters({ page: currentPage + 1 })}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-mist bg-white text-soil text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-mist/30 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default Schemes;
