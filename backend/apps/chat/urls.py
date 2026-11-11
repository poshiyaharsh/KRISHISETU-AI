"""
URL routing for Krishi Mitra chat and feedback endpoints.
"""

from django.urls import path
from .views import chat_feedback_view, chat_view

app_name = "chat"

urlpatterns = [
    path("", chat_view, name="chat"),
    path("feedback/", chat_feedback_view, name="feedback"),
]
