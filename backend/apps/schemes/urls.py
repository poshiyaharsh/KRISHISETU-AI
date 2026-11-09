from django.urls import path
from apps.schemes.views import SchemeDetailView, SchemeFacetsView, SchemeListView

app_name = "schemes"

urlpatterns = [
    path("", SchemeListView.as_view(), name="scheme-list"),
    path("facets/", SchemeFacetsView.as_view(), name="scheme-facets"),
    path("<slug:slug>/", SchemeDetailView.as_view(), name="scheme-detail"),
]
