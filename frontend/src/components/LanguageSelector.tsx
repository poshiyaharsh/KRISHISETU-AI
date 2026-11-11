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
        aria-label={`Language selector: Currently ${currentInfo.nativeName}`}
        className="min-h-[44px] h-[44px] px-3 py-2 rounded-xl border border-mist bg-white hover:bg-mist/50 text-paddy text-base font-medium flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-paddy"
      >
        <Globe className="w-4 h-4 text-leaf shrink-0" aria-hidden="true" />
        <span className="whitespace-nowrap">{currentInfo.nativeName}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available languages"
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-mist shadow-md p-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] flex flex-col"
        >
          {/* Search box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-soil/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search / શોધો / खोजें..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-mist text-sm text-soil focus:outline-none focus:ring-2 focus:ring-paddy bg-cream/30"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-2.5 text-soil/40 hover:text-paddy"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Ready (Tier 1) */}
            {readyLanguages.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-paddy uppercase tracking-wider px-2">
                  Verified & Ready
                </div>
                {readyLanguages.map((l) => {
                  const isSelected = l.code === currentLangCode;
                  const showSecondary = l.name.toLowerCase() !== l.nativeName.toLowerCase();
                  return (
                    <button
                      key={l.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectLanguage(l.code)}
                      className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? "bg-mist/80 text-paddy font-bold"
                          : "hover:bg-mist/40 text-soil"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-base leading-snug">{l.nativeName}</span>
                        {showSecondary && (
                          <span className="text-xs text-soil/60 font-normal">
                            {l.name}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-leaf" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Beta (Tier 2/3) */}
            {betaLanguages.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-mist">
                <div className="text-[11px] font-bold text-soil/60 uppercase tracking-wider px-2 flex items-center justify-between">
                  <span>Additional Indic Languages</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-wheat/30 text-soil font-semibold">
                    Beta
                  </span>
                </div>
                {betaLanguages.map((l) => {
                  const isSelected = l.code === currentLangCode;
                  const showSecondary = l.name.toLowerCase() !== l.nativeName.toLowerCase();
                  return (
                    <button
                      key={l.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectLanguage(l.code)}
                      className={`w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? "bg-mist/80 text-paddy font-bold"
                          : "hover:bg-mist/40 text-soil"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{l.nativeName}</span>
                        {showSecondary && (
                          <span className="text-xs text-soil/60 font-normal">
                            {l.name}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-leaf" />}
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
