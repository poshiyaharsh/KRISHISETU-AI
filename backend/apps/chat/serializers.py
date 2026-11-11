"""
Serializers for Krishi Mitra chat and feedback endpoints.
"""

from rest_framework import serializers
from .models import ChatFeedback


class ChatHistoryItemSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant"])
    content = serializers.CharField(max_length=2000)


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(
        min_length=1,
        max_length=1000,
        help_text="Farmer message or question (max 1000 characters).",
    )
    history = serializers.ListField(
        child=ChatHistoryItemSerializer(),
        required=False,
        default=list,
        max_length=6,
        help_text="Conversation history up to last 6 messages.",
    )
    language = serializers.CharField(
        max_length=10,
        required=False,
        default="",
        allow_blank=True,
        help_text="Optional UI language code (e.g. 'en', 'hi', 'gu').",
    )
    session_id = serializers.UUIDField(
        required=False,
        default=None,
        allow_null=True,
        help_text="Existing session UUID, or null to initiate new session.",
    )
    stream = serializers.BooleanField(
        required=False,
        default=True,
        help_text="Whether to stream response via Server-Sent Events (SSE).",
    )

    def validate_history(self, value):
        # Enforce hard cap of last 6 messages
        if len(value) > 6:
            return value[-6:]
        return value


class ChatSourceSerializer(serializers.Serializer):
    title = serializers.CharField()
    url = serializers.CharField()
    source_type = serializers.CharField()
    score = serializers.FloatField()


class ChatResponseSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    message = serializers.CharField()
    language = serializers.CharField()
    sources = ChatSourceSerializer(many=True)


class ChatFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatFeedback
        fields = [
            "id",
            "session_id",
            "message_id",
            "rating",
            "feedback_text",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
