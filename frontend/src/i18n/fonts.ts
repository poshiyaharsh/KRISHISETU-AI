import { getLanguageInfo } from "./languages";

const loadedScripts = new Set<string>();

/**
 * Dynamically loads the corresponding self-hosted @fontsource font for a given language.
 * Updates document.documentElement lang, dir and font family accordingly.
 */
export async function applyLanguageAndFont(langCode: string): Promise<void> {
  const info = getLanguageInfo(langCode);

  // Update HTML document attributes for accessibility & RTL
  if (typeof document !== "undefined") {
    document.documentElement.lang = info.code;
    document.documentElement.dir = info.dir;
    document.body.style.fontFamily = info.fontFamily;
  }

  const script = info.script;
  if (loadedScripts.has(script)) {
    return;
  }

  loadedScripts.add(script);

  try {
    switch (script) {
      case "latin":
        await Promise.all([
          import("@fontsource/noto-sans/400.css"),
          import("@fontsource/noto-sans/700.css"),
        ]);
        break;
      case "devanagari":
        await Promise.all([
          import("@fontsource/noto-sans-devanagari/400.css"),
          import("@fontsource/noto-sans-devanagari/700.css"),
        ]);
        break;
      case "gujarati":
        await Promise.all([
          import("@fontsource/noto-sans-gujarati/400.css"),
          import("@fontsource/noto-sans-gujarati/700.css"),
        ]);
        break;
      case "arabic":
        await Promise.all([
          import("@fontsource/noto-naskh-arabic/400.css"),
          import("@fontsource/noto-naskh-arabic/700.css"),
        ]);
        break;
      case "bengali":
        await Promise.all([
          import("@fontsource/noto-sans-bengali/400.css"),
          import("@fontsource/noto-sans-bengali/700.css"),
        ]);
        break;
      case "tamil":
        await Promise.all([
          import("@fontsource/noto-sans-tamil/400.css"),
          import("@fontsource/noto-sans-tamil/700.css"),
        ]);
        break;
      case "telugu":
        await Promise.all([
          import("@fontsource/noto-sans-telugu/400.css"),
          import("@fontsource/noto-sans-telugu/700.css"),
        ]);
        break;
      case "kannada":
        await Promise.all([
          import("@fontsource/noto-sans-kannada/400.css"),
          import("@fontsource/noto-sans-kannada/700.css"),
        ]);
        break;
      case "malayalam":
        await Promise.all([
          import("@fontsource/noto-sans-malayalam/400.css"),
          import("@fontsource/noto-sans-malayalam/700.css"),
        ]);
        break;
      case "gurmukhi":
        await Promise.all([
          import("@fontsource/noto-sans-gurmukhi/400.css"),
          import("@fontsource/noto-sans-gurmukhi/700.css"),
        ]);
        break;
      case "oriya":
        await Promise.all([
          import("@fontsource/noto-sans-oriya/400.css"),
          import("@fontsource/noto-sans-oriya/700.css"),
        ]);
        break;
      default:
        break;
    }
  } catch (err) {
    console.warn(`Could not load font for script: ${script}`, err);
  }
}
