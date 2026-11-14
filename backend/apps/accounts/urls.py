"""
URL routing for accounts and authentication.
"""

from django.urls import path

from .views import (
    logout_view,
    me_view,
    refresh_token_view,
    request_code_view,
    verify_code_view,
)

urlpatterns = [
    path("auth/request-code/", request_code_view, name="auth-request-code"),
    path("auth/verify-code/", verify_code_view, name="auth-verify-code"),
    path("auth/refresh/", refresh_token_view, name="auth-refresh"),
    path("auth/logout/", logout_view, name="auth-logout"),
    path("me/", me_view, name="me-detail"),
]
