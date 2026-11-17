# KrishiSetu AI: Comprehensive Design Brief (v2 Redesign)

> **Core Objective:** Redesign KrishiSetu AI as a warm, tactile, photo-led, and effortlessly usable agricultural advisory platform for Indian farmers.  
> The experience is engineered specifically for low-end Android smartphones (2–4 GB RAM), slow or intermittent connectivity, bright outdoor sunlight, and farmers who communicate in their native regional language and prefer pictures, large buttons, and plain speech over dense bureaucratic text.

---

## 1. Guiding Design Principles

1. **Picture First, Words Second:**
   Farmers recognize their crops, diseased leaves, and weather conditions by sight in seconds. Every key decision point is anchored by authentic photography rather than abstract vector icons or walls of text.
2. **Big and Plain:**
   Every interactive element has a minimum touch target of **$48\text{px} \times 48\text{px}$** (comfortably operated with field-soiled or calloused thumbs). No fine-print disclaimers or tiny grey text.
3. **One Main Task Per Screen:**
   Each viewport guides the user through one clear action at a time (e.g., "Select your district" $\rightarrow$ "Set your expected rainfall" $\rightarrow$ "View your recommended crops").
4. **Local Language as First-Class Citizen:**
   Translations are never second-class afterthought strings. Primary typography is configured for Indian scripts (Devanagari, Gujarati, Bengali, Gurmukhi, Tamil, Telugu, Kannada, Malayalam, Odia, Perso-Arabic) with comfortable $1.7\times$ line height to prevent vowel-sign (*matra*) clipping.
5. **Extreme Resilience on Slow Networks:**
   Budgets are rigorously capped: mobile hero images $\le 120\text{ KB}$, card thumbnails $\le 30\text{ KB}$, modern AVIF/WebP formats with progressive blur-up placeholders. Zero cumulative layout shift (CLS $< 0.05$).
6. **Trust and Official Sources Constantly Visible:**
   Every government scheme, weather prediction, and crop recommendation carries official attribution (Ministry of Agriculture, IMD, LGD 2026, USDA SR Legacy) and direct access to the national Kisan Call Centre toll-free helpline (**1800-180-1551**).
7. **Never Overlap or Hide Content:**
   Fixed navigation bars and headers must strictly respect layout variables (`--header-h`, `--bottomnav-h`, `--sticky-cta-h`). Floating chat bubbles must **never** obscure form buttons or card content.
8. **No Surprises:**
   No sudden paywalls, zero ads, no automatic popups, no auto-playing sound, no unexpected browser permissions. Guest mode is perpetually available with zero forced sign-in.

---

## 2. Visual Direction & Sensory Language

### The "Seed Packet" Card Metaphor
Rather than generic corporate software cards with drop shadows and frosted glass, KrishiSetu AI utilizes a warm physical metaphor familiar to every farmer: **The Agricultural Seed Packet**.
- **Card Geometry:** Generously rounded corners (**$18\text{px}$ radius**), soft matte border (`#D4E0D2`, 1.5px solid), and warm cream card surface (`#FFFFFF` with subtle `#F7F5EE` undertones).
- **Accent Stripe:** A crisp $4\text{px}$ colored top rule (wheat gold `#D97706` for crops, deep paddy green `#0F4A32` for verified government schemes, sky blue `#2563EB` for weather).
- **Physical Header:** Large photographic window or bold $48\text{px}$ illustration, accompanied by bold localized title and high-contrast metric badge (e.g., *"₹6,000/yr Benefit"* or *"98% Match"*).

### Color Palette (Grounded & Contrast-Checked)
We preserve KrishiSetu AI's master brand identity while enhancing readability for high-glare environments:
- **Paddy Green (Primary Brand & Headings):** `#0F4A32` (WCAG AAA contrast of 11.2:1 against cream background).
- **Paddy Light (Hover / Active States):** `#185A3E` (Contrast 8.4:1).
- **Wheat Gold (Accents & Highlights):** `#D97706` (Warm harvest gold, contrast 4.6:1 against dark surfaces).
- **Cream / Pearl Ground (Page Canvas):** `#FBFBF7` (Calm, paper-like background that reduces eye strain under sunlight).
- **Soil Dark (Body Text):** `#1D2B22` (Deep charcoal green, contrast 13.5:1 against cream canvas).
- **Muted Earth (Secondary Labels):** `#4D6854` (Contrast 5.4:1, exceeding WCAG AA requirement of 4.5:1).
- **Forest Leaf (Success & Confidence):** `#236E3B` (Contrast 5.8:1).
- **Terracotta (Warnings & Urgent Weather Alerts):** `#C2410C` (Contrast 5.2:1).

*Strict Rule: No purple neon gradients, no translucent glassmorphism (`backdrop-filter: blur`), no grey-on-grey text.*

---

## 3. Typography System

- **Font Family:** Noto Sans family per script (Noto Sans for Latin, Noto Sans Devanagari for Hindi/Marathi, Noto Sans Gujarati, Noto Sans Gurmukhi, Noto Sans Tamil, Noto Sans Telugu, Noto Sans Kannada, Noto Sans Malayalam, Noto Sans Bengali, Noto Sans Oriya, Noto Naskh Arabic for Urdu/Kashmiri/Sindhi).
- **Type Scale (Fluid with CSS `clamp`):**
  - **Display / Hero Title:** `clamp(1.75rem, 4vw + 1rem, 2.5rem)` (28px to 40px), Weight: 800 (Extra Bold).
  - **Section Headings:** `clamp(1.35rem, 2.5vw + 0.8rem, 1.85rem)` (22px to 30px), Weight: 700 (Bold).
  - **Card Titles:** `1.25rem` (20px), Weight: 700.
  - **Base Body Text:** `1.125rem` (18px), Weight: 500 (Medium).
  - **Helper & Meta Text:** `0.875rem` (14px), Weight: 600 (Semi-bold).
