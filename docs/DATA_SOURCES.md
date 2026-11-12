# Data Sources & Attributions

Every dataset and external service used in KrishiSetu AI is documented below with its exact license, provenance, and verification status.

| Dataset / Service | Provider / Author | License | Usage in KrishiSetu AI | Verified Date |
|---|---|---|---|---|
| **Crop Recommendation Dataset** | Atharva Ingle (Kaggle) | Apache-2.0 | 2,200 rows across 22 crops (N, P, K, temperature, humidity, pH, rainfall) for CRS ML training (`ml/data/`) | 2026-11-09 |
| **Weather Forecast API** | [Open-Meteo](https://open-meteo.com/) | CC BY 4.0 (Non-commercial free tier) | Live 7-day meteorological forecast, precipitation, ET0, and wind data (`apps/weather`) | 2026-11-09 |
| **Crop Nutrition Profiles** | [USDA FoodData Central](https://fdc.nal.usda.gov/) (SR Legacy) | Public Domain (CC0 1.0) | 31 per-100g nutritional entries covering 20 food crops + 2 non-food crop flags (`apps/nutrition`) | 2026-11-09 |
| **States & Districts Catalog** | Local Government Directory (LGD 2026) | Open Government Data (India) | 31 States/UTs and 61 districts with coordinates (`apps/locations`) | 2026-11-09 |
| **Government Agricultural Schemes** | Official Central & State Portals (`pmkisan.gov.in`, `agriwelfare.gov.in`, `mnre.gov.in`, etc.) | Public Government Information | 12 curated schemes with benefits, eligibility, and HTTP 200 verified official URLs (`apps/schemes`) | 2026-11-09 |
| **Kisan Call Centre Helpline** | Ministry of Agriculture & Farmers Welfare, Govt. of India | Public Service | Toll-free helpline `1800-180-1551` cited in safety advisories and Krishi Mitra refusals | 2026-11-09 |

## Detailed Reports
- Crop dataset audit: [ml/reports/data_audit.md](./ml/reports/data_audit.md)
- Nutrition food mapping: [docs/data/nutrition_mapping.md](./data/nutrition_mapping.md)
- Schemes report & link verification: [docs/data/schemes_report.md](./data/schemes_report.md) & [docs/data/scheme_link_report.md](./data/scheme_link_report.md)
