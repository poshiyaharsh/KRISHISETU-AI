# LinkedIn Launch Post Draft (v1.0.0)

I just launched **KrishiSetu AI (v1.0)** — an open, multilingual agricultural decision-support web app built for Indian farmers.

**Live App:** https://krishisetu-ai-sooty.vercel.app  
**GitHub:** https://github.com/poshiyaharsh/KRISHISETU-AI

### Why I built it
Too many agri-tech tools are English-only, scattered across disconnected portals, or give unverified AI advice. KrishiSetu AI brings five core workflows into one mobile-first PWA:

1. **ML Crop Recommendation (CRS):** Recommends top 3 crops from 7 soil & climate inputs (N, P, K, temperature, humidity, pH, rainfall), trained on 2,200 balanced rows across 22 supported crops (`99.49% ± 0.52%` 5-fold CV Macro-F1).
2. **Hyperlocal 7-Day Weather:** Covers 31 Indian States/UTs and 61 districts (plus device geolocation) powered by Open-Meteo with agronomic alerts.
3. **Government Schemes Directory:** 12 verified Central & State agricultural schemes linking directly to official government portals.
4. **Crop Nutrition Explorer:** 31 per-100g nutritional profiles sourced from USDA FoodData Central SR Legacy.
5. **Krishi Mitra AI Advisor:** Grounded RAG chatbot over 70 verified knowledge chunks with strict safety guardrails (refuses medical/off-topic prompts and refers pesticide questions to local KVKs & Kisan Call Centre `1800-180-1551`).

### Honest scope & limits in v1.0
- The ML model currently covers **22 crops** from the public training dataset.
- **English, Hindi, and Gujarati** are native-reviewed; **20 additional Indian languages** have 100% UI key parity in **Beta** awaiting native review.
- It is a decision-support tool — never a replacement for local soil testing or a certified agronomist.

Built with **React 18 + TypeScript + Tailwind + i18next** (Vercel), **Django 5 + DRF + scikit-learn** (Render), and **Neon PostgreSQL**.

If you work in agriculture, agri-tech, or Indian-language software, I would love your honest feedback on clarity, translations, and what to prioritize next!

#AgriTech #IndianAgriculture #OpenSource #MachineLearning #Django #React #MultilingualAI
