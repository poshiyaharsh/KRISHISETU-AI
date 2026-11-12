# Test Coverage Report (Phase 10 — T10.1)

**Measured on:** 2026-11-12  
**Flakiness Verification:** Both backend (`pytest`) and frontend (`vitest`) suites ran 3 consecutive times with 0 failures and 0 flaky tests.

---

## 1. Backend & ML Coverage (`pytest --cov=backend/apps`)

- **Command:** `backend\.venv\Scripts\python.exe -m pytest backend/ ml/tests --cov=backend/apps --cov-report=term-missing`
- **Total Tests:** 98 passed (0 failed, 0 skipped)
- **Overall `backend/apps` Statement Coverage:** **92%** (2,635 statements, 222 missed)

| App / Module | Coverage | Notes |
|---|---|---|
| `apps.core` (health, urls, views) | 100% | Full endpoint and app coverage |
| `apps.crops` (serializers, views, seed) | 97%–100% | `services.py` at 76% (ML import fallback untested in normal env) |
| `apps.locations` (models, serializers, views, seed) | 92%–100% | LGD seeding, state/district filtering, village search |
| `apps.weather` (schemas, serializers, services, views) | 90%–100% | Open-Meteo parsing, LocMemCache, 6-hr stale backup |
| `apps.schemes` (models, serializers, views, loader) | 94%–100% | Idempotent loader, facets, search, pagination |
| `apps.nutrition` (models, serializers, views) | 96%–100% | USDA SR Legacy profiles, raw/cooked, compare API |
| `apps.chat` (safety, serializers, views, retrieval, language) | 85%–100% | `safety.py` 99%, `builder.py` 99%, `retrieval.py` 80%, `llm.py` 45% (live Gemini API client mocked offline) |

---

## 2. Frontend Coverage (`vitest --coverage`)

- **Command:** `npm --prefix frontend test -- --coverage`
- **Total Tests:** 72 passed across 17 test suites (0 failed, 0 skipped)
- **Overall Statement / Line Coverage:** **75%** (75.41% branch, 62.77% function)

| Directory / Core Module | Stmts | Branch | Funcs | Notes |
|---|---|---|---|---|
| `src/lib` (`api.ts`, `queryClient.ts`) | **92.24%** | 66.66% | 100% | Tested `apiGet`, `apiPost`, timeouts, network errors, non-JSON error parsing |
| `src/features/recommend` | **87.89%** | 86.36% | 90% | Form validation, Zod schema, sample inputs, API mapping, result cards |
| `src/i18n` (`languages.ts`, `index.ts`, `fonts.ts`) | **85.52%** | 47.82% | 75% | 23 locales verified with 100% key parity |
| `src/components/Header` | **85.03%** | 91.66% | 83.33% | Brand block, nav wrapping, active links, Escape/outside click close |
| `src/components/LanguageSelector.tsx` | **89.92%** | 72% | 62.5% | Native script rendering, search, RTL switching |
| `src/features/weather` (`WeatherCard`, `WeatherAlerts`, `LocationPicker`, `Forecast*`) | **78.29%** | 74.72% | 80% | `WeatherAlerts.tsx` 100%, `WeatherCard.tsx` 94.35%, `ForecastStrip.tsx` 93.54% |
| `src/layouts/MainLayout.tsx` | **100%** | 100% | 100% | App shell, skip link, footer |
| `src/pages/Home.tsx`, `NotFound.tsx` | **100%** | 100% | 100% | Landing & 404 pages |
| `src/pages/Nutrition.tsx`, `Weather.tsx`, `SchemeDetail.tsx` | **92%–97%** | 72%–83% | 36%–66% | Interactive filters, charts, tables |

---

## 3. Additions Made in T10.1
- `backend/apps/chat/tests/test_language.py`: Unit tests for Indic script detection (`hi`, `gu`), Latin transliteration (`Hinglish`, `Gujlish`), UI fallback, and language tier classification.
- `frontend/src/features/weather/WeatherAlerts.test.tsx`: Unit tests covering heavy rain, high wind, dry spell, and empty/mild weather alert rules (brought `WeatherAlerts.tsx` from 31.74% to 100%).
- `frontend/src/lib/api.test.ts`: Expanded tests for `apiPost`, non-JSON error fallback, and network/timeout error mapping (brought `src/lib` from 75.19% to 92.24%).
