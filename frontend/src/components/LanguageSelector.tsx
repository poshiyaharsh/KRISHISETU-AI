import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, Search, X } from "lucide-react";
import { LANGUAGES, getLanguageInfo } from "@/i18n/languages";

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLangCode = i18n.resolvedLanguage || i18n.language || "en";
  const currentInfo = getLanguageInfo(currentLangCode);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const allLanguages = Object.values(LANGUAGES);
  const filtered = allLanguages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const readyLanguages = filtered.filter((l) => l.tier === 1);
  const betaLanguages = filtered.filter((l) => l.tier > 1);

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Language selector: Currently ${currentInfo.nativeName} (${currentInfo.name})`}
        className="min-h-[44px] sm:min-h-[40px] px-3 py-2 rounded-xl border border-[#02280C]/20 bg-white hover:bg-[#02280C]/5 text-[#02280C] text-sm font-semibold flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#126A08]"
      >
        <Globe className="w-4 h-4 text-[#126A08]" />
        <span className="font-bold">{currentInfo.nativeName}</span>
        <span className="text-xs text-[#1D2B22]/60 hidden lg:inline-block font-normal">
          ({currentInfo.name})
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available languages"
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-[#02280C]/15 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] flex flex-col"
        >
          {/* Search box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#1D2B22]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search / શોધો / खोजें..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#02280C]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#126A08] bg-slate-50"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-2.5 text-[#1D2B22]/40 hover:text-[#02280C]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Ready (Tier 1) */}
            {readyLanguages.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#126A08] uppercase tracking-wider px-2">
                  Verified & Ready
                </div>
                {readyLanguages.map((l) => {
                  const isSelected = l.code === currentLangCode;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectLanguage(l.code)}
                      className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? "bg-[#126A08]/10 text-[#02280C] font-bold"
                          : "hover:bg-[#02280C]/5 text-[#1D2B22]"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-base leading-snug">{l.nativeName}</span>
                        <span className="text-xs text-[#1D2B22]/60 font-normal">
                          {l.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#126A08]" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Beta (Tier 2/3) */}
            {betaLanguages.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-[#02280C]/10">
                <div className="text-[11px] font-bold text-[#1D2B22]/50 uppercase tracking-wider px-2 flex items-center justify-between">
                  <span>Additional Indic Languages</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                    Beta
                  </span>
                </div>
                {betaLanguages.map((l) => {
                  const isSelected = l.code === currentLangCode;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectLanguage(l.code)}
                      className={`w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? "bg-[#126A08]/10 text-[#02280C] font-bold"
                          : "hover:bg-[#02280C]/5 text-[#1D2B22]"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{l.nativeName}</span>
                        <span className="text-xs text-[#1D2B22]/50 font-normal">
                          {l.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#126A08]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
