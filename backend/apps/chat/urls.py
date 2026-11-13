"""
URL routing for Krishi Mitra chat, status, and feedback endpoints.
"""

from django.urls import path
from .views import chat_feedback_view, chat_status_view, chat_view

app_name = "chat"

urlpatterns = [
    path("", chat_view, name="chat"),
    path("status/", chat_status_view, name="status"),
    path("feedback/", chat_feedback_view, name="feedback"),
]
