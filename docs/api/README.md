# KrishiSetu AI — API Documentation

Interactive documentation is served by the backend at:
- **Swagger UI:** `/api/docs/`
- **OpenAPI 3.0 Schema (YAML):** [openapi.yaml](./openapi.yaml) (also served live at `/api/schema/`)

**Live Production Base URL:** `https://krishisetu-api-cu1y.onrender.com`  
**Local Development Base URL:** `http://127.0.0.1:8000`

---

## Endpoints Overview

| Method | Path | Purpose | Throttle |
|---|---|---|---|
| `GET` | `/api/health/` | Service health check | — |
| `POST` | `/api/crops/recommend/` | Top-3 ML crop recommendations | `30/min` |
| `GET` | `/api/crops/` | Active crop catalog | — |
| `GET` | `/api/crops/{key}/` | Detailed crop profile & ideal ranges | — |
| `GET` | `/api/crops/input-ranges/` | Soil/climate input bounds & steps | — |
| `GET` | `/api/crops/{key}/nutrition/` | Per-100g crop nutritional profile | `60/min` |
| `GET` | `/api/nutrition/crops/{key}/` | Alias for crop nutritional profile | `60/min` |
| `GET` | `/api/nutrition/compare/` | Compare 1–3 crops side by side | `60/min` |
| `GET` | `/api/locations/states/` | Supported Indian states & UTs | — |
| `GET` | `/api/locations/districts/` | Districts filtered by `state_id` | — |
| `GET` | `/api/locations/search/` | Search Indian towns & villages | — |
| `GET` | `/api/weather/` | 7-day forecast + agricultural alerts | — |
| `GET` | `/api/schemes/` | Paginated agricultural schemes | — |
| `GET` | `/api/schemes/{slug}/` | Scheme details, benefits & official URL | — |
| `GET` | `/api/schemes/facets/` | Scheme filter facets & counts | — |
| `POST` | `/api/chat/` | Krishi Mitra AI chat (SSE or JSON) | `10/min` + daily limit |
| `POST` | `/api/chat/feedback/` | Record farmer thumbs-up/down rating | — |

---

## Real Request & Response Examples

### 1. Health Check
```bash
curl -s https://krishisetu-api-cu1y.onrender.com/api/health/
```
```json
{
  "status": "ok",
  "service": "krishisetu-api",
  "version": "0.1.0",
  "time": "2026-11-12T12:23:00Z"
}
```

### 2. Crop Recommendation
```bash
curl -s -X POST https://krishisetu-api-cu1y.onrender.com/api/crops/recommend/ \
  -H "Content-Type: application/json" \
  -d '{"n":90,"p":42,"k":43,"temperature":20.8,"humidity":82.0,"ph":6.5,"rainfall":202.9}'
```
```json
{
  "results": [
    {
      "crop": {
        "key": "rice",
        "name": "Rice",
        "scientific_name": "Oryza sativa",
        "category": "cereal"
      },
      "confidence": 0.99,
      "suitability": "high"
    }
  ],
  "warnings": [],
  "advisory": "Recommendations are data-driven estimates. Consult your local Krishi Vigyan Kendra (KVK) before sowing."
}
```

### 3. Hyperlocal Weather Forecast
```bash
curl -s "https://krishisetu-api-cu1y.onrender.com/api/weather/?lat=23.0225&lon=72.5714"
```
Returns current conditions (`temperature_c`, `humidity_pct`, `wind_kph`, `condition`), 7-day forecast array, and agronomic alerts (heat stress, heavy rainfall, high wind spray advisory) sourced from Open-Meteo.

### 4. Government Schemes Search
```bash
curl -s "https://krishisetu-api-cu1y.onrender.com/api/schemes/?q=KISAN"
```
Returns paginated `results` with `slug`, `title`, `level` (`central`/`state`), `category`, `benefits_summary`, and verified `official_url`.

### 5. Krishi Mitra Chat (Synchronous JSON & SSE Streaming)
```bash
curl -s -X POST https://krishisetu-api-cu1y.onrender.com/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message":"What is PM-KISAN?","language":"en","stream":false}'
```
```json
{
  "session_id": "7223a85f-52f6-4409-8522-a7abb4dc0813",
  "message": "**Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)**...",
  "language": "en",
  "sources": [
    {
      "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "url": "https://pmkisan.gov.in/",
      "source_type": "scheme",
      "score": 0.1514
    }
  ]
}
```
Set `"stream": true` (default) to receive Server-Sent Events (`sources`, `token`, `done`, or `error`).

---

## Standardized Error Format
All 4xx/5xx API errors return JSON with a stable machine code:
```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input parameters.",
    "details": {}
  }
}
```
Common codes: `validation_error` (400), `not_found` (404), `rate_limited` / `chat_busy` (429), `model_unavailable` (503).
