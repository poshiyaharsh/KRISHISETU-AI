"""
Production settings for KrishiSetu AI backend.
"""

import sys
from django.core.exceptions import ImproperlyConfigured
from .base import *  # noqa: F403

DEBUG = False

# In production, SECRET_KEY must be provided via environment; no default allowed.
SECRET_KEY = env("SECRET_KEY")  # noqa: F405

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")  # noqa: F405
CSRF_TRUSTED_ORIGINS = env.list(  # noqa: F405
    "CSRF_TRUSTED_ORIGINS",
    default=[
        "https://*.vercel.app",
        "https://krishisetu.vercel.app",
        "https://krishisetu-ai-gamma.vercel.app",
    ],
)
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])  # noqa: F405
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
]

# PostgreSQL connection tuning & SSL enforcement in production
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=600)  # noqa: F405
DB_SSL_REQUIRE = env.bool("DB_SSL_REQUIRE", default=True)  # noqa: F405
if DB_SSL_REQUIRE and "postgresql" in DATABASES["default"].get("ENGINE", ""):  # noqa: F405
    DATABASES["default"].setdefault("OPTIONS", {})["sslmode"] = "require"  # noqa: F405

# Production Security
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)  # noqa: F405
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Optional Sentry Error Tracking (never logs PII)
SENTRY_DSN = env("SENTRY_DSN", default="")  # noqa: F405
if SENTRY_DSN:
    try:
        import sentry_sdk

        sentry_sdk.init(dsn=SENTRY_DSN, send_default_pii=False, traces_sample_rate=0.1)
    except ImportError:
        pass

# Production safety: validate email delivery backend configuration at runtime.
# Skip during build-time commands (collectstatic) or when using the Docker build placeholder key.
_is_build = (
    SECRET_KEY == "build-only-placeholder-key-not-used-at-runtime-0123456789"
    or any(cmd in sys.argv for cmd in ("collectstatic",))
)
if not _is_build:
    _insecure_backends = ("console", "locmem", "filebased", "dummy")
    if any(b in EMAIL_BACKEND.lower() for b in _insecure_backends):  # noqa: F405
        raise ImproperlyConfigured(
            f"EMAIL_BACKEND in production cannot be a non-delivering backend ({EMAIL_BACKEND}). "  # noqa: F405
            "Configure transactional email provider (EMAIL_PROVIDER=brevo or resend) or standard SMTP."
        )

    if EMAIL_PROVIDER == "brevo" and not BREVO_API_KEY:  # noqa: F405
        raise ImproperlyConfigured(
            "BREVO_API_KEY must be set in production when EMAIL_PROVIDER=brevo."
        )
    elif EMAIL_PROVIDER == "resend" and not RESEND_API_KEY:  # noqa: F405
        raise ImproperlyConfigured(
            "RESEND_API_KEY must be set in production when EMAIL_PROVIDER=resend."
        )
    elif EMAIL_PROVIDER == "smtp" or "smtp" in EMAIL_BACKEND.lower():  # noqa: F405
        if not EMAIL_HOST:  # noqa: F405
            raise ImproperlyConfigured("EMAIL_HOST must be set in production.")
        if not EMAIL_HOST_USER:  # noqa: F405
            raise ImproperlyConfigured("EMAIL_HOST_USER must be set in production.")
        if not EMAIL_HOST_PASSWORD:  # noqa: F405
            raise ImproperlyConfigured("EMAIL_HOST_PASSWORD must be set in production.")
