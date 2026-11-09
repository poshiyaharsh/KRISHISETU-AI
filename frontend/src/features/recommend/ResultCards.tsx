import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Award, AlertTriangle, RotateCcw, Edit3, ShieldAlert, Apple } from "lucide-react";
import type { RecommendationResponse, RecommendationSuitability } from "./types";

interface ResultCardsProps {
  response: RecommendationResponse;
  onReset: () => void;
  onEdit: () => void;
}

const SUITABILITY_BADGES: Record<
  RecommendationSuitability,
  { bg: string; text: string; border: string }
> = {
  strongly_recommended: {
    bg: "bg-[#236E3B]/10",
    text: "text-[#236E3B]",
    border: "border-[#236E3B]/20",
  },
  recommended: {
    bg: "bg-[#FAC13E]/20",
    text: "text-[#8C5E06]",
    border: "border-[#FAC13E]/30",
  },
  conditional: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
  },
};

export const ResultCards: React.FC<ResultCardsProps> = ({
  response,
  onReset,
  onEdit,
}) => {
  const { t } = useTranslation();
  const { results, warnings, model } = response;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header and Action controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#02280C]/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#02280C]">
              {t("recommend.resultsTitle")}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#126A08]/10 text-[#02280C] font-semibold">
              Model: {model.version}
            </span>
          </div>
          <p className="text-sm text-[#1D2B22]/70 mt-1">
            {t("recommend.resultsSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#02280C]/20 bg-white text-[#02280C] text-sm font-semibold hover:bg-[#02280C]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#126A08]"
          >
            <Edit3 className="w-4 h-4" />
            <span>{t("recommend.editButton")}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#126A08] text-white text-sm font-bold hover:bg-[#02280C] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#126A08]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t("recommend.resetButton")}</span>
          </button>
        </div>
      </div>

      {/* Agronomic Warnings (if any) */}
      {warnings && warnings.length > 0 && (
        <div
          role="status"
          className="p-5 rounded-2xl bg-[#FAC13E]/15 border border-[#FAC13E]/30 text-[#8C5E06] space-y-2"
        >
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{t("recommend.warningsTitle")}</span>
          </div>
          <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 pl-1">
            {warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Top 3 Crop Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {results.map((item) => {
          const badge = SUITABILITY_BADGES[item.label] || SUITABILITY_BADGES.conditional;
          const percentage = Math.round(item.score * 100);
          const isTop = item.rank === 1;

          return (
            <div
              key={item.crop.key}
              className={`rounded-3xl p-6 sm:p-8 bg-white border transition-all flex flex-col justify-between ${
                isTop
                  ? "border-2 border-[#126A08] shadow-md ring-4 ring-[#126A08]/5"
                  : "border-[#02280C]/10 shadow-sm"
              }`}
            >
              <div className="space-y-5">
                {/* Header: Rank + Suitability Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                        isTop
                          ? "bg-[#126A08] text-white shadow-sm"
                          : "bg-[#02280C]/5 text-[#02280C]"
                      }`}
                    >
                      #{item.rank}
                    </div>
                    {isTop && (
                      <span className="text-xs font-bold text-[#126A08] flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        Top Match
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {t(`recommend.labels.${item.label}`)}
                  </span>
                </div>

                {/* Crop Identity */}
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#02280C] tracking-tight">
                    {t(`crops.${item.crop.key}`, item.crop.name)}
                  </h3>
                  <p className="text-xs text-[#1D2B22]/60 mt-0.5">
                    Scientific Class: <span className="font-mono">{item.crop.key}</span>
                  </p>
                </div>

                {/* Confidence Bar & Percentage (Never color alone) */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#1D2B22]/70">
                      {t("recommend.score")}
                    </span>
                    <span className="font-mono font-bold text-[#02280C]">
                      {percentage}% ({item.score.toFixed(4)})
                    </span>
                  </div>

                  <div
                    className="w-full h-3 rounded-full bg-[#1D2B22]/10 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Model confidence for ${item.crop.name}: ${percentage}%`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max(percentage, 3)}%`,
                        backgroundColor: isTop ? "#126A08" : "#93C810",
                      }}
                    />
                  </div>
                </div>
                {/* Link to Nutrition Module */}
                <div className="pt-2">
                  <Link
                    to={`/nutrition?crop=${item.crop.key}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#126A08] hover:text-[#02280C] underline hover:no-underline"
                  >
                    <Apple className="w-3.5 h-3.5" />
                    <span>{t("recommend.nutritionInfo", "Nutrition info")} &rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Informative Note */}
              <div className="pt-6 mt-6 border-t border-[#02280C]/10 text-xs text-[#1D2B22]/60 leading-relaxed">
                {t("recommend.confidenceNote")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advisory disclaimer footer banner */}
      <div className="p-4 rounded-2xl bg-[#02280C]/5 border border-[#02280C]/10 flex items-start gap-3 text-xs text-[#1D2B22]/80 leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-[#126A08] flex-shrink-0 mt-0.5" />
        <p>{t("common.safetyDisclaimer")}</p>
      </div>
    </div>
  );
};