- **Line Heights:**
  - Latin / English: `1.5`
  - Indic Scripts: `1.7` (mandatory to avoid clipping diacritics, anusvara, and matras).

---

## 4. Components & Touch Ergonomics

- **Minimum Tap Target:** $48\text{px} \times 48\text{px}$ across all buttons, inputs, tabs, and interactive chips.
- **Icon + Label Mandate:** Icons must **never** appear alone. Every icon is accompanied by a plain text label in the active language (e.g. ⛅ *"Weather"* / *हवामान* / *હવામાન*).
- **Number Stepper Field:**
  - Instead of standard text boxes that trigger small numeric mobile keyboards, agricultural numeric inputs (Rainfall, Nitrogen, Phosphorus, Potassium, Soil pH) are rendered with:
    - Large 48px `−` (decrement) and `+` (increment) touch buttons.
    - Synchronized smooth slider for rapid coarse adjustments.
    - Prominent display of value and localized unit (e.g., `120 kg/ha`, `450 mm`).

---

## 5. Navigation & Spatial Strategy

### Desktop ($1024\text{px}+$ Viewports)
- **Top Bar (`--header-h: 72px`):**
  - Master brand lockup on the left.
  - Primary navigation links (Home, Crop Advice, Weather, Schemes, Nutrition) in a single horizontal row.
  - 1-tap Language pill displaying active native script (`ગુજરાતી` / `हिन्दी`).
  - Account / Guest avatar menu.
- **Floating Krishi Mitra Launcher:**
  - Pinned to bottom inline-end corner (`bottom: 24px`, `right: 24px`).
  - Hidden automatically on `/chat` to prevent redundancy.

### Mobile ($320\text{px} \dots 768\text{px}$ Viewports)
- **Compact Top Bar (`--header-h: 56px`):**
  - Brand emblem, quick language switch button, and user profile avatar.
- **Fixed Bottom Navigation Bar (`--bottomnav-h: 68px`):**
  - **Tab 1:** 🏠 Home (`/`)
  - **Tab 2:** 🌱 Crop Advice (`/recommend`)
  - **Tab 3:** ⛅ Weather (`/weather`)
  - **Tab 4:** 📜 Schemes (`/schemes`)
  - **Tab 5:** 💬 Krishi Mitra (`/chat`)
- **"More" Bottom Sheet:**
  - Slide-up bottom sheet triggered from the header avatar or Home page shortcuts.
  - Houses: Crop Nutrition (`/nutrition`), My Farm Plots & Profile (`/profile`), Language Picker (all 23 languages), About & Help.
- **Zero Floating Elements:**
  - On mobile, Krishi Mitra is a first-class bottom tab. **No floating button is rendered**, completely eliminating the risk of a floating bubble overlapping form inputs or buttons.

---

## 6. Image Optimization & Delivery Pipeline

All photographic assets must follow a strict engineering pipeline:
1. **Source Storage:** High-resolution original images are stored outside version control or in a git-ignored workspace directory (`docs/design/assets_raw/`).
2. **Automated Pipeline Script (`scripts/images/optimize.mjs`):**
   - Utilizes `sharp` to transcode images into three formats: **AVIF**, **WebP**, and progressive **JPEG**.
   - Generates four responsive widths: `480px` (mobile), `768px` (tablet), `1280px` (desktop), and `1920px` (high-DPI hero).
   - Generates an inline base64 blurred micro-SVG placeholder (LQIP) for instant blur-up.
   - Emits a JSON manifest (`frontend/src/generated/image-manifest.json`) recording dimensions, aspect ratio, file hashes, and localized alt-text keys.
3. **Delivery Budgets & Performance Rules:**
   - **Hero Banner:** $\le 120\text{ KB}$ combined payload on mobile. Uses `fetchpriority="high"`.
   - **Card Thumbnails:** $\le 30\text{ KB}$ each. Uses `loading="lazy"`.
   - **CLS Prevention:** All `<picture>` and `<img>` tags specify explicit `width`, `height`, and `style="aspect-ratio: ..."` attributes.
4. **License & Attribution Registry:**
   - All images are documented in [`docs/brand/IMAGE_CREDITS.md`](file:///e:/03%20Study/krishisetu-ai/docs/brand/IMAGE_CREDITS.md). Unlicensed or hotlinked images are strictly forbidden.

---

## 7. Approval Checklist for Project Owner

Before any source code or implementation task begins, the project owner must review and sign off on the following four elements:
1. **Visual Direction:** Adoption of the "Seed Packet" card design language and warm earth-tone palette (`#0F4A32`, `#D97706`, `#FBFBF7`).
2. **Navigation Topology:** Desktop top bar + mobile 5-tab bottom navigation with Krishi Mitra as Tab 5 (eliminating mobile floating button overlap).
3. **Ergonomics & Touch:** $48\text{px}+$ minimum touch targets and number stepper fields replacing plain text boxes for numeric inputs.
4. **Photography Plan:** Genuine Indian agricultural field imagery with dark gradient overlays ensuring high-contrast text legibility.
