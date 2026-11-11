"""
API Views for Krishi Mitra conversational agricultural assistant.
Supports SSE progressive streaming, JSON fallback, daily spend guard,
scoped throttling, metadata-only audit logging, and farmer feedback.
"""

from collections.abc import Generator
from datetime import datetime, timezone
import hashlib
import json
import logging
import time
from django.conf import settings
from django.core.cache import cache
from django.http import StreamingHttpResponse
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from .language import detect_message_language
from .llm import get_llm_client
from .models import ChatMessage, ChatSession
from .retrieval import retrieve
from .safety import (
    evaluate_query_safety,
    load_system_prompt,
    sanitize_and_enforce_output,
)
from .serializers import (
    ChatFeedbackSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer,
)

logger = logging.getLogger("krishisetu.chat")


class ChatScopedRateThrottle(ScopedRateThrottle):
    scope = "chat"


def _check_and_increment_daily_limit() -> bool:
    """
    Spend guard enforcing CHAT_DAILY_LIMIT.
    Returns True if within limit, False if exceeded.
    """
    limit = getattr(settings, "CHAT_DAILY_LIMIT", 500)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = f"krishi_mitra_daily_count_{today}"

    try:
        current = cache.get(cache_key)
        if current is None:
            # First request of the day; 24-hr TTL
            cache.set(cache_key, 1, timeout=86400)
            return True

        if current >= limit:
            return False

        cache.incr(cache_key)
        return True
    except Exception as e:
        logger.warning("Cache failure during daily limit check: %s", e)
        return True  # Fail open if cache is unreachable


