"""
Custom DRF exception handler for standardized error responses across KrishiSetu AI.
Format:
{
    "error": {
        "code": "machine_code",
        "message": "Human readable summary",
        "fields": {
            "field_name": ["code_1", "code_2"]
        }
    }
}
"""

import logging
from typing import Any

from django.http import Http404, HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class ModelUnavailableError(APIException):
    """Raised when the ML model artifact is missing or corrupted."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Crop recommendation model is currently unavailable."
    default_code = "service_unavailable"


def _extract_field_codes(data: Any) -> dict[str, list[str]]:
    """Recursively extract error codes into a flat field dictionary."""
    fields: dict[str, list[str]] = {}

    if isinstance(data, dict):
        for field, errors in data.items():
            if isinstance(errors, list):
                codes: list[str] = []
                for err in errors:
                    if hasattr(err, "code"):
                        codes.append(str(err.code))
                    elif isinstance(err, dict):
                        # Nested serializer
                        sub = _extract_field_codes(err)
                        for sub_k, sub_v in sub.items():
                            fields[f"{field}.{sub_k}"] = sub_v
                    else:
                        codes.append(str(err))
                if codes:
                    fields[str(field)] = codes
            elif isinstance(errors, dict):
                sub = _extract_field_codes(errors)
                for sub_k, sub_v in sub.items():
                    fields[f"{field}.{sub_k}"] = sub_v
            else:
                fields[str(field)] = [str(errors)]
    elif isinstance(data, list):
        fields["non_field_errors"] = [getattr(err, "code", str(err)) for err in data]

    return fields


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response:
    """Standardized exception handler for all DRF views."""
    # Let DRF handle standard exceptions first
    response = exception_handler(exc, context)

    # 1. Custom handling for ModelUnavailableError
    if isinstance(exc, ModelUnavailableError):
        return Response(
            {
                "error": {
                    "code": "service_unavailable",
                    "message": str(exc.detail),
                    "fields": {},
                }
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # 2. Unhandled 500 internal server errors (where DRF returns None)
    if response is None:
        logger.exception("Unhandled server exception occurred: %s", exc)
        return Response(
            {
                "error": {
                    "code": "server_error",
                    "message": "An unexpected internal server error occurred.",
                    "fields": {},
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # 3. Standard DRF exceptions formatting
    status_code = response.status_code

    if isinstance(exc, ValidationError) or status_code == status.HTTP_400_BAD_REQUEST:
        error_code = "validation_error"
        message = "Please check the highlighted values."
        fields = _extract_field_codes(response.data)
    elif (
        isinstance(exc, (NotFound, Http404)) or status_code == status.HTTP_404_NOT_FOUND
    ):
        error_code = "not_found"
        message = "The requested resource was not found."
        fields = {}
    elif isinstance(exc, Throttled) or status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        error_code = "throttled"
        wait = getattr(exc, "wait", 60) or 60
        message = f"Request was throttled. Expected available in {int(wait)} seconds."
        fields = {}
    elif (
        isinstance(exc, (NotAuthenticated, AuthenticationFailed))
        or status_code == status.HTTP_401_UNAUTHORIZED
    ):
        error_code = "not_authenticated"
        message = "Authentication credentials were not provided or are invalid."
        fields = {}
    elif isinstance(exc, PermissionDenied) or status_code == status.HTTP_403_FORBIDDEN:
        error_code = "permission_denied"
        message = "You do not have permission to perform this action."
        fields = {}
    elif status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
        error_code = "service_unavailable"
        message = getattr(exc, "detail", "Service is temporarily unavailable.")
        fields = {}
    else:
        error_code = getattr(exc, "default_code", "api_error")
        message = str(response.data) if response.data else "An error occurred."
        fields = _extract_field_codes(response.data)

    response.data = {
        "error": {
            "code": error_code,
            "message": str(message),
            "fields": fields,
        }
    }

    return response


def custom_404_view(
    request: HttpRequest, exception: Exception | None = None
) -> JsonResponse:
    """Return a clean JSON 404 response for unmatched routes."""
    return JsonResponse(
        {
            "error": {
                "code": "not_found",
                "message": "The requested resource was not found.",
                "fields": {},
            }
        },
        status=404,
    )


def custom_500_view(request: HttpRequest) -> JsonResponse:
    """Return a clean JSON 500 response without leaking internals."""
    return JsonResponse(
        {
            "error": {
                "code": "server_error",
                "message": "An unexpected internal server error occurred.",
                "fields": {},
            }
        },
        status=500,
    )
