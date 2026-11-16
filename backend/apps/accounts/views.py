"""
Authentication and Profile API views for KrishiSetu AI accounts.
"""

from django.conf import settings
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.crops.models import PredictionRecord
from apps.schemes.models import Scheme
from .authentication import JWTAuthentication
from .models import FarmPlot, SavedScheme
from .serializers import (
    AddSavedSchemeSerializer,
    ClaimHistorySerializer,
    FarmerProfileSerializer,
    FarmPlotSerializer,
    GoogleAuthSerializer,
    PredictionRecordSerializer,
    RefreshTokenSerializer,
    RequestCodeSerializer,
    SavedSchemeSerializer,
    UserSerializer,
    VerifyCodeSerializer,
)
from .services import (
    AuthException,
    authenticate_or_register_google_user,
    delete_user_account,
    generate_otp,
    logout_all_sessions,
    revoke_refresh_token,
    rotate_refresh_token,
    verify_google_credential,
    verify_otp,
)

COOKIE_NAME = "krishisetu_rf"
COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 days


def set_refresh_cookie(response: Response, raw_token: str) -> None:
    """Sets the refresh token in an httpOnly, Secure cookie."""
    is_secure = not getattr(settings, "DEBUG", True)
    response.set_cookie(
        key=COOKIE_NAME,
        value=raw_token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=is_secure,
        samesite="Lax",
        path="/api/auth/",
    )


def clear_refresh_cookie(response: Response) -> None:
    """Clears the refresh token cookie."""
    response.delete_cookie(key=COOKIE_NAME, path="/api/auth/")


def check_refresh_csrf(request) -> bool:
    """
    CSRF defense for cookie-based refresh requests.
    Validates custom header X-KrishiSetu-Client or X-Requested-With.
    """
    client_header = request.headers.get("X-KrishiSetu-Client") or request.headers.get(
        "X-Requested-With"
    )
    return bool(client_header)


