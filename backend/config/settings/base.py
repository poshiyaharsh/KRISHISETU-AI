"""
Base settings for KrishiSetu AI backend.
All common configurations reside here.
"""

from pathlib import Path

import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR is backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent

# Initialize django-environ
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
)

# Read from root .env if it exists
env_file = ROOT_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(env_file)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env("SECRET_KEY", default="django-insecure-base-placeholder")

# Default DEBUG is off in base
DEBUG = env("DEBUG")

ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# Application definition
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
]

LOCAL_APPS = [
    "apps.core",
    "apps.crops",
    "apps.locations",
    "apps.weather",
    "apps.schemes",
    "apps.nutrition",
    "apps.chat",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "config.middleware.SecurityHeadersMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database
DATABASES = {
    "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR}/db.sqlite3")
}

# Caching configuration
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "krishisetu-cache",
    }
}

WEATHER_CACHE_TTL = 1800  # 30 minutes in seconds
WEATHER_REQUEST_TIMEOUT = 5  # 5 seconds

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
        )
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 12},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework settings
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "config.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "recommend": "30/min",
        "schemes": "60/min",
        "nutrition": "60/min",
        "chat": "10/min",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "KrishiSetu AI API",
    "DESCRIPTION": "Multilingual AI Agricultural Advisory Platform API for Indian Farmers",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# CORS configuration
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://127.0.0.1:5173"],
)

# ML Engine & Model configuration
MODEL_PATH = env(
    "MODEL_PATH", default=str(ROOT_DIR / "ml" / "models" / "crop_model.joblib")
)

# Confidence label thresholds for predictions
CROP_RECOMMENDATION_THRESHOLDS = {
    "STRONGLY_RECOMMENDED": 0.70,
    "RECOMMENDED": 0.35,
}

# Krishi Mitra Chatbot (Phase 9)
LLM_PROVIDER = env("LLM_PROVIDER", default="gemini")
LLM_MODEL = env("LLM_MODEL", default="gemini-2.0-flash")
GEMINI_API_KEY = env("GEMINI_API_KEY", default="")
EMBEDDING_PROVIDER = env("EMBEDDING_PROVIDER", default="gemini")
EMBEDDING_MODEL = env("EMBEDDING_MODEL", default="text-embedding-004")
CHAT_DAILY_LIMIT = env.int("CHAT_DAILY_LIMIT", default=500)
CHAT_RATE_LIMIT = env("CHAT_RATE_LIMIT", default="10/min")

# Admin & Upload Limits
ADMIN_URL = env("ADMIN_URL", default="krishi-portal-ops/")
DATA_UPLOAD_MAX_MEMORY_SIZE = 1048576  # 1 MB request size limit
FILE_UPLOAD_MAX_MEMORY_SIZE = 1048576

# Structured Logging with Request IDs (no PII or chat message content)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "request_id": {
            "()": "config.middleware.RequestIDFilter",
        },
    },
    "formatters": {
        "structured": {
            "format": "[{asctime}] {levelname} [req={request_id}] {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "filters": ["request_id"],
            "formatter": "structured",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": env("LOG_LEVEL", default="INFO"),
    },
}
