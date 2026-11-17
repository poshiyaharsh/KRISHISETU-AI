# KrishiSetu AI: Target User Personas & Top Jobs

> **Purpose:** Anchor all architectural, visual, and interaction design decisions to the authentic reality of Indian agricultural users, varying in literacy, network access, and device hardware.

---

## 1. User Personas

### Persona 1: Ramesh Patel — Smallholder Farmer
- **Location:** Gondal Taluka, Rajkot District, Gujarat
- **Demographics:** 46 years old, smallholder farmer (3.5 acres under borewell irrigation)
- **Primary Language:** Gujarati (*ગુજરાતી*), understands basic spoken Hindi, zero English
- **Device & Connectivity:** Budget Android phone (Vivo Y15, 3 GB RAM, Android 11), often operated with dusty hands under bright midday sunlight. Patchy 4G connectivity with frequent drops to 2G/EDGE in the field.
- **Top Jobs:**
  1. *Choose the right crop:* Decide between cotton, groundnut, and sesamum based on soil tests and seasonal forecast.
  2. *Check rainfall:* Verify 48-hour rainfall probability before applying fertilizer or spraying.
- **Pain Points:** Small grey text is impossible to read in bright sun; complex keyboards frustrate him; intimidated by software that looks like a corporate bank app.
- **Design Choices That Serve Ramesh:**
  - **Native Gujarati Script:** Zero translation latency with primary headings in Gujarati.
  - **Seed-Packet Cards:** Bold visual crop photography so he recognizes cotton bolls and groundnuts instantly.
  - **48px+ Number Steppers:** `+` and `-` buttons for entering nitrogen and rainfall without opening a numeric keyboard.
  - **High-Contrast Palette:** Paddy green (`#0F4A32`) and wheat gold (`#D97706`) against clean cream (`#FBFBF7`) exceeding WCAG AAA contrast.

---

### Persona 2: Sunita Devi — Self-Help Group (SHG) Marginal Farmer
- **Location:** Campierganj, Gorakhpur District, Uttar Pradesh
- **Demographics:** 38 years old, marginal farmer (1.2 acres), leader of village women's SHG
- **Primary Language:** Hindi (*हिन्दी*), low textual literacy (reads basic signs and numerals), relies on voice and audio
- **Device & Connectivity:** Shared family smartphone (Redmi 9A, 2 GB RAM), storage nearly full, intermittent 3G/4G, data pack rationing (1 GB/day shared among 4 family members).
- **Top Jobs:**
  1. *Find government subsidies:* Look up financial assistance for solar pumps (PM-KUSUM) and goat rearing.
  2. *Check crop nutrition:* Understand dietary benefits of traditional millets (Bajra, Jowar) for her children and SHG micro-enterprise.
- **Pain Points:** Long bureaucratic paragraphs in formal English or high-register Sanskritized Hindi; fear of clicking the wrong button and losing phone balance.
- **Design Choices That Serve Sunita:**
  - **Picture-First Navigation:** Big visual task tiles with intuitive icons and photos rather than menus.
  - **Conversational Krishi Mitra:** Voice-friendly, low-bandwidth chatbot with local Hindi greeting chips ("नमस्ते", "मदद चाहिए").
  - **Aggressive Image Budgeting:** AVIF/WebP assets strictly under 30 KB per card to preserve her shared daily data pack.
  - **Bottom Navigation Bar:** Constant visible tabs at the bottom of the screen so she never gets lost in deep pages.

---

### Persona 3: Aniket Deshmukh — Agriculture College Student
- **Location:** Baramati / Pune, Maharashtra
- **Demographics:** 21 years old, final year B.Sc. (Hons) Agriculture student
- **Primary Language:** Bilingual — Marathi (*मराठी*) and English
- **Device & Connectivity:** Modern 5G smartphone (OnePlus Nord CE, 8 GB RAM) and shared laptop in the college library (1280px). High-speed Wi-Fi on campus, 4G in the field.
- **Top Jobs:**
  1. *Analyze scientific models:* Test Crop Recommendation System (CRS) probability distributions and compare model predictions against standard agronomy textbooks.
  2. *Nutritional comparison:* Compare macronutrient breakdowns (protein, dietary fiber, iron) across 3 staple crops for coursework.
