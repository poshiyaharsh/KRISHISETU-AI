"""
Development settings for KrishiSetu AI backend.
"""

from .base import *

DEBUG = True

SECRET_KEY = env("SECRET_KEY", default="django-insecure-dev-local-secret-key-12345")

ALLOWED_HOSTS = ["*"]

# Enable Browsable API renderer in local dev
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append(
    "rest_framework.renderers.BrowsableAPIRenderer"
)

# CORS in dev allows localhost frontend
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://127.0.0.1:5173"],
)
