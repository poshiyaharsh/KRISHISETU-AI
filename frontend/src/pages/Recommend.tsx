import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { fetchInputRanges, fetchCropRecommendation, mapApiError } from "@/features/recommend/api";
import { RecommendForm } from "@/features/recommend/RecommendForm";
import { ResultCards } from "@/features/recommend/ResultCards";
import type { CropInputs, RecommendationResponse } from "@/features/recommend/types";
import { KrishiLoader } from "@/components/Loader/KrishiLoader";
import { Skeleton } from "@/components/Skeleton/Skeleton";

export const Recommend: React.FC = () => {
  const { t } = useTranslation();
  const [lastInputs, setLastInputs] = useState<CropInputs | undefined>(undefined);
  const [resultData, setResultData] = useState<RecommendationResponse | null>(null);
  const [formServerError, setFormServerError] = useState<string | null>(null);

  // Fetch input ranges from backend single-source-of-truth
  const {
    data: ranges,
    isLoading: isRangesLoading,
    isError: isRangesError,
    refetch: refetchRanges,
  } = useQuery({
    queryKey: ["crops", "input-ranges"],
    queryFn: fetchInputRanges,
  });

  // Recommendation mutation
  const recommendationMutation = useMutation({
    mutationFn: (inputs: CropInputs) => fetchCropRecommendation(inputs),
    onSuccess: (data, variables) => {
      setLastInputs(variables);
      setResultData(data);
      setFormServerError(null);
      if (data.prediction_id) {
        try {
          const raw = localStorage.getItem("krishisetu_guest_predictions");
          const existing = raw ? JSON.parse(raw) : [];
          if (Array.isArray(existing) && !existing.includes(data.prediction_id)) {
            existing.push(data.prediction_id);
            localStorage.setItem("krishisetu_guest_predictions", JSON.stringify(existing));
          }
        } catch {
          // ignore localStorage failure in restricted contexts
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => {
      const appErr = mapApiError(error);
      setFormServerError(t(appErr.translationKey));
    },
  });

  const handleSubmit = (data: CropInputs) => {
    setLastInputs(data);
    setFormServerError(null);
    recommendationMutation.mutate(data);
  };

  const handleReset = () => {
    setResultData(null);
    setLastInputs(undefined);
    setFormServerError(null);
  };

  const handleEdit = () => {
    setResultData(null);
    setFormServerError(null);
  };

  if (isRangesLoading) {
    return (
      <div className="space-y-8 py-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-3/4 max-w-md" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 sm:p-10 rounded-3xl bg-white border border-[#02280C]/10">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isRangesError && !ranges) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-12 space-y-4">
        <div className="p-4 rounded-full bg-red-100 text-red-700">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-2xl font-bold text-[#02280C]">
          {t("errors.network")}
        </h2>
        <p className="text-sm text-[#1D2B22]/70 max-w-md">
          {t("errors.generic")}
        </p>
        <button
          type="button"
          onClick={() => refetchRanges()}
          className="px-6 py-2.5 rounded-xl bg-[#126A08] text-white font-bold hover:bg-[#02280C] transition-colors"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 sm:py-6">
      {/* Page Header */}
      {!resultData && (
        <div className="space-y-2 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#02280C] tracking-tight">
            {t("recommend.title")}
          </h1>
          <p className="text-sm sm:text-base text-[#1D2B22]/75 leading-relaxed">
            {t("recommend.subtitle")}
          </p>
        </div>
      )}

      {/* Main Flow: Form vs Results */}
      {resultData ? (
        <ResultCards
          response={resultData}
          onReset={handleReset}
          onEdit={handleEdit}
        />
      ) : recommendationMutation.isPending ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center py-16">
          <KrishiLoader />
          <p className="mt-6 text-sm font-semibold text-[#02280C]">
            {t("recommend.submittingButton")}
          </p>
        </div>
      ) : (
        <RecommendForm
          ranges={ranges}
          initialValues={lastInputs}
          onSubmit={handleSubmit}
          isLoading={recommendationMutation.isPending}
          serverError={formServerError}
        />
      )}
    </div>
  );
};

export default Recommend;
