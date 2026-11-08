from datetime import UTC, datetime

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

API_VERSION = "0.1.0"
SERVICE_NAME = "krishisetu-api"


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for KrishiSetu AI backend service.
    Returns status, service identifier, version, and current UTC timestamp.
    """
    return Response(
        {
            "status": "ok",
            "service": SERVICE_NAME,
            "version": API_VERSION,
            "time": datetime.now(UTC).isoformat(),
        }
    )
