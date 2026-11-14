"""
URL routing for accounts, authentication, plots, and saved resources.
"""

from django.urls import path

from .views import (
    claim_history_view,
    logout_view,
    me_view,
    plot_detail_view,
    plots_list_create_view,
    predictions_history_view,
    profile_view,
    refresh_token_view,
    request_code_view,
    saved_scheme_delete_view,
    saved_schemes_list_create_view,
    verify_code_view,
)

urlpatterns = [
    # Auth Endpoints
    path("auth/request-code/", request_code_view, name="auth-request-code"),
    path("auth/verify-code/", verify_code_view, name="auth-verify-code"),
    path("auth/refresh/", refresh_token_view, name="auth-refresh"),
    path("auth/logout/", logout_view, name="auth-logout"),
    # Profile & Account Endpoints
    path("me/", me_view, name="me-detail"),
    path("me/profile/", profile_view, name="me-profile"),
    path("me/plots/", plots_list_create_view, name="me-plots-list-create"),
    path("me/plots/<int:pk>/", plot_detail_view, name="me-plot-detail"),
    path("me/saved-schemes/", saved_schemes_list_create_view, name="me-saved-schemes"),
    path(
        "me/saved-schemes/<slug:slug>/",
        saved_scheme_delete_view,
        name="me-saved-scheme-delete",
    ),
    path("me/predictions/", predictions_history_view, name="me-predictions"),
    path("me/claim-history/", claim_history_view, name="me-claim-history"),
]
