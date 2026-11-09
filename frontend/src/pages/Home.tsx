import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sprout,
  ArrowRight,
  FlaskConical,
  Cpu,
  Award,
  CloudSun,
  Landmark,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

export const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-white to-[#F5F0DC]/40 border border-[#02280C]/10 p-6 sm:p-12 lg:p-16 text-center sm:text-left shadow-sm">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#126A08]/10 text-[#02280C] text-xs sm:text-sm font-semibold tracking-wide">
            <Sprout className="w-4 h-4 text-[#126A08] animate-pulse" />
            <span>AI Agricultural Advisory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#02280C] tracking-tight leading-[1.15]">
            {t("home.heroTitle")}
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-[#1D2B22]/80 leading-relaxed font-normal">
            {t("home.heroSubtitle")}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              to="/recommend"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#126A08] text-white text-base sm:text-lg font-bold shadow-md hover:bg-[#02280C] hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#126A08]"
            >
              <span>{t("home.ctaButton")}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="space-y-8" aria-labelledby="how-it-works-heading">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#02280C] tracking-tight"
          >
            {t("home.howItWorksTitle")}
          </h2>
          <p className="text-sm sm:text-base text-[#1D2B22]/70">
            {t("home.howItWorksSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#02280C]/10 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#126A08]/10 text-[#126A08] flex items-center justify-center font-bold text-xl">
              <FlaskConical className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#02280C]">
              {t("home.step1Title")}
            </h3>
            <p className="text-sm text-[#1D2B22]/70 leading-relaxed">
              {t("home.step1Desc")}
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#02280C]/10 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#FAC13E]/20 text-[#8C5E06] flex items-center justify-center font-bold text-xl">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#02280C]">
              {t("home.step2Title")}
            </h3>
            <p className="text-sm text-[#1D2B22]/70 leading-relaxed">
              {t("home.step2Desc")}
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#02280C]/10 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#93C810]/20 text-[#02280C] flex items-center justify-center font-bold text-xl">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#02280C]">
              {t("home.step3Title")}
            </h3>
            <p className="text-sm text-[#1D2B22]/70 leading-relaxed">
              {t("home.step3Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* Modules Overview */}
      <section className="space-y-8" aria-labelledby="modules-heading">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2
            id="modules-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#02280C] tracking-tight"
          >
            {t("home.modulesTitle")}
          </h2>
          <p className="text-sm sm:text-base text-[#1D2B22]/70">
            {t("home.modulesSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Active Module: CRS */}
          <Link
            to="/recommend"
            className="group p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#126A08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#126A08]/10 text-[#126A08] flex items-center justify-center">
                  <Sprout className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#236E3B]/10 text-[#236E3B] text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Live</span>
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#02280C] group-hover:text-[#126A08] transition-colors">
                {t("home.crsModuleTitle")}
              </h3>
              <p className="text-sm text-[#1D2B22]/70 leading-relaxed">
                {t("home.crsModuleDesc")}
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-sm font-bold text-[#126A08]">
              <span>Explore Crop Advisory</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Active Module: Weather */}
          <Link
            to="/weather"
            className="group p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#126A08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#126A08]/10 text-[#126A08] flex items-center justify-center">
                  <CloudSun className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#236E3B]/10 text-[#236E3B] text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Live</span>
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#02280C] group-hover:text-[#126A08] transition-colors">
                {t("home.weatherModuleTitle")}
              </h3>
              <p className="text-sm text-[#1D2B22]/70 leading-relaxed">
                {t("home.weatherModuleDesc")}
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-sm font-bold text-[#126A08]">
              <span>Check Farm Forecast</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Active Module: Schemes */}
          <Link
            to="/schemes"
            className="group p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#126A08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#126A08]/10 text-[#126A08] flex items-center justify-center">
                  <Landmark className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#236E3B]/10 text-[#236E3B] text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Live</span>
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#02280C] group-hover:text-[#126A08] transition-colors">
                {t("home.schemesModuleTitle")}
              </h3>
              <p className="text-sm text-[#1D2B22]/70 leading-relaxed">
                {t("home.schemesModuleDesc")}
              </p>
            </div>
            <div className="pt-6 flex items-center gap-2 text-sm font-bold text-[#126A08]">
              <span>Discover Subsidies & Schemes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Planned Module: Krishi Mitra */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white/70 border border-[#02280C]/10 shadow-sm opacity-85 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#1D2B22]/5 text-[#1D2B22]/50 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#1D2B22]/5 text-[#1D2B22]/60 text-xs font-medium">
                  {t("common.comingSoon")}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1D2B22]/80">
                {t("home.chatModuleTitle")}
              </h3>
              <p className="text-sm text-[#1D2B22]/60 leading-relaxed">
                {t("home.chatModuleDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
