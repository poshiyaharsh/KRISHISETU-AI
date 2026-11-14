"""
Authentication and Profile API views for KrishiSetu AI accounts.
"""

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
    PredictionRecordSerializer,
    RefreshTokenSerializer,
    RequestCodeSerializer,
    SavedSchemeSerializer,
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
    summary="Get current farmer account and profile",
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
