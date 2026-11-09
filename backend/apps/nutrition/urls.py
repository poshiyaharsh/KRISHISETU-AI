"""URL routing for Nutrition endpoints."""

from django.urls import path
from apps.nutrition.views import CropNutritionView, NutritionCompareView

urlpatterns = [
    path("compare/", NutritionCompareView.as_view(), name="nutrition-compare"),
    path("crops/<str:key>/", CropNutritionView.as_view(), name="nutrition-crop"),
]
