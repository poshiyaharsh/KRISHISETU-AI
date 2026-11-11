import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, Sprout } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";

export const MainLayout: React.FC = () => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: t("nav.home"), available: true },
    { to: "/recommend", label: t("nav.recommend"), available: true },
    { to: "/weather", label: t("nav.weather"), available: true },
    { to: "/schemes", label: t("nav.schemes"), available: true },
    { to: "/nutrition", label: t("nav.nutrition"), available: true },
    { to: "/chat", label: t("nav.chatbot"), available: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0DC]/20 text-[#1D2B22] font-sans antialiased selection:bg-[#93C810]/30 selection:text-[#02280C]">
      {/* Skip to main content link for screen reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#02280C] focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#93C810]"
      >
        {t("common.skipToContent")}
      </a>

      {/* Main navigation header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#02280C]/10 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Name */}
            <Link
              to="/"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#126A08] rounded-md"
              aria-label={t("common.appName")}
            >
              <img
                src="/logo-icon.svg"
                alt=""
                className="w-9 h-9 sm:w-11 sm:h-11 transition-transform group-hover:scale-105"
                width="44"
                height="44"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl text-[#02280C] tracking-tight leading-none">
                  KrishiSetu <span className="text-[#126A08]">AI</span>
                </span>
                <span className="text-[10px] sm:text-xs text-[#1D2B22]/70 font-medium tracking-wide hidden sm:inline-block">
                  {t("common.tagline")}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
              {navItems.map((item) =>
                item.available ? (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#126A08] ${
                        isActive
                          ? "bg-[#126A08]/10 text-[#02280C] font-bold"
                          : "text-[#1D2B22]/80 hover:text-[#02280C] hover:bg-[#02280C]/5"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <span
                    key={item.label}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-[#1D2B22]/40 cursor-not-allowed flex items-center gap-1"
                    title={t("common.comingSoonAria")}
                    aria-disabled="true"
                  >
                    {item.label}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1D2B22]/5 text-[#1D2B22]/50 font-normal">
                      {t("common.comingSoon")}
                    </span>
                  </span>
                )
              )}
            </nav>

            {/* Language Selector */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSelector />
              <Link
                to="/recommend"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#126A08] text-white text-sm font-bold shadow-sm hover:bg-[#02280C] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#126A08]"
              >
                <Sprout className="w-4 h-4" />
                <span>{t("home.ctaButton")}</span>
              </Link>
            </div>

            {/* Mobile Actions: Language + Menu */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageSelector />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-[#02280C] hover:bg-[#02280C]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#126A08]"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#02280C]/10 bg-white px-4 pt-2 pb-6 space-y-1 shadow-lg">
            {navItems.map((item) =>
              item.available ? (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                      isActive
                        ? "bg-[#126A08]/10 text-[#02280C]"
                        : "text-[#1D2B22]/80 hover:text-[#02280C] hover:bg-[#02280C]/5"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ) : (
                <div
                  key={item.label}
                  className="px-3 py-2.5 text-base font-medium text-[#1D2B22]/40 flex items-center justify-between"
                  aria-disabled="true"
                >
                  <span>{item.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#1D2B22]/5 text-[#1D2B22]/50">
                    {t("common.comingSoon")}
                  </span>
                </div>
              )
            )}
            <div className="pt-4">
              <Link
                to="/recommend"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#126A08] text-white font-bold text-center shadow hover:bg-[#02280C] transition-colors"
              >
                <Sprout className="w-5 h-5" />
                <span>{t("home.ctaButton")}</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#02280C]/10 bg-white/60 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#1D2B22]/70 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <img src="/logo-icon.svg" alt="" className="w-5 h-5" width="20" height="20" />
              <span className="font-bold text-[#02280C]">KrishiSetu AI</span>
              <span>— {t("common.tagline")}</span>
            </div>
            <p>© 2026 KrishiSetu AI. Built for Indian Farmers.</p>
          </div>
          <p className="text-[11px] text-[#1D2B22]/60 text-center max-w-3xl mx-auto leading-relaxed">
            {t("common.safetyDisclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
};
