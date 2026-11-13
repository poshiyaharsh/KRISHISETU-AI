import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Compass } from "lucide-react";

export const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 py-12">
      <div className="w-16 h-16 rounded-2xl bg-wheat/20 text-warning flex items-center justify-center mb-6">
        <Compass className="w-9 h-9" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-heading tracking-tight mb-2">
        {t("errors.notFoundTitle")}
      </h1>
      <p className="text-base text-muted max-w-md mb-8">
        {t("errors.notFoundDesc")}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-paddy text-on-dark font-bold hover:bg-paddy/90 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-paddy"
      >
        <Home className="w-5 h-5" />
        <span>{t("errors.goHome")}</span>
      </Link>
    </div>
  );
};

export default NotFound;
