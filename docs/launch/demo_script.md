# KrishiSetu AI — 2-Minute Demo Script

**Target Duration:** ~1 minute 50 seconds (under 2 minutes)  
**Viewport:** Mobile (`390x844`) or Desktop (`1280x720`)  
**Live URL:** https://krishisetu-ai-sooty.vercel.app

---

## [0:00 – 0:10] Hook (10 seconds)
- **Screen:** Home page (`/`).
- **Narration:** "Most agricultural apps lock soil science behind English-only forms. KrishiSetu AI brings crop recommendations, weather alerts, government schemes, and an AI advisor to Indian farmers in 23 Indian languages."

## [0:10 – 0:25] Farmer Problem (15 seconds)
- **Screen:** Scroll briefly through the Home workflow cards, then tap **Crop Recommendation** (`/recommend`).
- **Narration:** "A farmer needs three answers before sowing: which crop fits their soil and rainfall, what the next 7 days of weather look like, and which government schemes support them."

## [0:25 – 0:55] Flow 1: Crop Recommendation + Nutrition (30 seconds)
- **Screen:** On `/recommend`, tap **Load Sample** (or enter N=90, P=42, K=43, Temp=20.8°C, Humidity=82%, pH=6.5, Rainfall=202.9mm) and submit. Show top-3 result cards (`Rice` top match), then click **Nutrition** to show per-100g USDA FoodData Central values.
- **Narration:** "Entering 7 soil and weather parameters runs our Random Forest model trained across 22 supported crops, returning the top 3 matches with confidence scores and linked per-100g nutritional profiles."

## [0:55 – 1:15] Flow 2: Weather & Government Schemes (20 seconds)
- **Screen:** Open `/weather`, pick a State/District from the 31 States / 61 Districts catalog, show the 7-day forecast and agronomic alerts. Open `/schemes`, search `KISAN`, and point to the official portal link.
- **Narration:** "Next, farmers check 7-day Open-Meteo forecasts with spray and heat-stress advisories, and search 12 curated Central and State schemes linking straight to official government portals."

## [1:15 – 1:35] Flow 3: Krishi Mitra & Language Switch (20 seconds)
- **Screen:** Open `/chat`, switch language in the header to **Hindi (`हिन्दी`)** or **Gujarati (`ગુજરાતી`)**, ask `"What is PM-KISAN?"`, and show the grounded reply with source links and safety disclaimer.
- **Narration:** "In Krishi Mitra, switching the entire interface to Hindi or Gujarati takes one tap. Answers are grounded in verified scheme and crop data, with strict safety guardrails and Kisan Call Centre referrals."

## [1:35 – 1:50] Honest Limits & Call to Action (15 seconds)
- **Screen:** Open `/about` or `/privacy`.
- **Narration:** "v1.0 supports 22 crops, with English, Hindi, and Gujarati native-reviewed and 20 more languages in Beta. Try the live app at krishisetu-ai-sooty.vercel.app and share your feedback!"
