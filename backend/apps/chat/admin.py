from django.contrib import admin
from .models import ChatFeedback, ChatMessage, ChatSession, KnowledgeChunk


@admin.register(KnowledgeChunk)
class KnowledgeChunkAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "source_type",
        "source_id",
        "chunk_index",
        "language",
        "updated_at",
    )
    list_filter = ("source_type", "language")
    search_fields = ("title", "text", "source_id")
    readonly_fields = ("content_hash", "created_at", "updated_at")


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ("session_id", "language", "created_at", "updated_at")
    list_filter = ("language",)
    search_fields = ("session_id",)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("session", "role", "language", "created_at")
    list_filter = ("role", "language")
    search_fields = ("content",)


@admin.register(ChatFeedback)
class ChatFeedbackAdmin(admin.ModelAdmin):
    list_display = ("rating", "session_id", "created_at")
    list_filter = ("rating",)
    search_fields = ("session_id", "feedback_text")
