# KrishiSetu AI: Brand Guidelines & Design System

> **Tagline:** Smarter Farming. Better Decisions. Brighter Tomorrow.  
> **Brand Purpose:** Delivering actionable, scientific, and localized agricultural intelligence to Indian farmers in their native languages.

---

## 1. Master Logo & Usage

The KrishiSetu AI master brand identity represents modern, connected agriculture:
- **The Stylized "K" Emblem:** Features a rising golden sun over furrowed fields with a working tractor, arched with a growth leaf on the left and connectivity arcs on the right (bridging physical farming with artificial intelligence).
- **Sprout Accent:** Two tender green leaves rising from the center wordmark symbolize new life and yield.
- **AI Badge:** Encased badge highlighting technological reliability and intelligent advisory.

### Clear Space & Sizing
- **Clear Space:** Maintain clear space around the logo equal to at least the height of the top green sprout leaf.
- **Minimum Digital Sizes:**
  - Full Wordmark Lockup: Minimum **120 px** wide on web/mobile screens.
  - Standalone Emblem Icon: Minimum **24 px** (favicon 32 px, app icon 192/512 px).
- **Master Files:**
  - Full Lockup: `frontend/public/logo.png`, `frontend/public/logo.svg`
  - Emblem Icon: `frontend/public/logo-icon.png`, `frontend/public/logo-icon.svg`
  - Web Favicons: `frontend/public/favicon.svg`, `favicon-32.png`, `favicon-192.png`, `favicon-512.png`
  - Mobile Touch Icon: `frontend/public/apple-touch-icon.png` (solid background)
  - Social / Open Graph: `frontend/public/og-image.png` (1200x630)

### Do's and Don'ts
- **DO** display the logo on solid white, clean cream (`#F8F9FA` / `#F5F0DC`), or deep forest green backgrounds.
- **DO** use the square emblem icon for avatars, app icons, and favicons.
- **DON'T** stretch, distort, or alter the proportions of the logo.
- **DON'T** change the colors, re-type the wordmark, or rearrange the logo elements.
- **DON'T** place the logo on busy, high-contrast photographic backgrounds without a clean card backing.

---

## 2. Color Palette & Functional Roles

| Token | Hex | Intended Role | WCAG Status |
|---|---|---|---|
| **Deep Forest** | `#02280C` | Wordmark primary, dark card background, high contrast headers | Passes AAA (15.2:1 on light) |
| **Soil** | `#1D2B22` | Body typography across all light surfaces | Passes AA (12.9:1 on cream) |
| **Paddy Green** | `#0F4A32` | Primary interactive buttons, links, major titles | Passes AA (8.98:1 on cream) |
| **Fresh Leaf** | `#93C810` | Accent badges, positive growth indicators, illustrations | Graphics only |
| **Harvest Sun / Gold** | `#FAC13E` | Highlights, rating badges, secondary accents | Graphics / Warning accents |
| **Mist Surface** | `#E4ECDD` | Card surfaces, container borders, skeleton backgrounds | Neutral background |
| **Success** | `#236E3B` | Positive yield status, verified notifications | Passes AA (5.46:1 on light) |
| **Warning** | `#8C5E06` | Weather alerts, nutrient deficiency cautions | Passes AA (4.94:1 on light) |
| **Danger** | `#B3402F` | Pest alerts, critical warnings | Passes AA (4.98:1 on light) |
| **Info** | `#2B6C8F` | Meteorological advisory, guidance notices | Passes AA (5.04:1 on light) |

---

## 3. Typography Hierarchy

- **Base Body Size:** `18px` (`1.125rem`) — optimized for outdoor sunlight reading on mobile screens.
- **Line Height:** `1.7` (`--ks-leading-body`) — essential for clear separation of Indian language Matras and conjuncts.
- **Scale:**
  - Heading 1: `38px` (`2.375rem`), Bold (`700`)
  - Heading 2: `30px` (`1.875rem`), Bold (`700`)
  - Heading 3: `24px` (`1.5rem`), Medium (`500`)
  - Body: `18px` (`1.125rem`), Regular (`400`)
  - Small / Caption: `16px` (`1rem`), Regular (`400`)

---

## 4. Spacing, Shapes & Elevation

- **Base Grid:** 4 px base (`0.25rem` increments).
- **Border Radius:**
  - Small (`6px`): Buttons, badges, input fields.
  - Medium (`10px`): Cards, modal dialogs.
  - Large (`18px`): Featured dashboard containers.
  - Pill (`999px`): Status tags, filter pills.
- **Elevation Shadows:** Green-tinted natural shadows (`rgba(15, 74, 50, 0.1)`), avoiding harsh neutral blacks.

---

## 5. Motion & Accessibility Standards

- **Motion Principles:**
  - Motion is purposeful, subtle, and used only during loading states or direct user interactions.
  - Always respect `prefers-reduced-motion: reduce`. Under reduced motion, all animations stop immediately and show static finished states.
- **Touch Targets:**
  - All interactive buttons, chips, and inputs MUST maintain a minimum touch target of **48 px by 48 px** for easy thumb operation in field conditions.
- **Focus Indicators:**
  - High-visibility focus ring: `3px solid #D9A93F` with `2px` offset.
- **Contrast Compliance:**
  - All text content maintains strict WCAG 2.1 AA contrast (minimum 4.5:1).

---

## 6. Voice, Tone & Sample Copy

### Voice & Tone Principles
1. **Sentence Case:** Use sentence case everywhere; avoid ALL CAPS headers.
2. **Direct, Plain Verbs:** Actionable and concise.
3. **No Unnecessary Apologies:** When errors occur, clearly state what happened and provide a 1-click action to resolve it.
4. **Agricultural Safety Note:** Any pest, chemical, or disease recommendation must include an advisory note to consult local agricultural extension officers.

### Sample UI Copy
1. **Form Submit Button:** "Find recommended crops"
2. **Status Banner:** "Weather forecast indicates rain in your district within 48 hours."
3. **Soil Input Guidance:** "Enter nitrogen, phosphorus, and potassium levels from your Soil Health Card."
4. **Chatbot Prompt:** "Ask Krishi Mitra about sowing seasons, market schemes, or crop nutrition."
5. **Connection Error State:** "Unable to connect to the weather service. Check your internet connection and try again."
6. **Safety Disclaimer:** "Advisory recommendations are based on soil and climate data. Always verify localized pesticide treatments with your local Krishi Vigyan Kendra."
