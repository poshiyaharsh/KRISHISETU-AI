# KrishiSetu AI: Agricultural & Rural UX Research Report

> **Document Type:** Field UX Research & Competitive Pattern Audit  
> **Target Audience:** Indian smallholder farmers, rural women SHG members, agricultural students, and village extension officers.  
> **Device Context:** Entry-level Android smartphones (2–4 GB RAM), low-bandwidth (patchy 2G/3G/4G), outdoor sunlight viewing, preference for native scripts, audio, and visual imagery over dense text.

---

## 1. Verified Site & App Audit (12 Platforms Analyzed)

All sites were accessed, rendered, and evaluated at **360px (mobile viewport, Android device profile)** and **1280px (desktop viewport)**. Local reference captures are archived in `docs/design/research/_private/` (git-ignored).

| # | Platform | URL | Category | Status (HTTP) | Mobile Navigation (360px) | Desktop Navigation (1280px) | Language Switching | Imagery & Visual Style |
|---|----------|-----|----------|---------------|---------------------------|------------------------------|--------------------|------------------------|
| 1 | **eNAM** | `enam.gov.in/web/` | Govt Mandi Market | 200 OK | Complex hamburger drawer, cluttered top icons | Sticky mega-menu, running marquee ticker | Header dropdown (English, Hindi, 8 regional) | Cluttered banners, dense numerical tables, few photos |
| 2 | **Agmarknet** | `agmarknet.gov.in/` | Govt Price Portal | 200 OK | Non-responsive desktop view (pinch-to-zoom needed) | Multi-column HTML form tables | English / Hindi toggle | Zero photography; pure legacy HTML form tables |
| 3 | **IMD Mausam** | `mausam.imd.gov.in/` | National Weather | 200 OK | Icon cluster + nested accordion menus | Multi-tier navbar with radar/satellite submenu | English / Hindi header toggle | Complex radar maps, GIS plots, PDF links |
| 4 | **AgroStar** | `corporate.agrostar.in` | Agri-Tech Advisory & Commerce | 200 OK | Bottom tab navigation + large visual task tiles | Clean horizontal nav with CTA | Native script prompt on first launch (Hindi, Guj, Mar) | Authentic Indian field photography, crop diagnostics |
| 5 | **DeHaat** | `agrevolution.in` | Agri-Tech Value Chain | 200 OK | Sticky header with primary action, bottom tab flow | Modern full-width layout with sticky header | Regional language support in app | High-contrast farmer portraits, green/gold brand colors |
| 6 | **Plantix** | `plantix.net/en/` | Crop Disease AI | 200 OK | Floating camera FAB, 1-primary action flow | Product showcase with interactive crop health gallery | 18+ regional Indian languages | Macro disease photos, side-by-side symptom cards |
| 7 | **Digital Green** | `digitalgreen.org` | Rural Extension | 200 OK | Simple hamburger with high contrast links | Editorial storytelling top nav | Multilingual video audio tracks | Real farmer peer videos in authentic field conditions |
| 8 | **USDA Farmers.gov** | `farmers.gov` | Public Agri Advisory | 200 OK | USWDS mobile accordion menu, 48px tap targets | High-contrast top nav with utility search | English / Spanish header toggle | Large evocative field photos, high-contrast cards |
| 9 | **BigHaat** | `bighaat.com` | Rural Agri-Commerce | 200 OK | Sticky bottom nav (Home, Category, Orders, Help) | Multi-category mega navbar | Header selector with Indian flags/scripts | Crop category roundels with realistic crop images |
| 10 | **myScheme** | `myscheme.gov.in` | Citizen Schemes | 200 OK | Guided wizard flow, sticky bottom filter bar | Faceted search with categorical tags | 12 Indian languages in header | Clear green/gold status badges, high-contrast cards |
| 11 | **BHIM UPI** | `bhimupi.org.in` | Rural FinTech Benchmark | 200 OK | 3 prominent task tiles, zero clutter | Informational portal with security badges | Prominent 1-tap native script selector | Minimalist icons, big buttons, high color contrast |
| 12 | **DigiLocker** | `digilocker.gov.in` | Citizen Trust Benchmark | 200 OK | 4-tab bottom navigation, document card grid | Top bar with search and citizen dashboard | Native script menu (हिन्दी, ગુજરાતી, etc.) | Authority badges, colored top card rules |

---

## 2. Pattern Analysis: What Helps Low-Literacy & Low-Bandwidth Users

