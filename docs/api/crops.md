# Crops API Documentation

The Crops API connects the KrishiSetu AI frontend to the trained Crop Recommendation System (CRS) ML engine and factual agronomic catalog.

All API routes are served under `/api/crops/`.

---

## Interactive Documentation
- **Swagger UI**: `/api/docs/`
- **OpenAPI 3.0 Schema**: `/api/schema/`

---

## Standard Error Response Format
All 4xx and 5xx responses conform to a unified machine-readable JSON structure:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Please check the highlighted values.",
    "fields": {
      "ph": ["out_of_range"]
    }
  }
}
```

### Standard Error Codes
| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `validation_error` | One or more input parameters are missing or outside physical physiological limits. |
| `404` | `not_found` | The requested crop or resource was not found. |
| `429` | `throttled` | Request rate limit exceeded. |
| `500` | `server_error` | Unexpected internal server error. |
| `503` | `service_unavailable` | ML recommendation model artifact is unavailable or unbuilt. |

---

## Endpoints

### 1. Predict Crop Recommendation
- **URL**: `POST /api/crops/recommend/`
- **Rate Limit**: Scoped throttle: `30 requests/minute` (anonymous)
- **Description**: Evaluates soil N-P-K nutrient contents and atmospheric conditions against the trained multi-class Random Forest model (`crs-1.0.0`) to yield top-3 ranked crop recommendations with model confidence scores and agronomic suitability labels.

#### Request Body (JSON)
```json
{
  "nitrogen": 90.0,
  "phosphorus": 42.0,
  "potassium": 43.0,
  "temperature": 20.8,
  "humidity": 82.0,
  "ph": 6.5,
  "rainfall": 202.9
}
```

#### Response Body (JSON, 200 OK)
```json
{
  "request_id": "766a0149-a39c-4c4f-94ad-024845a7faec",
  "results": [
    {
      "rank": 1,
      "crop": {
        "key": "rice",
        "name": "Rice"
      },
      "score": 0.9215,
      "label": "strongly_recommended"
    },
    {
      "rank": 2,
      "crop": {
        "key": "jute",
        "name": "Jute"
      },
      "score": 0.0785,
      "label": "conditional"
    },
    {
      "rank": 3,
      "crop": {
        "key": "pomegranate",
        "name": "Pomegranate"
      },
      "score": 0.0,
      "label": "conditional"
    }
  ],
  "warnings": [],
  "model": {
    "version": "crs-1.0.0"
  }
}
```

#### Suitability Labels
- `strongly_recommended`: Score $\ge 0.70$
- `recommended`: $0.35 \le$ Score $< 0.70$
- `conditional`: Score $< 0.35$

#### Privacy & Audit Logging
Every recommendation is logged to the `PredictionRecord` table for diagnostic tracking. To protect farmer privacy, client IP addresses are **never** stored in plaintext; a salted SHA-256 hash (`client_hash`) is generated using the application `SECRET_KEY`.

---

### 2. Catalog Listing
- **URL**: `GET /api/crops/`
- **Description**: Returns all active crops in the advisory catalog.

#### Response Body (JSON, 200 OK)
```json
[
  {
    "key": "apple",
    "name": "Apple",
    "category": "fruit"
  },
  {
    "key": "rice",
    "name": "Rice",
    "category": "cereal"
  }
]
```

---

### 3. Crop Detail & Ideal Ranges
- **URL**: `GET /api/crops/{key}/`
- **Description**: Returns detailed agronomic profile and empirical ideal parameter ranges derived from training data.

#### Response Body (JSON, 200 OK)
```json
{
  "key": "rice",
  "name": "Rice",
  "category": "cereal",
  "description": "Kharif staple cereal thriving in warm, humid conditions with abundant water and clayey loams.",
  "ideal_ranges": {
    "nitrogen": { "min": 60.0, "max": 99.0, "mean": 79.89 },
    "phosphorus": { "min": 35.0, "max": 60.0, "mean": 47.58 },
    "potassium": { "min": 35.0, "max": 45.0, "mean": 39.87 },
    "temperature": { "min": 20.05, "max": 26.93, "mean": 23.69 },
    "humidity": { "min": 80.12, "max": 84.97, "mean": 82.27 },
    "ph": { "min": 5.01, "max": 7.87, "mean": 6.43 },
    "rainfall": { "min": 182.56, "max": 298.56, "mean": 236.18 }
  },
  "is_active": true
}
```

---

### 4. Input Parameter Ranges
- **URL**: `GET /api/crops/input-ranges/`
- **Description**: Single-source-of-truth providing training dataset ranges, absolute physical limits, units, and slider step increments for frontend form validation and rendering.

#### Response Body (JSON, 200 OK)
```json
{
  "nitrogen": {
    "min": 0.0,
    "max": 140.0,
    "absolute_min": 0.0,
    "absolute_max": 300.0,
    "unit": "kg/ha",
    "step": 1.0
  },
  "temperature": {
    "min": 8.8,
    "max": 43.7,
    "absolute_min": -10.0,
    "absolute_max": 60.0,
    "unit": "°C",
    "step": 0.1
  }
}
```
