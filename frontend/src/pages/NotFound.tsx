import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Sprout, CloudSun, Landmark, MessageSquare } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 sm:py-16 flex flex-col items-center">
      {/* 404 Visual Hero Card */}
      <Card stripe="wheat" className="w-full max-w-2xl p-6 sm:p-10 text-center flex flex-col items-center shadow-md">
        <div className="w-20 h-20 rounded-2xl bg-surface-sunken border border-border text-primary flex items-center justify-center text-4xl mb-6 shadow-sm">
          <span>🌾</span>
        </div>

        <span className="px-3 py-1 bg-accent-light text-accent-contrast text-xs font-bold rounded-pill mb-3">
          Error 404 • Page Not Found
        </span>

        <h1 className="text-3xl sm:text-4xl font-heavy text-soil tracking-tight mb-3">
          {t("errors.notFoundTitle", "This Field is Unplowed")}
        </h1>

        <p className="text-base sm:text-lg text-text-muted max-w-lg mb-8 leading-relaxed">
          {t(
            "errors.notFoundDesc",
            "The page or agricultural record you are looking for does not exist or has been relocated to another section."
          )}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              leftIcon={<Home className="w-5 h-5" aria-hidden="true" />}
            >
              {t("errors.goHome", "Return to Home")}
            </Button>
          </Link>
          <Link to="/recommend" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              leftIcon={<Sprout className="w-5 h-5 text-primary" aria-hidden="true" />}
            >
              {t("nav.recommend", "Crop Advice")}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Helpful Directory Section */}
      <div className="w-full max-w-2xl mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted text-center mb-4">
          Or explore key farming services:
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/weather"
            className="p-4 bg-surface rounded-xl border border-border hover:border-primary transition-all flex items-center gap-3 text-soil font-bold text-sm shadow-sm group"
          >
            <CloudSun className="w-5 h-5 text-accent shrink-0 group-hover:scale-110 transition-transform" />
            <span>{t("nav.weather", "Local Weather")}</span>
          </Link>
          <Link
            to="/schemes"
            className="p-4 bg-surface rounded-xl border border-border hover:border-primary transition-all flex items-center gap-3 text-soil font-bold text-sm shadow-sm group"
          >
            <Landmark className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            <span>{t("nav.schemes", "Govt Schemes")}</span>
          </Link>
          <Link
            to="/chat"
            className="p-4 bg-surface rounded-xl border border-border hover:border-primary transition-all flex items-center gap-3 text-soil font-bold text-sm shadow-sm group"
          >
            <MessageSquare className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            <span>{t("nav.chat", "Krishi Mitra")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
