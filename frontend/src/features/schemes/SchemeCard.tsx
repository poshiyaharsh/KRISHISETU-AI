import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, Landmark, MapPin } from 'lucide-react';
import type { SchemeListItem } from './types';

interface SchemeCardProps {
  scheme: SchemeListItem;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme }) => {
  const { t } = useTranslation();

  return (
    <article className="flex flex-col justify-between p-6 bg-white rounded-xl border border-mist shadow-xs hover:shadow-md hover:border-leaf/40 transition-all">
      <div className="space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {scheme.level === 'central' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-paddy/10 text-paddy">
              <Landmark className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('schemes.card.centralBadge')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-wheat/25 text-soil">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('schemes.card.stateBadge', { state: scheme.state_name ?? 'State' })}</span>
            </span>
          )}

          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-mist/60 text-soil/80">
            {scheme.category}
          </span>
        </div>

        {/* Title & Department */}
        <div>
          <h3 className="text-lg font-bold text-soil group-hover:text-paddy transition-colors line-clamp-2">
            <Link to={`/schemes/${scheme.slug}`} className="hover:underline focus:outline-none focus:ring-2 focus:ring-leaf rounded">
              {scheme.name}
            </Link>
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{scheme.department}</p>
        </div>

        {/* Short Summary */}
        <p className="text-sm text-soil/80 leading-relaxed line-clamp-3">
          {scheme.short_description}
        </p>

        {/* Target Farmers */}
        {scheme.farmer_types.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {scheme.farmer_types.slice(0, 3).map((ft) => (
              <span key={ft} className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                {ft}
              </span>
            ))}
            {scheme.farmer_types.length > 3 && (
              <span className="text-[11px] px-1.5 py-0.5 text-gray-500">
                +{scheme.farmer_types.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer / Meta */}
      <div className="pt-4 mt-4 border-t border-mist flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 text-gray-500">
          <ShieldCheck className="w-4 h-4 text-leaf" aria-hidden="true" />
          <span>{t('schemes.card.verifiedOn', { date: scheme.last_verified_on })}</span>
        </div>

        <Link
          to={`/schemes/${scheme.slug}`}
          className="inline-flex items-center gap-1 font-semibold text-paddy hover:text-leaf transition-colors focus:outline-none focus:ring-2 focus:ring-leaf rounded px-2 py-1"
        >
          <span>{t('schemes.card.viewDetails')}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};
