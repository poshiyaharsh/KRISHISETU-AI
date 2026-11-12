# Changelog

All notable changes to **KrishiSetu AI** are documented in this file.

## [1.0.0] - 2026-11-12

### Added
- **Brand & Design System:** Custom KrishiSetu AI vector logo, favicon/PWA icons, `KrishiLoader`, WCAG AA-audited color tokens (`tokens.css` / `tokens.ts`).
- **ML Crop Recommendation Engine (`ml/krishisetu_ml`):** Random Forest classifier trained on 2,200 rows across 22 crops (`99.49% ± 0.52%` 5-fold CV Macro-F1; `99.55%` holdout accuracy) returning top-3 crops with confidence and suitability ratings.
- **Backend API (`backend/`):** Django 5 + DRF REST API with OpenAPI 3.0 / Swagger UI (`/api/docs/`), standardized error codes, and endpoint throttling.
- **Multilingual Frontend (`frontend/`):** React 18 + TypeScript + Vite + Tailwind CSS UI supporting 23 Indian languages (`en`, `hi`, `gu` Ready; 20 Beta) with self-hosted `@fontsource` Indic fonts and RTL support (`ur`, `ks`, `sd`).
- **Hyperlocal Weather Module:** LGD-based 31 States/UTs and 61 districts directory + Open-Meteo 7-day forecast with agronomic alerts and stale-cache fallback.
- **Government Schemes Directory:** 12 verified Central & State agricultural schemes with multi-criteria filtering, search, and live-checked official portal links.
- **Crop Nutrition Explorer:** 31 USDA FoodData Central SR Legacy per-100g nutrition entries covering all 22 supported crops, plus side-by-side comparison.
- **Krishi Mitra AI Chatbot:** RAG assistant grounded in 70 verified knowledge chunks with SSE streaming, Gemini 2.5 Flash + graceful grounded fallback, and red-team-tested agricultural safety guardrails.
- **Quality, Security & Deployment:** 92% backend test coverage, Playwright E2E + Axe accessibility audits, PWA offline fallback, Dockerfiles, and live deployment on Neon PostgreSQL, Render, and Vercel.
