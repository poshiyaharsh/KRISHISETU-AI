import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileText,
  HelpCircle,
  AlertTriangle,
  Landmark,
  MapPin,
  Gift,
} from 'lucide-react';
import { fetchSchemeDetail } from '../features/schemes/api';
import { Skeleton } from '../components/Skeleton/Skeleton';

export const SchemeDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  const {
    data: scheme,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['schemes', 'detail', slug],
    queryFn: () => (slug ? fetchSchemeDetail(slug) : Promise.reject(new Error('Missing slug'))),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 15,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" aria-busy="true">
        <Skeleton height={32} width={180} className="rounded-lg" />
        <Skeleton height={200} className="rounded-xl" />
        <Skeleton height={140} className="rounded-xl" />
        <Skeleton height={140} className="rounded-xl" />
      </div>
    );
  }

  if (isError || !scheme) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div
          role="alert"
          className="p-8 rounded-xl bg-red-50 border border-red-200 text-red-900 text-center space-y-4"
        >
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold">Scheme Not Found</h2>
          <p className="text-sm text-red-700 max-w-md mx-auto">
            {error instanceof Error ? error.message : 'The requested scheme could not be found.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/schemes"
              className="px-4 py-2 rounded-lg bg-paddy text-white text-sm font-semibold hover:bg-leaf transition-colors"
            >
              {t('schemes.detail.backToSchemes')}
            </Link>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg border border-red-300 bg-white text-red-800 text-sm font-semibold hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <Link
        to="/schemes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-paddy hover:text-leaf transition-colors focus:outline-none focus:ring-2 focus:ring-leaf rounded px-2 py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('schemes.detail.backToSchemes')}</span>
      </Link>

      {/* Hero Header */}
      <header className="bg-white rounded-2xl border border-mist shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {scheme.level === 'central' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-paddy/10 text-paddy">
              <Landmark className="w-4 h-4" aria-hidden="true" />
              <span>{t('schemes.card.centralBadge')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-wheat/30 text-soil">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <span>{t('schemes.card.stateBadge', { state: scheme.state_name ?? 'State' })}</span>
            </span>
          )}

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-mist/60 text-soil">
            {scheme.category.name}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-soil tracking-tight">
          {scheme.name}
        </h1>

        <p className="text-sm font-medium text-gray-500">{scheme.department}</p>

        <p className="text-base text-soil/90 leading-relaxed pt-2 border-t border-mist">
          {scheme.description}
        </p>

        {/* Verification banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-gray-600 bg-mist/30 p-3 rounded-lg">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-leaf shrink-0" aria-hidden="true" />
            <span>{t('schemes.detail.verifiedNotice', { date: scheme.last_verified_on })}</span>
          </div>
          <span className="text-gray-500">
            {t('schemes.detail.sourceAttribution', { name: scheme.source_name })}
          </span>
        </div>
      </header>

      {/* Detail Sections */}
      <div className="space-y-6">
        {/* Benefits Section */}
        <section className="bg-white rounded-xl border border-mist shadow-xs p-6 space-y-3">
          <div className="flex items-center gap-2 text-paddy font-bold text-lg">
            <Gift className="w-5 h-5 text-paddy" aria-hidden="true" />
            <h2>{t('schemes.detail.benefitsTitle')}</h2>
          </div>
          <p className="text-soil/90 leading-relaxed text-sm whitespace-pre-line">
            {scheme.benefits}
          </p>
        </section>

        {/* Eligibility Section */}
        <section className="bg-white rounded-xl border border-mist shadow-xs p-6 space-y-3">
          <div className="flex items-center gap-2 text-paddy font-bold text-lg">
            <CheckCircle2 className="w-5 h-5 text-leaf" aria-hidden="true" />
            <h2>{t('schemes.detail.eligibilityTitle')}</h2>
          </div>
          <p className="text-soil/90 leading-relaxed text-sm whitespace-pre-line">
            {scheme.eligibility}
          </p>

          {scheme.farmer_types.length > 0 && (
            <div className="pt-2">
              <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                Eligible Farmer Categories:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scheme.farmer_types.map((ft) => (
                  <span
                    key={ft.id}
                    className="text-xs px-2.5 py-1 rounded bg-mist/50 text-soil font-medium"
                  >
                    {ft.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Documents Section */}
        <section className="bg-white rounded-xl border border-mist shadow-xs p-6 space-y-3">
          <div className="flex items-center gap-2 text-paddy font-bold text-lg">
            <FileText className="w-5 h-5 text-leaf" aria-hidden="true" />
            <h2>{t('schemes.detail.documentsTitle')}</h2>
          </div>
          <p className="text-soil/90 leading-relaxed text-sm whitespace-pre-line">
            {scheme.documents_required}
          </p>
        </section>

        {/* How to Apply Section */}
        <section className="bg-white rounded-xl border border-mist shadow-xs p-6 space-y-3">
          <div className="flex items-center gap-2 text-paddy font-bold text-lg">
            <HelpCircle className="w-5 h-5 text-paddy" aria-hidden="true" />
            <h2>{t('schemes.detail.howToApplyTitle')}</h2>
          </div>
          <p className="text-soil/90 leading-relaxed text-sm whitespace-pre-line">
            {scheme.how_to_apply}
          </p>
        </section>
      </div>

      {/* Official Portal Apply CTA */}
      <div className="bg-gradient-to-r from-paddy to-soil text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-cream">Ready to Apply?</h3>
            <p className="text-xs sm:text-sm text-mist/90 mt-1 max-w-xl leading-relaxed">
              {t('schemes.detail.disclaimerNotice')}
            </p>
          </div>

          <a
            href={scheme.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-wheat hover:bg-wheat/90 text-soil font-bold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-cream shrink-0 min-h-[48px]"
          >
            <span>{t('schemes.detail.officialPortal')}</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SchemeDetail;
