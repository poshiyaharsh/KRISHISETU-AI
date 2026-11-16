# Environment Variable Matrix

All environment variables used across KrishiSetu AI. **Never commit real values to Git** — configure them in the Render / Vercel dashboard (or local `.env`).

| Variable | Service | Required | Example Format (Dummy) | Where to Obtain / Notes |
|---|---|---|---|---|
| `DJANGO_SETTINGS_MODULE` | Render | Yes | `config.settings.prod` | Fixed value for production (`config.settings.dev` locally) |
| `SECRET_KEY` | Render | Yes | `50+ random ASCII characters` | Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | Render | No (Prod=False) | `False` | Hardcoded `False` in `prod.py`; `True` only in local dev |
| `ALLOWED_HOSTS` | Render | Yes | `krishisetu-api.onrender.com` | Comma-separated hostnames from Render service URL |
| `DATABASE_URL` | Render | Yes | `postgresql://user:pass@ep-xyz.neon.tech/krishisetu?sslmode=require` | Neon Dashboard -> Connection Details (pooled or direct connection string) |
| `DB_CONN_MAX_AGE` | Render | No | `600` | Persistent DB connection lifetime in seconds (default `600`) |
| `DB_SSL_REQUIRE` | Render | No | `True` | Enforces `sslmode=require` on PostgreSQL (set `False` only for local Docker DB) |
| `CORS_ALLOWED_ORIGINS` | Render | Yes | `https://krishisetu.vercel.app` | Comma-separated Vercel production URL (no trailing slash) |
| `CSRF_TRUSTED_ORIGINS` | Render | Yes | `https://krishisetu.vercel.app` | Comma-separated Vercel production URL with `https://` scheme |
| `SECURE_SSL_REDIRECT` | Render | No | `True` | Default `True` in `prod.py` (`False` only in local Docker HTTP test) |
| `ADMIN_URL` | Render | No | `krishi-portal-ops/` | Custom non-`/admin/` Django admin path (must end with `/`) |
| `LOG_LEVEL` | Render | No | `INFO` | Python root logger level (`INFO`, `WARNING`, `ERROR`) |
| `MODEL_PATH` | Render | No | `/app/ml/models/crop_model.joblib` | Path to serialized CRS joblib artifact inside container |
| `LLM_PROVIDER` | Render | No | `gemini` | Chatbot provider (`gemini` or `mock`) |
| `LLM_MODEL` | Render | No | `gemini-2.0-flash` | Gemini model identifier |
| `GEMINI_API_KEY` | Render | Yes (for AI chat) | `AIzaSy...` | Google AI Studio (`aistudio.google.com`) |
| `EMBEDDING_PROVIDER` | Render | No | `gemini` | Embedding backend (`gemini` or `local`) |
| `EMBEDDING_MODEL` | Render | No | `text-embedding-004` | Gemini embedding model identifier |
| `CHAT_DAILY_LIMIT` | Render | No | `500` | Daily request ceiling before returning `chat_busy` |
| `CHAT_RATE_LIMIT` | Render | No | `10/min` | Scoped DRF rate limit per client IP |
| `SENTRY_DSN` | Render | No | `https://key@o0.ingest.sentry.io/0` | Optional Sentry project DSN (`send_default_pii=False`) |
| `EMAIL_BACKEND` | Render | Yes | `django.core.mail.backends.smtp.EmailBackend` | Production mail backend (`console` rejected in prod by `prod.py`) |
| `EMAIL_HOST` | Render | Yes (if SMTP) | `smtp.gmail.com` | Outbound mail server hostname |
| `EMAIL_PORT` | Render | Yes (if SMTP) | `587` | Port 587 (STARTTLS) or 465 (SSL) |
| `EMAIL_USE_TLS` | Render | No | `True` | Set `True` for port 587; `False` for port 465 |
| `EMAIL_USE_SSL` | Render | No | `False` | Set `True` for port 465; `False` for port 587 |
| `EMAIL_TIMEOUT` | Render | No | `10` | Socket timeout in seconds (default `10`) to prevent hanging requests |
| `EMAIL_HOST_USER` | Render | Yes (if SMTP) | `kisan.advisory@gmail.com` | Full mailbox username / email address |
| `EMAIL_HOST_PASSWORD` | Render | Yes (if SMTP) | `16-char-app-password` | Gmail 2-Step Verification App Password (no spaces) |
| `DEFAULT_FROM_EMAIL` | Render | Yes | `KrishiSetu AI <kisan.advisory@gmail.com>` | Sender display name and address |
| `ALLOW_CONSOLE_EMAIL` | Local | No (Dev only) | `1` | Enables console output of OTPs in local development (`DEBUG=True`) |
| `VITE_API_BASE_URL` | Vercel | Yes | `https://krishisetu-api.onrender.com/api` | Render backend public URL + `/api` suffix |
