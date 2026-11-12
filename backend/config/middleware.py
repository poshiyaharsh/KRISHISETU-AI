"""
Security headers and request ID structured logging middleware for KrishiSetu AI.
"""

import contextvars
import logging
import uuid
from typing import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse

_request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar(
    "request_id", default="-"
)


def get_request_id() -> str:
    """Return the active request ID for structured logging."""
    return _request_id_ctx.get()


class RequestIDFilter(logging.Filter):
    """Attach the current request_id to every log record without PII."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        return True


class SecurityHeadersMiddleware:
    """
    Injects X-Request-ID, Content-Security-Policy, and Permissions-Policy headers
    across all responses.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        incoming_id = request.headers.get("X-Request-ID", "").strip()
        req_id = incoming_id[:64] if incoming_id else uuid.uuid4().hex
        token = _request_id_ctx.set(req_id)

        try:
            response = self.get_response(request)
        finally:
            _request_id_ctx.reset(token)

        response["X-Request-ID"] = req_id

        csp = getattr(
            settings,
            "CONTENT_SECURITY_POLICY",
            (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            ),
        )
        if csp and "Content-Security-Policy" not in response:
            response["Content-Security-Policy"] = csp

        response.setdefault(
            "Permissions-Policy",
            "geolocation=(self), camera=(), microphone=()",
        )

        return response
