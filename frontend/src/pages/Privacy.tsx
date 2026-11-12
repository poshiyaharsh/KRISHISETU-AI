import React from "react";
import { useTranslation } from "react-i18next";

export const Privacy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-2 border-b border-mist pb-6">
        <h1 className="text-3xl font-bold text-paddy">{t("privacy.title")}</h1>
        <p className="text-soil/80 text-base leading-relaxed">
          {t("privacy.subtitle")}
        </p>
      </header>

      <section className="rounded-xl border border-mist bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold text-paddy">
          {t("privacy.storedTitle")}
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-soil/85 leading-relaxed">
          <li>{t("privacy.storedIp")}</li>
          <li>{t("privacy.storedChat")}</li>
          <li>{t("privacy.storedFeedback")}</li>
          <li>{t("privacy.storedLocal")}</li>
        </ul>
      </section>

      <section className="rounded-xl border border-mist bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold text-paddy">
          {t("privacy.thirdPartyTitle")}
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-soil/85 leading-relaxed">
          <li>{t("privacy.thirdPartyWeather")}</li>
          <li>{t("privacy.thirdPartyLlm")}</li>
          <li>{t("privacy.thirdPartyHosting")}</li>
        </ul>
      </section>

      <section className="rounded-xl border border-mist bg-cream/60 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-paddy">
          {t("privacy.deletionTitle")}
        </h2>
        <p className="text-soil/85 leading-relaxed">
          {t("privacy.deletionBody")}
        </p>
      </section>
    </div>
  );
};

export default Privacy;