| Pattern | Observed On | Why It Helps Rural & Low-Bandwidth Users | Our Verdict | How KrishiSetu AI Implements It |
|---------|-------------|-------------------------------------------|-------------|----------------------------------|
| **Mobile Bottom Tab Bar (5 items max)** | BigHaat, DigiLocker, AgroStar | Thumb-friendly navigation on low-end Androids; never covers content when fixed variables are respected. | **ADOPT** | 5 primary tabs: Home, Crop Advice, Weather, Schemes, Krishi Mitra. A "More" sheet holds secondary pages. |
| **"Seed Packet" Physical Card Metaphor** | DigiLocker, myScheme, AgroStar | Tactile, familiar visual object with colored top stripe, large crop/feature icon, bold title, and key metric badge. | **ADOPT** | 18px rounded cards with 4px colored wheat/green accent top bar, 48px crop photography/icon, high-contrast text. |
| **Native Script Language Switcher** | DigiLocker, BHIM UPI, myScheme | Low-literacy users recognize their mother tongue written in its own script (e.g. *ગુજરાતી*, *हिन्दी*) rather than Latin ("Gujarati"). | **ADOPT** | Prominent 1-tap language pill in header and More sheet showing native script labels. |
| **Picture-Led Visual Crop Selectors** | Plantix, BigHaat, AgroStar | Farmers instantly recognize their crops (e.g., paddy tiller, cotton boll, bajra earhead) faster than reading text in bright sunlight. | **ADOPT** | Crop advice and nutrition forms use 64px realistic crop photography alongside localized names. |
| **Number Stepper Field (+ / - buttons + slider)** | BHIM UPI, FinTech forms | Typing numbers on soft Android keyboards is error-prone and tiny. Big touch buttons allow 1-tap increment/decrement. | **ADOPT** | Rainfall, temperature, N-P-K nutrient inputs use large 48px `+` / `-` steppers with synchronized tactile sliders. |
| **Official Trust Seals & Government Badges** | eNAM, myScheme, DigiLocker | Farmers are cautious about online scams; visible ministry attribution, toll-free Kisan Call Centre (1800-180-1551) builds trust. | **ADOPT** | Every scheme and weather card displays official source metadata, portal links, and emergency helpline chips. |
| **Aggressive Progressive Image Loading** | Plantix, USDA Farmers.gov | On 2G/3G connections, layout jumping causes mis-taps. Responsive images with fixed aspect ratios and blur placeholders prevent CLS. | **ADOPT** | AVIF/WebP art-directed pictures with aspect-ratio boxes and blur-up inline SVGs (max 120 KB hero, 30 KB cards). |
| **Dedicated Voice & Chat Assistant Placement** | AgroStar, BHIM UPI | Floating action buttons (FABs) often overlap sticky footers or form submit buttons on small 360px viewports. | **ADAPT** | Desktop uses bottom inline-end floating launcher; on mobile, Krishi Mitra is a dedicated bottom tab so no overlap ever occurs! |

---

## 3. Anti-Patterns Observed & Explicitly Avoided

During our audit of existing Indian portals, several severe UX obstacles were identified that alienate rural users:

1. **Tiny Grey Text & Low Contrast (e.g., Agmarknet, eNAM):**
   - *Problem:* 10px–12px `#777777` or light grey text is completely unreadable under direct Indian sunlight (40°C+ open field conditions).
   - *KrishiSetu Rule:* Base font size $\ge 18\text{px}$, high-contrast text tokens (`--ks-text-primary: #1D2B22`, `--ks-text-heading: #0F4A32`), strictly $\ge 4.5:1$ contrast against light surfaces.

2. **Overlapping Sticky Elements (e.g., eNAM, BigHaat mobile):**
   - *Problem:* A floating chat bubble overlaps the "Submit" or "Buy Now" button, trapping the user or causing accidental clicks.
   - *KrishiSetu Rule:* Dedicated layout CSS variables (`--header-h`, `--bottomnav-h`, `--sticky-cta-h`) with strict safe-area insets. On mobile, Krishi Mitra is a tab in the bottom bar, eliminating floating button overlap entirely.

3. **PDF Download Dead-Ends (e.g., IMD Mausam, Farmer Portal):**
   - *Problem:* Clicking an advisory forces a 4 MB PDF download, which fails on patchy 2G networks or gets lost in the phone's download folder.
   - *KrishiSetu Rule:* All agricultural weather warnings, scheme rules, and crop recommendations are rendered directly in fast, responsive HTML cards with offline service-worker caching.

4. **Deep Cascading Dropdowns (e.g., Agmarknet, Farmer Portal):**
   - *Problem:* Forcing 5 dependent dropdowns (State $\rightarrow$ District $\rightarrow$ Taluka $\rightarrow$ Market $\rightarrow$ Crop) with slow full-page postbacks.
   - *KrishiSetu Rule:* Smart location picker with geolocation 1-tap autofill, debounced search, and persistent local storage memory.

5. **Cluttered Banners & Running Marquees (e.g., eNAM, Government portals):**
   - *Problem:* Distracting moving text, unpausable auto-rotating carousels, and wall-to-wall banner ads overwhelm users with cognitive overload.
   - *KrishiSetu Rule:* Zero moving text tickers; zero auto-play carousels; one clear primary task per viewport with calming, photo-led visual hierarchy.
