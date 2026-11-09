import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Sparkles, HelpCircle, AlertCircle } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

import type { CropInputs, InputRangesResponse } from "./types";
import { createRecommendSchema, SAMPLE_VALUES, FALLBACK_RANGES } from "./schema";

interface RecommendFormProps {
  ranges?: InputRangesResponse;
  initialValues?: CropInputs;
  onSubmit: (data: CropInputs) => void;
  isLoading: boolean;
  serverError?: string | null;
}

const FIELD_CONFIGS: Array<{
  key: keyof CropInputs;
  step: string;
  inputMode: "decimal" | "numeric";
}> = [
  { key: "nitrogen", step: "1", inputMode: "numeric" },
  { key: "phosphorus", step: "1", inputMode: "numeric" },
  { key: "potassium", step: "1", inputMode: "numeric" },
  { key: "temperature", step: "0.1", inputMode: "decimal" },
  { key: "humidity", step: "0.1", inputMode: "decimal" },
  { key: "ph", step: "0.1", inputMode: "decimal" },
  { key: "rainfall", step: "0.5", inputMode: "decimal" },
];

export const RecommendForm: React.FC<RecommendFormProps> = ({
  ranges = FALLBACK_RANGES,
  initialValues,
  onSubmit,
  isLoading,
  serverError,
}) => {
  const { t } = useTranslation();
  const schema = createRecommendSchema(ranges);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CropInputs>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      nitrogen: undefined,
      phosphorus: undefined,
      potassium: undefined,
      temperature: undefined,
      humidity: undefined,
      ph: undefined,
      rainfall: undefined,
    },
  });

  const handleFillSample = () => {
    (Object.keys(SAMPLE_VALUES) as Array<keyof CropInputs>).forEach((key) => {
      setValue(key, SAMPLE_VALUES[key], { shouldValidate: true });
    });
  };

  return (
    <Tooltip.Provider delayDuration={200}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-8 rounded-3xl bg-white border border-[#02280C]/10 p-6 sm:p-10 shadow-sm"
        aria-label={t("recommend.formLegend")}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#02280C]/10 pb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#02280C]">
              {t("recommend.formLegend")}
            </h2>
            <p className="text-xs sm:text-sm text-[#1D2B22]/70 mt-1">
              Provide soil test values or enter approximate environmental readings.
            </p>
          </div>

          <button
            type="button"
            onClick={handleFillSample}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#126A08]/30 bg-[#126A08]/5 text-[#02280C] text-sm font-semibold hover:bg-[#126A08]/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#126A08] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#126A08]" />
            <span>{t("recommend.sampleButton")}</span>
          </button>
        </div>

        {serverError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">Error: </span>
              {serverError}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FIELD_CONFIGS.map(({ key, step, inputMode }) => {
            const meta = ranges[key] || FALLBACK_RANGES[key];
            const error = errors[key];
            const inputId = `field-${key}`;
            const helperId = `help-${key}`;
            const errorId = `error-${key}`;

            return (
              <div key={key} className="space-y-1.5 flex flex-col justify-start">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={inputId}
                    className="text-sm font-bold text-[#02280C] flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{t(`recommend.fields.${key}.label`)}</span>
                    <span className="text-xs font-normal text-[#1D2B22]/60">
                      ({meta.unit})
                    </span>
                  </label>

                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        aria-label={`Help: ${t(`recommend.fields.${key}.label`)}`}
                        className="text-[#1D2B22]/50 hover:text-[#126A08] transition-colors p-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#126A08]"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        id={helperId}
                        side="top"
                        className="z-50 max-w-xs rounded-lg bg-[#02280C] text-white px-3 py-2 text-xs leading-relaxed shadow-lg select-none"
                      >
                        {t(`recommend.fields.${key}.tooltip`)}
                        <Tooltip.Arrow className="fill-[#02280C]" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>

                <div className="relative">
                  <input
                    id={inputId}
                    type="number"
                    step={step}
                    inputMode={inputMode}
                    min={meta.absolute_min}
                    max={meta.absolute_max}
                    placeholder={`e.g. ${meta.min} - ${meta.max}`}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    disabled={isLoading}
                    {...register(key, { valueAsNumber: true })}
                    className={`w-full px-4 py-3 rounded-xl border text-base font-medium transition-colors bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      error
                        ? "border-red-500 focus:ring-red-500 text-red-900"
                        : "border-[#02280C]/20 focus:border-[#126A08] focus:ring-[#126A08] text-[#02280C]"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#1D2B22]/60 pt-0.5">
                  <span>Typical: {meta.min} – {meta.max} {meta.unit}</span>
                </div>

                {error && (
                  <p id={errorId} role="alert" className="text-xs font-semibold text-red-600 mt-1">
                    {error.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[#02280C]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#1D2B22]/60 text-center sm:text-left">
            All 7 parameters are validated before running ML inference.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-[#126A08] text-white text-base font-bold shadow-md hover:bg-[#02280C] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#126A08] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t("recommend.submittingButton")}</span>
              </>
            ) : (
              <span>{t("recommend.submitButton")}</span>
            )}
          </button>
        </div>
      </form>
    </Tooltip.Provider>
  );
};
