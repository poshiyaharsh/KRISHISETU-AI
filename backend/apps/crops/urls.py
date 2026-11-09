"""
URL configurations for Crop recommendation and catalog endpoints.
"""

from django.urls import path
from apps.crops.views import (
    CropDetailView,
    CropListView,
    CropRecommendationView,
    InputRangesView,
)

urlpatterns = [
    path("recommend/", CropRecommendationView.as_view(), name="crop-recommend"),
    path("input-ranges/", InputRangesView.as_view(), name="crop-input-ranges"),
    path("", CropListView.as_view(), name="crop-list"),
    path("<str:key>/", CropDetailView.as_view(), name="crop-detail"),
]
