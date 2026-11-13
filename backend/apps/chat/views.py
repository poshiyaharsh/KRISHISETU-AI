"""
API Views for Krishi Mitra conversational agricultural assistant.
Supports SSE progressive streaming, JSON fallback, daily spend guard,
scoped throttling, metadata-only audit logging, local greeting handling,
and farmer feedback.
"""

from collections.abc import Generator
from datetime import datetime, timezone
import hashlib
import json
import logging
import re
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
from .models import ChatMessage, ChatSession, KnowledgeChunk
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

# Greetings across en, hi, gu and phonetic transliterations
GREETINGS_SET = {
    "hy", "hi", "hey", "hello", "hola", "ok", "okay", "k", "namaste", "namaskar",
    "pranam", "kem cho", "kemcho", "kaise ho", "kaisa hai", "good morning",
    "good afternoon", "good evening", "help", "help me", "madad", "madad chahiye",
    # Devanagari
    "नमस्ते", "नमस्कार", "प्रणाम", "राम राम", "हाय", "हेलो", "हाए", "शुभ प्रभात",
    "मदद", "मदद चाहिए", "कैसे हो", "कैसा है",
    # Gujarati
    "નમસ્તે", "નમસ્કાર", "પ્રણામ", "કેમ છો", "જય શ્રી કૃષ્ણ", "શુભ પ્રભાત", "મદદ",
}

GREETING_RESPONSES = {
    "hi": {
        "text": "नमस्ते किसान मित्र! मैं कृषिसेतु का कृषि मित्र हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?",
        "suggestions": [
            "कम बारिश में कौन सी फसल सबसे अच्छी है?",
            "पीएम किसान योजना के लिए पात्रता क्या है?",
            "गेहूं में यूरिया कब डालना चाहिए?",
        ],
    },
    "gu": {
        "text": "નમસ્તે ખેડૂત મિત્ર! હું કૃષિસેતુનો કૃષિ મિત્ર છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
        "suggestions": [
            "ઓછા વરસાદમાં કયો પાક શ્રેષ્ઠ છે?",
            "પીએમ કિસાન યોજના માટે યોગ્યતા શું છે?",
            "ઘઉંમાં ખાતર ક્યારે નાખવું જોઈએ?",
        ],
    },
    "en": {
        "text": "Hello farmer friend! I am Krishi Mitra, your agricultural advisory assistant. How can I help your farm today?",
        "suggestions": [
            "Which crop is best for low rainfall?",
            "What are the eligibility criteria for PM-Kisan?",
            "When should fertilizer be applied to wheat?",
        ],
    },
}


