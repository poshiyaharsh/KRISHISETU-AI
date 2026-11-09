"""
Tests for standardized exception handling across DRF error codes (400, 404, 429, 500, 503).
"""

from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView


class FlakyServerView(APIView):
    def get(self, request):
        raise RuntimeError("Unexpected internal crash")


class ThrottledView(APIView):
    def get(self, request):
        raise Throttled(wait=45)


def test_custom_exception_handler_500():
    factory = APIRequestFactory()
    request = factory.get("/flaky/")
    view = FlakyServerView.as_view()

    response = view(request)
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    data = response.data
    assert "error" in data
    assert data["error"]["code"] == "server_error"
    assert "unexpected internal server error" in data["error"]["message"].lower()


def test_custom_exception_handler_429():
    factory = APIRequestFactory()
    request = factory.get("/throttled/")
    view = ThrottledView.as_view()

    response = view(request)
    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    data = response.data
    assert "error" in data
    assert data["error"]["code"] == "throttled"
    assert "45 seconds" in data["error"]["message"]