@extend_schema(
    summary="Authenticate with Google Identity Services",
    description="Verifies a Google ID token and issues an access token and rotating refresh token.",
    request=GoogleAuthSerializer,
    responses={
        200: OpenApiResponse(description="Google authentication successful"),
        400: OpenApiResponse(description="Invalid token, audience, or unverified email"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def google_auth_view(request):
    """Authenticate or register a farmer using Google Sign-In (GIS)."""
    serializer = GoogleAuthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Invalid Google authentication submission.",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    credential = serializer.validated_data["credential"]
    client_type = serializer.validated_data.get("client_type", "web")
    language = serializer.validated_data.get("language", "en")

    try:
        token_info = verify_google_credential(credential)
        user, access_token, refresh_token = authenticate_or_register_google_user(
            token_info, request=request, language=language
        )
    except AuthException as e:
        return Response(
            {"error": {"code": e.code, "message": e.message}},
            status=e.status_code,
        )
    except Exception as e:
        return Response(
            {"error": {"code": "google_auth_failed", "message": str(e)}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_data = UserSerializer(user).data
    response_data = {
        "status": "ok",
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": 900,
        "user": user_data,
    }

    if client_type == "mobile":
        response_data["refresh_token"] = refresh_token
        return Response(response_data, status=status.HTTP_200_OK)

    response = Response(response_data, status=status.HTTP_200_OK)
    set_refresh_cookie(response, refresh_token)
    return response


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

    code = None
    try:
        code = generate_otp(email=email, language=language)
    except AuthException as e:
        return Response(
            {"error": {"code": e.code, "message": e.message}},
            status=e.status_code,
        )
    except Exception:
        # Fallback for unexpected mail transport errors; maintain anti-enumeration response
        pass

    response_data = {
        "status": "ok",
        "message": "If this email is valid, a verification code has been sent.",
    }
    if (settings.DEBUG or getattr(settings, "RETURN_DEV_OTP", False)) and code:
        response_data["dev_code"] = code

    return Response(response_data, status=status.HTTP_200_OK)


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
    client_type = serializer.validated_data.get("client_type", "web")

    try:
        user, access_token, refresh_token = verify_otp(
            email=email, code=code, language=language, request=request
        )
    except AuthException as e:
        return Response(
            {"error": {"code": e.code, "message": e.message}},
            status=e.status_code,
        )

    user_data = UserSerializer(user).data
    response_data = {
        "status": "ok",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "expires_in": 900,
        "user": user_data,
    }

    if client_type == "mobile":
        return Response(response_data, status=status.HTTP_200_OK)

    # For web clients, set refresh token in httpOnly, secure cookie
    response = Response(response_data, status=status.HTTP_200_OK)
    set_refresh_cookie(response, refresh_token)
    return response


@extend_schema(
    summary="Refresh access token",
    description="Rotates refresh token and issues a fresh 15-minute access token.",
    request=RefreshTokenSerializer,
    responses={
        200: OpenApiResponse(description="Tokens rotated successfully"),
        401: OpenApiResponse(description="Invalid, revoked, or expired refresh token"),
        403: OpenApiResponse(description="CSRF verification failed"),
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

    raw_token = serializer.validated_data.get("refresh_token")
    client_type = serializer.validated_data.get("client_type", "web")
    is_cookie_session = False

    if not raw_token:
        # Check cookie
        raw_token = request.COOKIES.get(COOKIE_NAME)
        if not raw_token:
            return Response(
                {
                    "error": {
                        "code": "bad_request",
                        "message": "No refresh token provided in body or cookie.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        is_cookie_session = True

        # CSRF check on cookie refresh
        if not check_refresh_csrf(request):
            return Response(
                {
                    "error": {
                        "code": "csrf_rejected",
                        "message": "Missing CSRF verification header (X-KrishiSetu-Client).",
                    }
                },
                status=status.HTTP_403_FORBIDDEN,
            )

    try:
        access_token, new_refresh_token = rotate_refresh_token(
            raw_token, request=request
        )
    except AuthException as e:
        return Response(
            {"error": {"code": e.code, "message": e.message}},
            status=e.status_code,
        )

    response_data = {
        "status": "ok",
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "Bearer",
        "expires_in": 900,
    }

    if client_type == "mobile" and not is_cookie_session:
        return Response(response_data, status=status.HTTP_200_OK)

    response = Response(response_data, status=status.HTTP_200_OK)
    set_refresh_cookie(response, new_refresh_token)
    return response


@extend_schema(
    summary="Logout and revoke session",
    description="Revokes the active refresh token and clears session cookie.",
    request=RefreshTokenSerializer,
    responses={
        200: OpenApiResponse(description="Logged out successfully"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    """Revoke refresh token on client logout and clear cookie."""
    raw_token = request.data.get("refresh_token") or request.COOKIES.get(COOKIE_NAME)
    if raw_token and isinstance(raw_token, str):
        revoke_refresh_token(raw_token, request=request)

    response = Response(
        {"status": "ok", "message": "Logged out successfully."},
        status=status.HTTP_200_OK,
    )
    clear_refresh_cookie(response)
    return response


@extend_schema(
    summary="Logout everywhere",
    description="Revokes all refresh tokens for the authenticated user across all devices.",
    responses={
        200: OpenApiResponse(description="All sessions revoked"),
        401: OpenApiResponse(description="Unauthenticated"),
    },
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def logout_everywhere_view(request):
    """Revokes all active refresh tokens for the authenticated user."""
    logout_all_sessions(request.user, request=request)
    response = Response(
        {"status": "ok", "message": "All sessions revoked successfully."},
        status=status.HTTP_200_OK,
    )
    clear_refresh_cookie(response)
    return response


@extend_schema(
    summary="Get current farmer account or delete account",
    description="Returns profile details of the authenticated farmer, or deletes account (Right to Erasure under DPDP Act 2023).",
    responses={
        200: UserSerializer,
        204: OpenApiResponse(description="Account deleted successfully"),
        401: OpenApiResponse(
            description="Authentication credentials missing or invalid"
        ),
    },
)
@api_view(["GET", "DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Retrieve or delete authenticated user's account details and agricultural profile."""
    if request.method == "DELETE":
        delete_user_account(request.user, request=request)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response

    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Get or update farmer profile",
    description="Retrieve or update the authenticated farmer's agricultural and demographic profile.",
    request=FarmerProfileSerializer,
    responses={
        200: FarmerProfileSerializer,
        400: OpenApiResponse(description="Validation error in profile fields"),
    },
)
@api_view(["GET", "PUT", "PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get or update current farmer profile."""
    profile = request.user.profile

    if request.method == "GET":
        return Response(
            FarmerProfileSerializer(profile).data, status=status.HTTP_200_OK
        )

    partial = request.method == "PATCH"
    serializer = FarmerProfileSerializer(profile, data=request.data, partial=partial)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Invalid profile data.",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer.save()
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    summary="List or create farm plots",
    description="List all plots belonging to the farmer profile, or register a new plot (max 5 plots allowed).",
    request=FarmPlotSerializer,
    responses={
        200: FarmPlotSerializer(many=True),
        201: FarmPlotSerializer,
        400: OpenApiResponse(description="Validation error or maximum plots exceeded"),
    },
)
@api_view(["GET", "POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def plots_list_create_view(request):
    """List or create plots belonging to the authenticated farmer profile."""
    profile = request.user.profile

    if request.method == "GET":
        plots = profile.plots.all().order_by("name")
        return Response(
            FarmPlotSerializer(plots, many=True).data, status=status.HTTP_200_OK
        )

    # POST: create plot
    if profile.plots.count() >= 5:
        return Response(
            {
                "error": {
                    "code": "max_plots_exceeded",
                    "message": "A farmer profile can register a maximum of 5 plots.",
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = FarmPlotSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Invalid plot data.",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    plot = serializer.save(profile=profile)
    return Response(FarmPlotSerializer(plot).data, status=status.HTTP_201_CREATED)


@extend_schema(
    summary="Retrieve, update or delete a farm plot",
    description="Object-level protected CRUD for a single plot. Returns 404 for plots belonging to other users.",
    request=FarmPlotSerializer,
    responses={
        200: FarmPlotSerializer,
        204: OpenApiResponse(description="Plot deleted successfully"),
        404: OpenApiResponse(description="Plot not found"),
    },
)
@api_view(["GET", "PUT", "PATCH", "DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def plot_detail_view(request, pk: int):
    """Retrieve, update, or delete a specific farm plot with object-level ownership check."""
    profile = request.user.profile
    plot = get_object_or_404(FarmPlot, pk=pk, profile=profile)

    if request.method == "GET":
        return Response(FarmPlotSerializer(plot).data, status=status.HTTP_200_OK)

    if request.method == "DELETE":
        plot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    partial = request.method == "PATCH"
    serializer = FarmPlotSerializer(plot, data=request.data, partial=partial)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Invalid plot update data.",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer.save()
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    summary="List or bookmark saved schemes",
    description="Retrieve all schemes bookmarked by the farmer, or bookmark a scheme by slug or ID.",
    request=AddSavedSchemeSerializer,
    responses={
        200: SavedSchemeSerializer(many=True),
        201: SavedSchemeSerializer,
        404: OpenApiResponse(description="Target scheme does not exist"),
    },
)
@api_view(["GET", "POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def saved_schemes_list_create_view(request):
    """List or add government scheme bookmarks for the authenticated farmer."""
    if request.method == "GET":
        bookmarks = (
            SavedScheme.objects.filter(user=request.user)
            .select_related("scheme", "scheme__category")
            .order_by("-created_at")
        )
        return Response(
            SavedSchemeSerializer(bookmarks, many=True).data, status=status.HTTP_200_OK
        )

    serializer = AddSavedSchemeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Missing scheme identifier.",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    scheme_slug = serializer.validated_data.get("scheme_slug")
    scheme_id = serializer.validated_data.get("scheme_id")

    if scheme_slug:
        scheme = get_object_or_404(Scheme, slug=scheme_slug)
    else:
        scheme = get_object_or_404(Scheme, pk=scheme_id)

    bookmark, created = SavedScheme.objects.get_or_create(
        user=request.user, scheme=scheme
    )
    status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return Response(SavedSchemeSerializer(bookmark).data, status=status_code)


@extend_schema(
    summary="Delete a saved scheme bookmark",
    description="Removes a bookmarked scheme for the authenticated farmer. Returns 404 if not found.",
    responses={
        204: OpenApiResponse(description="Bookmark deleted successfully"),
        404: OpenApiResponse(description="Bookmark not found"),
    },
)
@api_view(["DELETE"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def saved_scheme_delete_view(request, slug: str):
    """Delete a specific scheme bookmark."""
    scheme = get_object_or_404(Scheme, slug=slug)
    bookmark = get_object_or_404(SavedScheme, user=request.user, scheme=scheme)
    bookmark.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    summary="Get farmer recommendation history",
    description="Returns paginated crop recommendations generated by the authenticated farmer, newest first.",
    responses={
        200: OpenApiResponse(description="Paginated list of prediction records"),
    },
)
@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def predictions_history_view(request):
    """Retrieve paginated recommendation audit history for the authenticated farmer."""
    page_number = request.query_params.get("page", 1)
    page_size = min(int(request.query_params.get("page_size", 10)), 50)

    predictions = PredictionRecord.objects.filter(user=request.user).order_by(
        "-created_at"
    )
    paginator = Paginator(predictions, page_size)
    page = paginator.get_page(page_number)

    return Response(
        {
            "count": paginator.count,
            "num_pages": paginator.num_pages,
            "current_page": page.number,
            "results": PredictionRecordSerializer(page.object_list, many=True).data,
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Claim guest recommendation history",
    description="Attaches anonymous crop recommendations generated before login to the authenticated farmer account.",
    request=ClaimHistorySerializer,
    responses={
        200: OpenApiResponse(description="History claimed successfully"),
        400: OpenApiResponse(description="Invalid request syntax"),
    },
)
@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def claim_history_view(request):
    """Attach unclaimed guest prediction records to the authenticated farmer."""
    serializer = ClaimHistorySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "error": {
                    "code": "bad_request",
                    "message": "Invalid claim payload.",
                    "details": serializer.errors,
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    prediction_ids = serializer.validated_data["prediction_ids"]
    updated_count = PredictionRecord.objects.filter(
        id__in=prediction_ids,
        user__isnull=True,
    ).update(user=request.user)

    return Response(
        {
            "status": "ok",
            "claimed_count": updated_count,
            "message": f"Successfully attached {updated_count} recommendation(s) to your account.",
        },
        status=status.HTTP_200_OK,
    )
