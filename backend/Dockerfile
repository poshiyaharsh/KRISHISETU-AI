# Multi-stage production build for KrishiSetu AI Backend (Django 5 + Gunicorn + ML)
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY ml /build/ml
COPY backend/requirements /build/backend/requirements

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /build/backend

# Install ML package (non-editable into /opt/venv) & production backend requirements
RUN pip install --upgrade pip \
    && grep -v "^-e \.\./ml" requirements/base.txt > /tmp/base.txt \
    && sed 's|-r base.txt|-r /tmp/base.txt|' requirements/prod.txt > /tmp/prod.txt \
    && pip install -r /tmp/prod.txt \
    && pip install /build/ml


FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    MODEL_PATH=/app/ml/models/crop_model.joblib

RUN apt-get update && apt-get install -y --no-install-recommends libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 appgroup \
    && useradd --uid 1001 --gid appgroup --shell /bin/false --create-home appuser

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY ml /app/ml
COPY backend /app/backend

WORKDIR /app/backend

# Collect static files for WhiteNoise at build time using dummy build key
RUN SECRET_KEY=build-only-placeholder-key-not-used-at-runtime-0123456789 \
    ALLOWED_HOSTS=localhost \
    python manage.py collectstatic --noinput

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/api/health/ || exit 1

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --worker-class gthread --workers 2 --threads 4 --timeout 120"]
