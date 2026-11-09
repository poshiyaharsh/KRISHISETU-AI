"""
URLs for locations: states, districts, and town search.
"""

from django.urls import path
from apps.locations.views import DistrictListView, LocationSearchView, StateListView

urlpatterns = [
    path("states/", StateListView.as_view(), name="location-states"),
    path("districts/", DistrictListView.as_view(), name="location-districts"),
    path("search/", LocationSearchView.as_view(), name="location-search"),
]
