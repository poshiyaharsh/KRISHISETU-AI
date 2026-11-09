import uuid
from django.db import models


class KnowledgeChunk(models.Model):
    """
    Retrieval-grounded agricultural knowledge chunk extracted from
    schemes, crop ideal ranges, USDA nutrition profiles, and curated guides.
    """

    SOURCE_TYPES = [
        ("scheme", "Government Scheme"),
        ("crop", "Crop Profile & Growing Conditions"),
        ("nutrition", "Crop Nutrition Profile"),
        ("guide", "Curated Agriculture Guide"),
    ]

    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES, db_index=True)
    source_id = models.CharField(max_length=120, db_index=True)
    chunk_index = models.PositiveIntegerField(default=0)
    title = models.CharField(max_length=255)
    url = models.CharField(max_length=500, blank=True)
    language = models.CharField(max_length=10, default="en")
    text = models.TextField()
    content_hash = models.CharField(max_length=64, db_index=True)
    embedding = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["source_type", "source_id", "chunk_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["source_id", "chunk_index"],
                name="unique_source_chunk",
            )
        ]
        indexes = [
            models.Index(fields=["source_type", "source_id"]),
        ]

    def __str__(self) -> str:
        return f"[{self.source_type}] {self.title} (#{self.chunk_index})"


class ChatSession(models.Model):
    """Anonymous or authenticated conversational session with Krishi Mitra."""

    session_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    language = models.CharField(max_length=10, default="en")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"ChatSession {self.session_id} ({self.language})"


class ChatMessage(models.Model):
    """Individual message in a conversation session."""

    ROLES = [
        ("user", "User"),
        ("assistant", "Assistant"),
        ("system", "System"),
    ]

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=10, choices=ROLES)
    content = models.TextField(blank=True)
    language = models.CharField(max_length=10, default="en")
    sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.role} in {self.session.session_id} at {self.created_at}"


class ChatFeedback(models.Model):
    """User feedback for Krishi Mitra responses (thumbs up/down)."""

    RATINGS = [
        ("up", "Thumbs Up"),
        ("down", "Thumbs Down"),
    ]

    session_id = models.CharField(max_length=64, blank=True, db_index=True)
    message_id = models.CharField(max_length=64, blank=True)
    rating = models.CharField(max_length=10, choices=RATINGS)
    feedback_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Feedback {self.rating} ({self.created_at})"
