from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

handler404 = "config.exceptions.custom_404_view"
handler500 = "config.exceptions.custom_500_view"

urlpatterns = [
    path(getattr(settings, "ADMIN_URL", "krishi-portal-ops/"), admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("api/", include("apps.accounts.urls")),
    path("api/crops/", include("apps.crops.urls")),
    path("api/locations/", include("apps.locations.urls")),
    path("api/weather/", include("apps.weather.urls")),
    path("api/schemes/", include("apps.schemes.urls")),
    path("api/nutrition/", include("apps.nutrition.urls")),
    path("api/chat/", include("apps.chat.urls")),
    # OpenAPI Schema and Swagger UI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