- **Pain Points:** Lack of scientific provenance, non-standard units, black-box AI outputs without confidence metrics.
- **Design Choices That Serve Aniket:**
  - **Detailed Nutrition Graphs:** Recharts interactive radar and bar breakdowns per 100g edible portion.
  - **Confidence Tier Badges:** Clear qualitative categories (*Strongly Recommended $\ge 70\%$*, *Recommended*, *Conditional*).
  - **Verified Scientific Citations:** Direct metadata attribution to ICAR, USDA FoodData Central, and Local Government Directory (LGD 2026).

---

### Persona 4: Dr. Rajesh Sharma — Village Extension Officer (KVK Scientist)
- **Location:** Sehore / Bhopal, Madhya Pradesh
- **Demographics:** 52 years old, Subject Matter Specialist at Krishi Vigyan Kendra (KVK)
- **Primary Language:** Fluent in Hindi and English
- **Device & Connectivity:** Office desktop monitor (1280px $\times$ 800px, Chrome) during mornings, field tablet/phone during afternoon village visits.
- **Top Jobs:**
  1. *Advise visiting farmers:* Rapidly search Central and State government schemes to check eligibility criteria and print application steps for farmers.
  2. *Emergency disease guidance:* Verify safe, label-compliant pesticide advisories while enforcing statutory safety warnings.
- **Pain Points:** Unofficial or outdated scheme websites with 404 links; apps that provide risky, unverified chemical dosage calculations without proper warnings.
- **Design Choices That Serve Dr. Sharma:**
  - **Desktop Top Navigation:** Full-width layout with fast faceted search and instant category filtering.
  - **Official Scheme Portals CTA:** Outbound links directly to verified `.gov.in` and state portals (e.g., myScheme, iKhedut).
  - **Mandatory Safety Notices:** Prominent, non-dismissible statutory warning banners referencing the Kisan Call Centre (1800-180-1551) and CIB&RC standards.

---

## 2. Persona Job Mapping Matrix

| Platform Capability / Top Job | Ramesh Patel (Smallholder) | Sunita Devi (SHG Leader) | Aniket Deshmukh (Agri Student) | Dr. Rajesh Sharma (KVK Officer) | Core Design Feature Enforced |
|---|:---:|:---:|:---:|:---:|---|
| **Choose a Crop (CRS)** | **Primary** | Secondary | **Primary** | Secondary | Large photo tiles $\rightarrow$ Stepper sliders $\rightarrow$ Seed packet results cards |
| **Check Local Weather** | **Primary** | Secondary | Secondary | Secondary | 7-day strip, big condition icon, rain probability, agricultural spray advice |
| **Find Schemes & Subsidies** | Secondary | **Primary** | Tertiary | **Primary** | 3-step guided filter, official government seals, eligibility checklists |
| **Ask a Question (Krishi Mitra)** | Secondary | **Primary** | Secondary | **Primary** | Dedicated mobile bottom tab, instant greeting chips, safety referral |
| **Check Crop Nutrition** | Tertiary | **Primary** | **Primary** | Secondary | Single crop macro card, 3-crop side-by-side comparison, cooked/raw options |

---

## 3. Design Principles Derived from Personas

1. **Picture First, Words Second:** Every crop, scheme category, and major action must feature an authentic, recognizable photo or high-clarity icon.
2. **Big and Plain:** Touch targets $\ge 48\text{px}$, typography base $18\text{px}$, fluid headings up to $40\text{px}$. Zero tiny grey labels.
3. **One Main Task Per Screen:** Avoid multi-column distraction on mobile; guide the farmer through one decision at a time.
4. **Local Language as Primary Citizen:** The active language is not an afterthought; Indic fonts (Noto Sans scripts) are rendered at $1.7\times$ line height to prevent matra clipping.
5. **Extreme Network Resilience:** Hero pictures $\le 120\text{ KB}$, thumbnails $\le 30\text{ KB}$, instant local cache fallbacks for weather and previously generated recommendations.
6. **Zero Content Overlap:** Fixed bottom navigation and desktop top bar must never occlude input fields, action buttons, or disclaimers.
