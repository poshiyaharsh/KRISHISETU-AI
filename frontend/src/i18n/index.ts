import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import gu from "./locales/gu.json";
import { DEFAULT_LANGUAGE, STORAGE_KEY } from "./languages";
import { applyLanguageAndFont } from "./fonts";

// Statically include Tier 1 languages for instant load
const resources: Record<string, { translation: typeof en }> = {
  en: { translation: en },
  hi: { translation: hi },
  gu: { translation: gu },
};

// Custom backend loader for lazy-loading Tier 2/3 locales
const dynamicLocaleLoader = {
  type: "backend" as const,
  read: (
    language: string,
    _namespace: string,
    callback: (err: Error | null, data?: unknown) => void
  ) => {
    // If already in bundle, return it
    if (resources[language]) {
      callback(null, resources[language].translation);
      return;
    }

    // Dynamic import for other 20 languages
    import(`./locales/${language}.json`)
      .then((module) => {
        callback(null, module.default || module);
      })
      .catch((err) => {
        console.warn(`Could not load locale [${language}], falling back to English.`, err);
        callback(null, en);
      });
  },
};

const detector = new LanguageDetector();
detector.addDetector({
  name: "customQueryParam",
  lookup() {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const lang = params.get("lang");
      if (lang) return lang;
    }
    return undefined;
  },
});

i18n
  .use(dynamicLocaleLoader)
  .use(detector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [
      "en", "hi", "gu", "mr", "bn", "ta", "te", "kn", "ml", "pa", "or", "ur",
      "as", "brx", "doi", "kok", "ks", "mai", "mni", "ne", "sa", "sat", "sd"
    ],
    detection: {
      order: ["customQueryParam", "localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Apply document attributes (lang, dir) and font family on language change
i18n.on("languageChanged", (lng: string) => {
  applyLanguageAndFont(lng);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, lng);
  }
});

// Initialize on startup
applyLanguageAndFont(i18n.resolvedLanguage || DEFAULT_LANGUAGE);

export default i18n;
