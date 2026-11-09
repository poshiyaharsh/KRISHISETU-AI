export type Direction = "ltr" | "rtl";
export type LanguageTier = 1 | 2 | 3;

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  dir: Direction;
  tier: LanguageTier;
  fontFamily: string;
}

export const LANGUAGES: Record<string, LanguageInfo> = {
  // Tier 1: Ready & Reviewed
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    script: "latin",
    dir: "ltr",
    tier: 1,
    fontFamily: "'Noto Sans', sans-serif",
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "devanagari",
    dir: "ltr",
    tier: 1,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  gu: {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    script: "gujarati",
    dir: "ltr",
    tier: 1,
    fontFamily: "'Noto Sans Gujarati', sans-serif",
  },

  // Tier 2: Beta (Widely spoken regional languages)
  mr: {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    script: "devanagari",
    dir: "ltr",
    tier: 2,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  bn: {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "bengali",
    dir: "ltr",
    tier: 2,
    fontFamily: "'Noto Sans Bengali', sans-serif",
  },
  ta: {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "tamil",
    dir: "ltr",
    tier: 2,
    fontFamily: "'Noto Sans Tamil', sans-serif",
  },
  te: {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    script: "telugu",
    dir: "ltr",
    tier: 2,
    fontFamily: "'Noto Sans Telugu', sans-serif",
  },
  kn: {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    script: "kannada",
    dir: "ltr",
    tier: 2,
    fontFamily: "'Noto Sans Kannada', sans-serif",
  },
  ml: {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    script: "malayalam",
    dir: "ltr",
    tier: 2,
    fontFamily: "'Noto Sans Malayalam', sans-serif",
  },
  pa: {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    script: "gurmukhi",
    dir: "ltr",
    tier: 2,
    fontFamily: "'Noto Sans Gurmukhi', sans-serif",
  },
  or: {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    script: "oriya",
    dir: "ltr",
    tier: 2,
    fontFamily: "'Noto Sans Oriya', sans-serif",
  },
  ur: {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    script: "arabic",
    dir: "rtl",
    tier: 2,
    fontFamily: "'Noto Naskh Arabic', sans-serif",
  },

  // Tier 3: Beta (Additional scheduled languages)
  as: {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "bengali",
    dir: "ltr",
    tier: 3,
    fontFamily: "'Noto Sans Bengali', sans-serif",
  },
  brx: {
    code: "brx",
    name: "Bodo",
    nativeName: "बर'",
    script: "devanagari",
    dir: "ltr",
    tier: 3,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  doi: {
    code: "doi",
    name: "Dogri",
    nativeName: "डोगरी",
    script: "devanagari",
    dir: "ltr",
    tier: 3,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  kok: {
    code: "kok",
    name: "Konkani",
    nativeName: "कोंकणी",
    script: "devanagari",
    dir: "ltr",
    tier: 3,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  ks: {
    code: "ks",
    name: "Kashmiri",
    nativeName: "کٲشُر",
    script: "arabic",
    dir: "rtl",
    tier: 3,
    fontFamily: "'Noto Naskh Arabic', sans-serif",
  },
  mai: {
    code: "mai",
    name: "Maithili",
    nativeName: "मैथिली",
    script: "devanagari",
    dir: "ltr",
    tier: 3,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  mni: {
    code: "mni",
    name: "Manipuri",
    nativeName: "মৈতৈলোন্",
    script: "bengali",
    dir: "ltr",
    tier: 3,
    fontFamily: "'Noto Sans Bengali', sans-serif",
  },
  ne: {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "devanagari",
    dir: "ltr",
    tier: 3,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  sa: {
    code: "sa",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    script: "devanagari",
    dir: "ltr",
    tier: 3,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  sat: {
    code: "sat",
    name: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    script: "devanagari",
    dir: "ltr",
    tier: 3,
    fontFamily: "'Noto Sans Devanagari', sans-serif",
  },
  sd: {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي",
    script: "arabic",
    dir: "rtl",
    tier: 3,
    fontFamily: "'Noto Naskh Arabic', sans-serif",
  },
};

export const DEFAULT_LANGUAGE = "en";
export const STORAGE_KEY = "krishisetu_language";

export function getLanguageInfo(code: string): LanguageInfo {
  return LANGUAGES[code] || LANGUAGES[DEFAULT_LANGUAGE];
}
