"""
Authentication and Profile API views for KrishiSetu AI accounts.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .authentication import JWTAuthentication
from .serializers import (
    RefreshTokenSerializer,
    RequestCodeSerializer,
    UserSerializer,
    VerifyCodeSerializer,
)
from .services import (
    AuthException,
    generate_otp,
    revoke_refresh_token,
    rotate_refresh_token,
    verify_otp,
)


@extend_schema(
    summary="Request email verification code",
    description="Generates a 6-digit verification code sent to the farmer's email. Responses are anti-enumeration safe.",
    request=RequestCodeSerializer,
    responses={
        200: OpenApiResponse(description="Code dispatched or silently acknowledged"),
        400: OpenApiResponse(description="Invalid request syntax or email format"),
        429: OpenApiResponse(description="Too many requests (rate limit exceeded)"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def request_code_view(request):
    """Dispatch a 6-digit verification code to the farmer's email address."""
    serializer = RequestCodeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Invalid email address format.",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = serializer.validated_data["email"]
    language = serializer.validated_data.get("language", "en")

    try:
        generate_otp(email=email, language=language)
    except AuthException as e:
        return Response(
            {"error": {"code": e.code, "message": e.message}},
            status=e.status_code,
        )
    except Exception:
        # Fallback for unexpected mail transport errors; maintain anti-enumeration response
        pass

    return Response(
        {
            "status": "ok",
            "message": "If this email is valid, a verification code has been sent.",
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Verify email code and authenticate",
    description="Verifies a 6-digit code. Returns a short-lived access token and rotated refresh token.",
    request=VerifyCodeSerializer,
    responses={
        200: OpenApiResponse(description="Authentication successful"),
        400: OpenApiResponse(
            description="Code invalid, expired, or maximum attempts exceeded"
        ),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def verify_code_view(request):
    """Verify submitted 6-digit code and issue session token pair."""
    serializer = VerifyCodeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Invalid verification submission.",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = serializer.validated_data["email"]
    code = serializer.validated_data["code"]
    language = serializer.validated_data.get("language", "en")

    try:
        user, access_token, refresh_token = verify_otp(
            email=email, code=code, language=language
        )
    except AuthException as e:
        return Response(
            {"error": {"code": e.code, "message": e.message}},
            status=e.status_code,
        )

    user_data = UserSerializer(user).data
    return Response(
        {
            "status": "ok",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user_data,
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Refresh access token",
    description="Rotates refresh token and issues a fresh 15-minute access token.",
    request=RefreshTokenSerializer,
    responses={
        200: OpenApiResponse(description="Tokens rotated successfully"),
        401: OpenApiResponse(description="Invalid, revoked, or expired refresh token"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """Rotate refresh token and issue a fresh access token."""
    serializer = RefreshTokenSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Missing or malformed refresh token.",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    raw_token = serializer.validated_data["refresh_token"]

    try:
        access_token, new_refresh_token = rotate_refresh_token(raw_token)
    except AuthException as e:
        return Response(
            {"error": {"code": e.code, "message": e.message}},
            status=e.status_code,
        )

    return Response(
        {
            "status": "ok",
            "access_token": access_token,
            "refresh_token": new_refresh_token,
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Logout and revoke session",
    description="Revokes the active refresh token.",
    request=RefreshTokenSerializer,
    responses={
        200: OpenApiResponse(description="Logged out successfully"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    """Revoke refresh token on client logout."""
    raw_token = request.data.get("refresh_token")
    if raw_token and isinstance(raw_token, str):
        revoke_refresh_token(raw_token)

    return Response(
        {"status": "ok", "message": "Logged out successfully."},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Get current farmer profile and account info",
    description="Returns the profile and demographic details of the authenticated farmer.",
    responses={
        200: UserSerializer,
        401: OpenApiResponse(
            description="Authentication credentials missing or invalid"
        ),
    },
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Retrieve authenticated user's account details and agricultural profile."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)
