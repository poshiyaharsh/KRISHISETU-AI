import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Compass } from "lucide-react";

export const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 py-12">
      <div className="w-16 h-16 rounded-2xl bg-[#FAC13E]/20 text-[#8C5E06] flex items-center justify-center mb-6">
        <Compass className="w-9 h-9" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#02280C] tracking-tight mb-2">
        {t("errors.notFoundTitle")}
      </h1>
      <p className="text-base text-[#1D2B22]/70 max-w-md mb-8">
        {t("errors.notFoundDesc")}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#126A08] text-white font-bold hover:bg-[#02280C] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#126A08]"
      >
        <Home className="w-5 h-5" />
        <span>{t("errors.goHome")}</span>
      </Link>
    </div>
  );
};

export default NotFound;
