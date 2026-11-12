# Backend Deployment on Render

## 1. Prerequisites
1. GitHub repository pushed to `main`.
2. Neon PostgreSQL database created (copy the pooled/direct `postgresql://...?sslmode=require` connection string).

---

## 2. Create Web Service (Blueprint or Manual)
- **Option A (Blueprint):** In Render Dashboard -> **New + -> Blueprint**, select your GitHub repo (`render.yaml` is auto-detected).
- **Option B (Manual Web Service):**
  - **Runtime:** Docker
  - **Dockerfile Path:** `./backend/Dockerfile`
  - **Docker Context:** `.` (repository root, so `ml/` and `crop_model.joblib` are included)
  - **Instance Type:** Free (512 MB RAM)
  - **Health Check Path:** `/api/health/`
  - **Start Command (baked into Dockerfile):** `python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --worker-class gthread --workers 2 --threads 4 --timeout 120`

---

## 3. Environment Variables (Set in Render Dashboard)
Set all `sync: false` secrets from `docs/deploy/env.md`:
- `SECRET_KEY`: 50+ char random key
- `DATABASE_URL`: Neon `postgresql://...?sslmode=require`
- `ALLOWED_HOSTS`: `<your-service>.onrender.com`
- `CORS_ALLOWED_ORIGINS`: `https://<your-app>.vercel.app`
- `CSRF_TRUSTED_ORIGINS`: `https://<your-app>.vercel.app`
- `GEMINI_API_KEY`: Google AI Studio key
- `ADMIN_URL`: Custom secret admin path ending with `/` (e.g. `krishi-ops-9421/`)

---

## 4. Data Bootstrap (One-Off Shell / Job)
After the first deploy succeeds, open the Render **Shell** (or run locally against `DATABASE_URL`) and execute the idempotent bootstrap commands from `docs/deploy/bootstrap.md`:
```bash
cd /app/backend
python manage.py seed_crops
python manage.py seed_locations
python manage.py load_schemes
python manage.py load_nutrition
python manage.py build_knowledge
```

---

## 5. Cold Starts & Swagger Notes
- **Cold Starts:** Render Free tier spins down after **15 minutes** of inactivity; the first request after sleep takes **~45–60 seconds**.
- **Streaming:** Gunicorn uses `--worker-class gthread --workers 2 --threads 4 --timeout 120` so SSE streaming (`/api/chat/`) works reliably within 512 MB RAM.
- **API Docs:** OpenAPI schema (`/api/schema/`) and Swagger UI (`/api/docs/`) remain live for v1.0 transparency; no PII or secrets are exposed.