def _is_greeting(message: str) -> bool:
    cleaned = re.sub(r"[^\w\s]", "", message.strip().lower())
    return cleaned in GREETINGS_SET or len(cleaned) <= 2


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
            cache.set(cache_key, 1, timeout=86400)
            return True

        if current >= limit:
            return False

        cache.incr(cache_key)
        return True
    except Exception as e:
        logger.warning("Cache failure during daily limit check: %s", e)
        return True


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
    summary="Krishi Mitra Status",
    description="Returns real-time availability of chat assistant and knowledge base metrics.",
    responses={200: OpenApiResponse(description="Chat status and chunks count")},
)
@api_view(["GET"])
@permission_classes([AllowAny])
def chat_status_view(request):
    """Real-time availability check for Krishi Mitra chat service."""
    chunk_count = KnowledgeChunk.objects.count()
    if chunk_count == 0:
        return Response(
            {
                "available": False,
                "reason_code": "knowledge_unavailable",
                "knowledge_chunks": 0,
            },
            status=status.HTTP_200_OK,
        )

    # Check daily spend limit
    limit = getattr(settings, "CHAT_DAILY_LIMIT", 500)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = f"krishi_mitra_daily_count_{today}"
    current = cache.get(cache_key)
    if current is not None and current >= limit:
        return Response(
            {
                "available": False,
                "reason_code": "chat_busy",
                "knowledge_chunks": chunk_count,
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {
            "available": True,
            "reason_code": "ready",
            "knowledge_chunks": chunk_count,
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Krishi Mitra Multilingual Chatbot",
    description=(
        "Conversational agricultural advisory grounded in verified platform data. "
        "Supports Server-Sent Events (SSE) progressive streaming and standard JSON responses. "
        "Enforces agricultural safety, out-of-scope redirection, local greeting handler, and daily quota limits."
    ),
    request=ChatRequestSerializer,
    responses={
        200: OpenApiResponse(
            response=ChatResponseSerializer,
            description="Chat response with source citations",
        ),
        400: OpenApiResponse(description="Bad request or message too long"),
        429: OpenApiResponse(description="Chat busy or rate limit exceeded"),
        503: OpenApiResponse(description="Knowledge unavailable or chat provider unavailable"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ChatScopedRateThrottle])
def chat_view(request):
    """Primary chat endpoint for Krishi Mitra."""
    start_time = time.time()
    ip_hash = _hash_client_ip(request)

    # Check message length explicitly for specific error code
    raw_message = request.data.get("message", "")
    if isinstance(raw_message, str) and len(raw_message) > 1000:
        logger.info("Chat rejected: message_too_long (len=%d) ip_hash=%s", len(raw_message), ip_hash)
        return Response(
            {
                "error": {
                    "code": "message_too_long",
                    "message": "Message exceeds the maximum limit of 1000 characters.",
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        logger.info("Chat rejected: bad_request ip_hash=%s", ip_hash)
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Invalid chat parameters",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 1. Daily spend guard check
    if not _check_and_increment_daily_limit():
        latency_ms = int((time.time() - start_time) * 1000)
        logger.warning("Daily chat limit exceeded: code=chat_busy ip_hash=%s latency=%sms", ip_hash, latency_ms)
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

    # 4. Local Greeting & Short Query Handler (ZERO LLM CALL)
    if _is_greeting(user_message):
        greeting_data = GREETING_RESPONSES.get(resolved_lang, GREETING_RESPONSES["en"])
        greeting_text = greeting_data["text"]
        suggestions = greeting_data["suggestions"]

        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "Greeting handled locally: session=%s ip_hash=%s lang=%s latency=%sms",
            session_obj.session_id,
            ip_hash,
            resolved_lang,
            latency_ms,
        )

        ChatMessage.objects.create(
            session=session_obj,
            role="user",
            content=user_message if getattr(settings, "CHAT_DEBUG_LOG_CONTENT", False) else "",
            language=resolved_lang,
        )
        ChatMessage.objects.create(
            session=session_obj,
            role="assistant",
            content=greeting_text,
            language=resolved_lang,
            sources=[],
        )

        if should_stream:
            def greeting_stream() -> Generator[str, None, None]:
                words = greeting_text.split(" ")
                for i, w in enumerate(words):
                    prefix = "" if i == 0 else " "
                    yield f"data: {json.dumps({'type': 'token', 'content': prefix + w})}\n\n"
                yield f"data: {json.dumps({'type': 'suggestions', 'suggestions': suggestions})}\n\n"
                yield f"data: {json.dumps({'type': 'done', 'session_id': str(session_obj.session_id), 'language': resolved_lang})}\n\n"

            response = StreamingHttpResponse(greeting_stream(), content_type="text/event-stream")
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            return response

        return Response(
            {
                "session_id": session_obj.session_id,
                "message": greeting_text,
                "language": resolved_lang,
                "sources": [],
                "suggestions": suggestions,
            },
            status=status.HTTP_200_OK,
        )

    # 5. Safety Guardrail Evaluation
    safety_result = evaluate_query_safety(user_message, lang=resolved_lang)

    # If unsafe / out-of-scope / injection -> return enforced refusal
    if not safety_result.is_safe:
        refusal_text = safety_result.enforced_response or "Out-of-scope query."

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
            content=user_message if getattr(settings, "CHAT_DEBUG_LOG_CONTENT", False) else "",
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

            response = StreamingHttpResponse(refusal_stream(), content_type="text/event-stream")
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            return response

        return Response(
            {
                "session_id": session_obj.session_id,
                "message": refusal_text,
                "language": resolved_lang,
                "sources": [],
            },
            status=status.HTTP_200_OK,
        )

    # 6. Semantic Knowledge Retrieval
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

    # 7. Streaming SSE vs Synchronous JSON
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

                if len(sanitized_reply) > len(full_reply):
                    extra = sanitized_reply[len(full_reply):]
                    yield f"data: {json.dumps({'type': 'token', 'content': extra})}\n\n"

                # Save messages to database
                ChatMessage.objects.create(
                    session=session_obj,
                    role="user",
                    content=user_message if getattr(settings, "CHAT_DEBUG_LOG_CONTENT", False) else "",
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
                latency_ms = int((time.time() - start_time) * 1000)
                logger.error("Chat stream error: code=chat_provider_unavailable ip_hash=%s latency=%sms err=%s", ip_hash, latency_ms, e)
                yield f"data: {json.dumps({'type': 'error', 'code': 'chat_provider_unavailable', 'message': 'The advisory provider is temporarily unavailable. Please try again.'})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

    # Synchronous non-streaming fallback
    try:
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
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        logger.error("Chat generate error: code=chat_provider_unavailable ip_hash=%s latency=%sms err=%s", ip_hash, latency_ms, e)
        return Response(
            {
                "error": {
                    "code": "chat_provider_unavailable",
                    "message": "The advisory provider is temporarily unavailable. Please try again.",
                }
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    ChatMessage.objects.create(
        session=session_obj,
        role="user",
        content=user_message if getattr(settings, "CHAT_DEBUG_LOG_CONTENT", False) else "",
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
        },
        status=status.HTTP_200_OK,
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
