# Production Data Bootstrap Guide

All bootstrap commands are **idempotent** (`update_or_create` / content-hash deduplicated) and safe to re-run without deleting or duplicating existing records.

---

## Execution Order

Run from `backend/` with `DJANGO_SETTINGS_MODULE=config.settings.prod` and `DATABASE_URL` configured:

```bash
# 1. Apply all database schema migrations
python manage.py migrate --noinput

# 2. Seed the 22 supported CRS crops and ideal agronomic ranges
python manage.py seed_crops

# 3. Seed LGD 2026 States/UTs (31) and major agricultural Districts (61)
python manage.py seed_locations

# 4. Load verified government agricultural schemes from data/schemes/schemes_clean.json
python manage.py load_schemes

# 5. Load USDA FoodData Central SR Legacy crop nutrition profiles
python manage.py load_nutrition

# 6. Build Krishi Mitra RAG knowledge base chunks & embeddings
python manage.py build_knowledge
```

---

## Re-run Verification

To verify idempotency on any environment, run commands `2`–`6` a second time; each command reports `0` duplicates created.