def _hash_client_ip(request) -> str:
    """Compute privacy-preserving salted hash of client IP."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR", "unknown")
    salt = getattr(settings, "SECRET_KEY", "krishisetu-salt")
    return hashlib.sha256(f"{salt}:{ip}".encode("utf-8")).hexdigest()[:16]


@extend_schema(
    summary="Krishi Mitra Multilingual Chatbot",
    description=(
        "Conversational agricultural advisory grounded in verified platform data. "
        "Supports Server-Sent Events (SSE) progressive streaming and standard JSON responses. "
        "Enforces agricultural safety, out-of-scope redirection, and daily quota limits."
    ),
    request=ChatRequestSerializer,
    responses={
        200: OpenApiResponse(
            response=ChatResponseSerializer,
            description="Chat response with source citations",
        ),
        429: OpenApiResponse(description="Chat busy or rate limit exceeded"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ChatScopedRateThrottle])
def chat_view(request):
    """Primary chat endpoint for Krishi Mitra."""
    start_time = time.time()
    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "invalid_request",
                    "message": "Invalid chat parameters",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 1. Daily spend guard check
    if not _check_and_increment_daily_limit():
        logger.warning("Daily chat limit exceeded (code: chat_busy)")
        return Response(
            {
                "error": {
                    "code": "chat_busy",
                    "message": (
                        "Krishi Mitra daily advisory capacity is currently full. "
                        "Please try again tomorrow or contact the Kisan Call Centre toll-free at 1800-180-1551."
                    ),
                }
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    validated = serializer.validated_data
    user_message = validated["message"]
    history = validated.get("history", [])
    req_lang = validated.get("language", "")
    session_id = validated.get("session_id")
    should_stream = validated.get("stream", True)

    # 2. Language and script resolution
    resolved_lang = detect_message_language(
        user_message, default_ui_lang=req_lang or "en"
    )

    # 3. Session continuity
    session_obj = None
    if session_id:
        session_obj = ChatSession.objects.filter(session_id=session_id).first()
    if not session_obj:
        session_obj = ChatSession.objects.create(language=resolved_lang)

    # 4. Safety Guardrail Evaluation
    safety_result = evaluate_query_safety(user_message, lang=resolved_lang)
    ip_hash = _hash_client_ip(request)

    # If unsafe / out-of-scope / injection -> return enforced refusal
    if not safety_result.is_safe:
        refusal_text = safety_result.enforced_response or "Out-of-scope query."

        # Metadata-only logging
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "Chat query refused: session=%s ip_hash=%s category=%s lang=%s latency=%sms",
            session_obj.session_id,
            ip_hash,
            safety_result.category,
            resolved_lang,
            latency_ms,
        )

        ChatMessage.objects.create(
            session=session_obj,
            role="user",
            content=user_message
            if getattr(settings, "CHAT_DEBUG_LOG_CONTENT", False)
            else "",
            language=resolved_lang,
        )
        ChatMessage.objects.create(
            session=session_obj,
            role="assistant",
            content=refusal_text,
            language=resolved_lang,
            sources=[],
        )

        if should_stream:

            def refusal_stream():
                yield f"data: {json.dumps({'type': 'token', 'content': refusal_text})}\n\n"
                yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
                yield f"data: {json.dumps({'type': 'done', 'session_id': str(session_obj.session_id), 'language': resolved_lang})}\n\n"

            response = StreamingHttpResponse(
                refusal_stream(), content_type="text/event-stream"
            )
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            return response

        return Response(
            {
                "session_id": session_obj.session_id,
                "message": refusal_text,
                "language": resolved_lang,
                "sources": [],
            }
        )

    # 5. Semantic Knowledge Retrieval
    retrieved_chunks = retrieve(user_message, k=4)
    sources_data = [
        {
            "title": c.get("title", ""),
            "url": c.get("url", ""),
            "source_type": c.get("source_type", ""),
            "score": c.get("score", 0.0),
        }
        for c in retrieved_chunks
    ]

    system_prompt = load_system_prompt()
    llm_client = get_llm_client()

    messages_payload = list(history)
    messages_payload.append({"role": "user", "content": user_message})

    # 6. Streaming SSE vs Synchronous JSON
    if should_stream:

        def event_stream() -> Generator[str, None, None]:
            collected_pieces = []
            try:
                # First send sources metadata
                yield f"data: {json.dumps({'type': 'sources', 'sources': sources_data})}\n\n"

                # Stream response tokens progressively
                for token in llm_client.stream_chat(
                    system_prompt=system_prompt,
                    messages=messages_payload,
                    context_chunks=retrieved_chunks,
                    lang=resolved_lang,
                ):
                    collected_pieces.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

                full_reply = "".join(collected_pieces)
                sanitized_reply = sanitize_and_enforce_output(
                    full_reply,
                    requires_advisory=safety_result.requires_advisory,
                    lang=resolved_lang,
                )

                # If safety post-process added advisory that wasn't in streamed text, yield remainder
                if len(sanitized_reply) > len(full_reply):
                    extra = sanitized_reply[len(full_reply) :]
                    yield f"data: {json.dumps({'type': 'token', 'content': extra})}\n\n"

                # Save messages to database
                ChatMessage.objects.create(
                    session=session_obj,
                    role="user",
                    content=user_message
                    if getattr(settings, "CHAT_DEBUG_LOG_CONTENT", False)
                    else "",
                    language=resolved_lang,
                )
                ChatMessage.objects.create(
                    session=session_obj,
                    role="assistant",
                    content=sanitized_reply,
                    language=resolved_lang,
                    sources=sources_data,
                )

                # Send completion event
                yield f"data: {json.dumps({'type': 'done', 'session_id': str(session_obj.session_id), 'language': resolved_lang})}\n\n"

                latency_ms = int((time.time() - start_time) * 1000)
                logger.info(
                    "Chat stream finished: session=%s ip_hash=%s lang=%s sources=%d latency=%sms",
                    session_obj.session_id,
                    ip_hash,
                    resolved_lang,
                    len(sources_data),
                    latency_ms,
                )
            except Exception as e:
                logger.error("Error during chat stream generation: %s", e)
                err_msg = (
                    "An error occurred while generating the advice. Please try again."
                )
                yield f"data: {json.dumps({'type': 'error', 'message': err_msg})}\n\n"

        response = StreamingHttpResponse(
            event_stream(), content_type="text/event-stream"
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

    # Synchronous non-streaming fallback
    generated_text = llm_client.generate_chat(
        system_prompt=system_prompt,
        messages=messages_payload,
        context_chunks=retrieved_chunks,
        lang=resolved_lang,
    )
    sanitized_text = sanitize_and_enforce_output(
        generated_text,
        requires_advisory=safety_result.requires_advisory,
        lang=resolved_lang,
    )

    ChatMessage.objects.create(
        session=session_obj,
        role="user",
        content=user_message
        if getattr(settings, "CHAT_DEBUG_LOG_CONTENT", False)
        else "",
        language=resolved_lang,
    )
    ChatMessage.objects.create(
        session=session_obj,
        role="assistant",
        content=sanitized_text,
        language=resolved_lang,
        sources=sources_data,
    )

    latency_ms = int((time.time() - start_time) * 1000)
    logger.info(
        "Chat response generated: session=%s ip_hash=%s lang=%s sources=%d latency=%sms",
        session_obj.session_id,
        ip_hash,
        resolved_lang,
        len(sources_data),
        latency_ms,
    )

    return Response(
        {
            "session_id": session_obj.session_id,
            "message": sanitized_text,
            "language": resolved_lang,
            "sources": sources_data,
        }
    )


@extend_schema(
    summary="Record Farmer Feedback",
    description="Store thumbs up/down user rating and optional comments for a chat response.",
    request=ChatFeedbackSerializer,
    responses={201: ChatFeedbackSerializer},
)
@api_view(["POST"])
@permission_classes([AllowAny])
def chat_feedback_view(request):
    """Store farmer feedback on response usefulness."""
    serializer = ChatFeedbackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
