# KrishiSetu AI: Typography & Font Strategy

> **Design Principle:** Universal Indian accessibility. One cohesive visual hierarchy with full typographic coverage across English and all 22 Eighth-Schedule Indian languages.

---

## 1. Font Coverage Table (All 23 Scheduled Languages)

Every font package below has been verified against the official npm registry (`@fontsource` v5.3.0).

| # | Language | Script | Primary Font Family | Verified npm Package | Notes & Special Handling |
|---|---|---|---|---|---|
| 1 | **English** | Latin | Noto Sans | `@fontsource/noto-sans` | Default Latin UI font; weights 400, 500, 700, 800 |
| 2 | **Assamese** | Eastern Nagari (Bengali) | Noto Sans Bengali | `@fontsource/noto-sans-bengali` | Includes Assamese characters (ৰ, ৱ) |
| 3 | **Bengali** | Bengali | Noto Sans Bengali | `@fontsource/noto-sans-bengali` | Standard Indic line-height 1.7 |
| 4 | **Bodo** | Devanagari | Noto Sans Devanagari | `@fontsource/noto-sans-devanagari` | Official script since 1974 |
| 5 | **Dogri** | Devanagari | Noto Sans Devanagari | `@fontsource/noto-sans-devanagari` | Standard Devanagari |
| 6 | **Gujarati** | Gujarati | Noto Sans Gujarati | `@fontsource/noto-sans-gujarati` | Full support for conjuncts |
| 7 | **Hindi** | Devanagari | Noto Sans Devanagari | `@fontsource/noto-sans-devanagari` | Primary regional default |
| 8 | **Kannada** | Kannada | Noto Sans Kannada | `@fontsource/noto-sans-kannada` | Complex conjunct clustering |
| 9 | **Kashmiri** | Perso-Arabic | Noto Naskh Arabic | `@fontsource/noto-naskh-arabic` | **RTL layout**; Devanagari as alternate fallback |
| 10 | **Konkani** | Devanagari | Noto Sans Devanagari | `@fontsource/noto-sans-devanagari` | Devanagari standard |
| 11 | **Maithili** | Devanagari | Noto Sans Devanagari | `@fontsource/noto-sans-devanagari` | Standard Devanagari |
| 12 | **Malayalam** | Malayalam | Noto Sans Malayalam | `@fontsource/noto-sans-malayalam` | Deep ascender/descender clearance |
| 13 | **Manipuri** | Meetei Mayek | Noto Sans Meetei Mayek | `@fontsource/noto-sans-meetei-mayek` | Meetei Mayek script; Bengali script fallback |
| 14 | **Marathi** | Devanagari | Noto Sans Devanagari | `@fontsource/noto-sans-devanagari` | Full conjunct coverage |
| 15 | **Nepali** | Devanagari | Noto Sans Devanagari | `@fontsource/noto-sans-devanagari` | Standard Devanagari |
| 16 | **Odia** | Odia | Noto Sans Oriya | `@fontsource/noto-sans-oriya` | Rounded loop geometries |
| 17 | **Punjabi** | Gurmukhi | Noto Sans Gurmukhi | `@fontsource/noto-sans-gurmukhi` | Distinct headline bar |
| 18 | **Sanskrit** | Devanagari | Noto Sans Devanagari | `@fontsource/noto-sans-devanagari` | Full Vedic accent support |
| 19 | **Santali** | Ol Chiki | Noto Sans Ol Chiki | `@fontsource/noto-sans-ol-chiki` | Indigenous Ol Chiki alphabet |
| 20 | **Sindhi** | Perso-Arabic | Noto Naskh Arabic | `@fontsource/noto-naskh-arabic` | **RTL layout**; Devanagari as alternate fallback |
| 21 | **Tamil** | Tamil | Noto Sans Tamil | `@fontsource/noto-sans-tamil` | Modular glyph structure |
| 22 | **Telugu** | Telugu | Noto Sans Telugu | `@fontsource/noto-sans-telugu` | Complex diacritic stacking |
| 23 | **Urdu** | Perso-Arabic | Noto Naskh Arabic | `@fontsource/noto-naskh-arabic` | **RTL layout**; Naskh style for high screen legibility |

---

## 2. Loading Strategy & Performance Architecture

To keep the web application light and snappy for rural mobile connections (2G/3G/4G):

1. **Self-Hosted via Vite Assets:** Fonts are bundled directly from `@fontsource` packages; zero third-party tracking or Google Fonts CDN dependencies.
2. **Lazy Dynamic Loading:** Only the default Latin/Devanagari font is loaded on initial page view (~45 KB WOFF2). When a farmer switches languages, the app dynamically injects the appropriate `@fontsource` stylesheet.
3. **`font-display: swap`:** Text renders immediately using clean system fallbacks (`system-ui, -apple-system, sans-serif`) to eliminate Flash of Invisible Text (FOIT).
4. **Indic Typography Ergonomics:**
   - Base body text: `18px` (`1.125rem`) to guarantee clear glyph distinction for complex ligatures.
   - Line height: `1.7` (`--ks-leading-body`) to prevent overlapping Matras and vowel diacritics.
