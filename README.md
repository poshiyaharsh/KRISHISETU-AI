# KrishiSetu AI (कृषिसेतु)

> **Smarter Farming. Better Decisions. Brighter Tomorrow.**

KrishiSetu AI is an open, multilingual AI agricultural advisory platform built for Indian farmers. It bridges data-driven agricultural science and localized field advisories through crop recommendation machine learning models, live weather analysis, government scheme discovery, and a conversational advisory assistant (*Krishi Mitra*).

---

## 🌾 Core Capabilities

- **Crop Recommendation System (CRS):** Data-driven crop recommendation engine analyzing soil nutrients (N, P, K), pH, temperature, humidity, and rainfall to provide top crop matches with confidence and environmental suitability metrics.
- **Krishi Mitra:** Conversational AI advisor answering regional farming, seasonal crop, and scheme queries with safety guidelines and domain accuracy.
- **Weather & Climate Intelligence:** Localized multi-day meteorological forecasts with actionable farming advice.
- **Government Schemes Directory:** Comprehensive, searchable directory linking farmers directly to verified central and state agricultural support schemes.
- **Multilingual Support:** Designed for seamless accessibility across Indian regional languages.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Recharts, i18next
- **Backend:** Python 3.11+, Django 5, Django REST Framework (DRF)
- **Database:** PostgreSQL (production), SQLite (local development)
- **Machine Learning:** scikit-learn, XGBoost, LightGBM, Joblib

---

## 📁 Repository Structure

```text
krishisetu-ai/
├── docs/                     # Documentation & brand assets
│   └── brand/                # Brand guidelines, palettes, design assets
├── frontend/                 # React + TypeScript client application
│   ├── public/               # SVGs, icons, favicons, webmanifest
│   └── src/
│       ├── components/       # UI components (Loader, Skeleton, etc.)
│       └── design/           # Design tokens, color palettes, CSS variables
├── backend/                  # Django REST API (planned / in progress)
├── ml/                       # ML models, training pipelines & evaluation (planned)
├── .gitignore                # Git ignore rules
└── README.md                 # Project documentation
```

---

## 🌿 Design Tokens & Palette

The KrishiSetu design system reflects natural agricultural harmony:

| Token | Hex | Role |
|---|---|---|
| **Paddy Green** | `#0F4A32` | Primary brand accent & headers |
| **Leaf Green** | `#3B8E4F` | Accent elements & indicators |
| **Sprout Green** | `#4FA35B` | Active highlights & growth indicators |
| **Wheat Gold** | `#D9A93F` | Secondary accent & badges |
| **Cream** | `#F5F0DC` | Primary background |
| **Mist** | `#E4ECDD` | Card & surface background |
| **Soil Dark** | `#1D2B22` | High-contrast typography |

---

## 🚀 Development Quickstart

### Prerequisites
- Node.js 18+ (tested on v24)
- Python 3.11+ (tested on v3.12)

### 1. Backend Setup (Django 5 + DRF)
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver
```
Backend API will be live at `http://localhost:8000/api/health/`.

### 2. Frontend Setup (React 18 + Vite + TS)
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will be live at `http://localhost:5173/`.

### 3. Running Checks & Tests
- **Frontend test:** `cd frontend && npm test`
- **Frontend lint & typecheck:** `cd frontend && npm run lint && npm run typecheck`
- **Backend check & test:** `cd backend && python manage.py check && pytest`

---

## 📜 Commit Conventions

This project strictly follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features or functional additions
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Formatting, styling, and aesthetic adjustments
- `refactor:` Code restructuring without functional alterations
- `chore:` Maintenance, repository setup, configuration, dependencies

---

## 📄 License

Personal Product Project - All rights reserved.
