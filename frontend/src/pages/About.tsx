import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export const About: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-2 border-b border-mist pb-6">
        <h1 className="text-3xl font-bold text-paddy">{t("about.title")}</h1>
        <p className="text-soil/80 text-base leading-relaxed">
          {t("about.subtitle")}
        </p>
      </header>

      <section className="rounded-xl border border-mist bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold text-paddy">
          {t("about.whatTitle")}
        </h2>
        <p className="text-soil/85 leading-relaxed">{t("about.whatBody")}</p>
      </section>

      <section className="rounded-xl border border-mist bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold text-paddy">
          {t("about.howTitle")}
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-soil/85 leading-relaxed">
          <li>{t("about.howCrs")}</li>
          <li>{t("about.howWeather")}</li>
          <li>{t("about.howSchemes")}</li>
          <li>{t("about.howNutrition")}</li>
          <li>{t("about.howChat")}</li>
        </ul>
      </section>

      <section className="rounded-xl border border-mist bg-cream/60 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-paddy">
          {t("about.limitsTitle")}
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-soil/85 leading-relaxed">
          <li>{t("about.limitCrops")}</li>
          <li>{t("about.limitLanguages")}</li>
          <li>{t("about.limitAdvisory")}</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-4 pt-2">
        <Link
          to="/recommend"
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-paddy text-cream font-medium hover:bg-paddy/90 transition-colors"
        >
          {t("nav.recommend")}
        </Link>
        <Link
          to="/privacy"
          className="inline-flex items-center px-5 py-2.5 rounded-lg border border-paddy text-paddy font-medium hover:bg-mist/50 transition-colors"
        >
          {t("nav.privacy")}
        </Link>
      </div>
    </div>
  );
};

export default About;
