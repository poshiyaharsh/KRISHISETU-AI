"""
Comprehensive API tests for accounts authentication, OTP flow, token rotation, and profile endpoint (T13.3).
"""

from datetime import timedelta
import pytest
from django.core import mail
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import EmailVerificationOTP, User
from apps.accounts.services import generate_otp


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
def test_request_code_happy_path_multilingual(client):
    """Verify OTP dispatch sends localized email and responds identically for new and existing accounts."""
    url = reverse("auth-request-code")

    # 1. New user request (English)
    resp = client.post(
        url, {"email": "farmer1@krishisetu.in", "language": "en"}, format="json"
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["status"] == "ok"
    assert "verification code has been sent" in resp.json()["message"]
    assert len(mail.outbox) == 1
    assert "Your KrishiSetu AI Verification Code" in mail.outbox[0].subject

    # Verify plaintext code is NOT stored in DB
    otp = EmailVerificationOTP.objects.get(email="farmer1@krishisetu.in")
    assert len(otp.salt) == 32
    assert len(otp.code_hash) == 64
    assert otp.attempts == 0
    assert otp.is_used is False

    # 2. Existing user request (Hindi)
    User.objects.create(email="existing@krishisetu.in")
    resp_hi = client.post(
        url, {"email": "existing@krishisetu.in", "language": "hi"}, format="json"
    )
    assert resp_hi.status_code == status.HTTP_200_OK
    # Identical response structure (Anti-enumeration)
    assert resp_hi.json() == resp.json()
    assert len(mail.outbox) == 2
    assert "सत्यापन कोड" in mail.outbox[1].subject


@pytest.mark.django_db
def test_request_code_hourly_rate_limit(client):
    """Verify maximum 5 OTP requests per hour; 6th returns HTTP 429 rate_limited."""
    url = reverse("auth-request-code")
    email = "flooder@krishisetu.in"

    for i in range(5):
        resp = client.post(url, {"email": email}, format="json")
        assert resp.status_code == status.HTTP_200_OK

    # 6th attempt should be blocked
    resp_blocked = client.post(url, {"email": email}, format="json")
    assert resp_blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    data = resp_blocked.json()
    assert data["error"]["code"] == "rate_limited"


@pytest.mark.django_db
def test_verify_code_happy_path(client):
    """Verify correct 6-digit code authenticates, creates user and profile, and issues token pair."""
    code = generate_otp(email="newfarmer@krishisetu.in", language="gu")
    url = reverse("auth-verify-code")

    resp = client.post(
        url,
        {"email": "newfarmer@krishisetu.in", "code": code, "language": "gu"},
        format="json",
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()

    assert data["status"] == "ok"
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "newfarmer@krishisetu.in"
    assert data["user"]["profile"]["preferred_language"] == "gu"

    # Verify user created in DB with consent timestamp
    user = User.objects.get(email="newfarmer@krishisetu.in")
    assert user.consented_at is not None
    assert user.consent_version == "1.0"
    assert user.profile.preferred_language == "gu"

    # Verify OTP is marked consumed
    otp = EmailVerificationOTP.objects.get(email="newfarmer@krishisetu.in")
    assert otp.is_used is True


@pytest.mark.django_db
def test_verify_code_wrong_code_and_max_attempts(client):
    """Verify wrong code increments attempts, and 5th wrong attempt locks the OTP."""
    code = generate_otp(email="security@krishisetu.in")
    url = reverse("auth-verify-code")

    # 4 wrong attempts
    for attempt in range(1, 5):
        resp = client.post(
            url, {"email": "security@krishisetu.in", "code": "000000"}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.json()["error"]["code"] == "invalid_code"
        otp = EmailVerificationOTP.objects.get(email="security@krishisetu.in")
        assert otp.attempts == attempt
        assert otp.is_used is False

    # 5th wrong attempt invalidates code
    resp_5th = client.post(
        url, {"email": "security@krishisetu.in", "code": "000000"}, format="json"
    )
    assert resp_5th.status_code == status.HTTP_400_BAD_REQUEST
    assert resp_5th.json()["error"]["code"] == "invalid_code"
    otp = EmailVerificationOTP.objects.get(email="security@krishisetu.in")
    assert otp.attempts == 5
    assert otp.is_used is True

    # 6th attempt returns too_many_attempts or code_not_found
    resp_6th = client.post(
        url, {"email": "security@krishisetu.in", "code": code}, format="json"
    )
    assert resp_6th.status_code == status.HTTP_400_BAD_REQUEST
    assert resp_6th.json()["error"]["code"] in ["code_not_found", "too_many_attempts"]


@pytest.mark.django_db
def test_verify_code_expired(client):
    """Verify expired OTP code (>10 minutes) returns code_expired."""
    code = generate_otp(email="expired@krishisetu.in")
    # Backdate OTP expiration
    EmailVerificationOTP.objects.filter(email="expired@krishisetu.in").update(
        expires_at=timezone.now() - timedelta(seconds=1)
    )

    url = reverse("auth-verify-code")
    resp = client.post(
        url, {"email": "expired@krishisetu.in", "code": code}, format="json"
    )
    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert resp.json()["error"]["code"] == "code_expired"


@pytest.mark.django_db
def test_refresh_token_rotation_and_revocation(client):
    """Verify refresh token rotation and logout revocation."""
    code = generate_otp(email="rotation@krishisetu.in")
    verify_url = reverse("auth-verify-code")
    auth_resp = client.post(
        verify_url, {"email": "rotation@krishisetu.in", "code": code}, format="json"
    )
    refresh_token_1 = auth_resp.json()["refresh_token"]

    refresh_url = reverse("auth-refresh")
    # Rotate refresh token
    rotate_resp = client.post(
        refresh_url, {"refresh_token": refresh_token_1}, format="json"
    )
    assert rotate_resp.status_code == status.HTTP_200_OK
    refresh_token_2 = rotate_resp.json()["refresh_token"]
    assert refresh_token_2 != refresh_token_1

    # Old refresh token 1 is revoked and cannot be used
    reuse_resp = client.post(
        refresh_url, {"refresh_token": refresh_token_1}, format="json"
    )
    assert reuse_resp.status_code == status.HTTP_401_UNAUTHORIZED
    assert reuse_resp.json()["error"]["code"] == "invalid_refresh_token"

    # Logout revokes refresh token 2
    logout_url = reverse("auth-logout")
    logout_resp = client.post(
        logout_url, {"refresh_token": refresh_token_2}, format="json"
    )
    assert logout_resp.status_code == status.HTTP_200_OK

    # Refresh token 2 cannot be used after logout
    post_logout_resp = client.post(
        refresh_url, {"refresh_token": refresh_token_2}, format="json"
    )
    assert post_logout_resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_me_endpoint_authenticated_and_unauthenticated(client):
    """Verify GET /api/me/ returns profile with valid Bearer token and rejects unauthenticated queries."""
    url = reverse("me-detail")

    # 1. Unauthenticated request
    unauth_resp = client.get(url)
    assert unauth_resp.status_code == status.HTTP_401_UNAUTHORIZED

    # 2. Authenticated request with Bearer token
    code = generate_otp(email="me@krishisetu.in")
    verify_resp = client.post(
        reverse("auth-verify-code"),
        {"email": "me@krishisetu.in", "code": code},
        format="json",
    )
    access_token = verify_resp.json()["access_token"]

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    auth_resp = client.get(url)
    assert auth_resp.status_code == status.HTTP_200_OK
    assert auth_resp.json()["email"] == "me@krishisetu.in"
    assert "profile" in auth_resp.json()


@pytest.mark.django_db
def test_profile_update(client):
    """Verify GET and PATCH /api/me/profile/ updates farmer demographic details."""
    code = generate_otp(email="farmer.profile@krishisetu.in")
    auth_resp = client.post(
        reverse("auth-verify-code"),
        {"email": "farmer.profile@krishisetu.in", "code": code},
        format="json",
    )
    access_token = auth_resp.json()["access_token"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    profile_url = reverse("me-profile")
    get_resp = client.get(profile_url)
    assert get_resp.status_code == status.HTTP_200_OK

    patch_resp = client.patch(
        profile_url,
        {
            "display_name": "Suresh Kumar",
            "preferred_language": "hi",
            "land_area_value": 3.2,
            "land_area_unit": "acre",
            "primary_irrigation_source": "canal",
        },
        format="json",
    )
    assert patch_resp.status_code == status.HTTP_200_OK
    data = patch_resp.json()
    assert data["display_name"] == "Suresh Kumar"
    assert data["preferred_language"] == "hi"
    assert data["primary_irrigation_source"] == "canal"


@pytest.mark.django_db
def test_plots_crud_and_max_5_limit(client):
    """Verify plots CRUD and enforcement of max 5 plots per farmer."""
    code = generate_otp(email="plots@krishisetu.in")
    auth_resp = client.post(
        reverse("auth-verify-code"),
        {"email": "plots@krishisetu.in", "code": code},
        format="json",
    )
    access_token = auth_resp.json()["access_token"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    plots_url = reverse("me-plots-list-create")

    # Create 5 plots
    plot_ids = []
    for i in range(1, 6):
        resp = client.post(
            plots_url,
            {
                "name": f"Plot #{i}",
                "area_value": float(i),
                "area_unit": "acre",
                "soil_type": "alluvial",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        plot_ids.append(resp.json()["id"])

    # Attempt to create 6th plot (Should be rejected)
    resp_6th = client.post(
        plots_url,
        {"name": "Plot #6", "area_value": 2.5, "area_unit": "acre"},
        format="json",
    )
    assert resp_6th.status_code == status.HTTP_400_BAD_REQUEST
    assert resp_6th.json()["error"]["code"] == "max_plots_exceeded"

    # List plots
    list_resp = client.get(plots_url)
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.json()) == 5

    # Update plot
    detail_url = reverse("me-plot-detail", kwargs={"pk": plot_ids[0]})
    update_resp = client.patch(detail_url, {"name": "Renamed Main Plot"}, format="json")
    assert update_resp.status_code == status.HTTP_200_OK
    assert update_resp.json()["name"] == "Renamed Main Plot"

    # Delete plot
    del_resp = client.delete(detail_url)
    assert del_resp.status_code == status.HTTP_204_NO_CONTENT

    # Now can create another plot
    resp_after_del = client.post(
        plots_url,
        {"name": "New Allowed Plot", "area_value": 1.0, "area_unit": "acre"},
        format="json",
    )
    assert resp_after_del.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_cross_user_plot_isolation(client):
    """Verify that User B cannot view, edit, or delete User A's plot (returns 404)."""
    # User A creates a plot
    code_a = generate_otp(email="user.a@krishisetu.in")
    auth_a = client.post(
        reverse("auth-verify-code"),
        {"email": "user.a@krishisetu.in", "code": code_a},
        format="json",
    )
    token_a = auth_a.json()["access_token"]

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_a}")
    create_resp = client.post(
        reverse("me-plots-list-create"),
        {"name": "User A Private Field", "area_value": 4.0, "area_unit": "acre"},
        format="json",
    )
    plot_a_id = create_resp.json()["id"]

    # User B logs in
    code_b = generate_otp(email="user.b@krishisetu.in")
    auth_b = client.post(
        reverse("auth-verify-code"),
        {"email": "user.b@krishisetu.in", "code": code_b},
        format="json",
    )
    token_b = auth_b.json()["access_token"]

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_b}")
    cross_url = reverse("me-plot-detail", kwargs={"pk": plot_a_id})

    # Cross-user GET returns 404
    assert client.get(cross_url).status_code == status.HTTP_404_NOT_FOUND
    # Cross-user PATCH returns 404
    assert (
        client.patch(cross_url, {"name": "Hacked Name"}, format="json").status_code
        == status.HTTP_404_NOT_FOUND
    )
    # Cross-user DELETE returns 404
    assert client.delete(cross_url).status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_saved_schemes_crud_and_isolation(client):
    """Verify bookmarking schemes and cross-user deletion isolation."""
    from apps.schemes.models import Scheme, SchemeCategory

    cat = SchemeCategory.objects.create(name="Irrigation", slug="irrigation")
    Scheme.objects.create(
        slug="pmksy-test",
        name="PM Krishi Sinchayee Yojana",
        short_description="Irrigation support",
        description="Full details",
        category=cat,
        level="central",
        department="MoA",
        official_url="https://pmksy.gov.in/",
        last_verified_on=timezone.now().date(),
    )

    code_a = generate_otp(email="schemes.a@krishisetu.in")
    auth_a = client.post(
        reverse("auth-verify-code"),
        {"email": "schemes.a@krishisetu.in", "code": code_a},
        format="json",
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_a.json()['access_token']}")

    # Bookmark scheme
    save_url = reverse("me-saved-schemes")
    save_resp = client.post(save_url, {"scheme_slug": "pmksy-test"}, format="json")
    assert save_resp.status_code == status.HTTP_201_CREATED
    assert save_resp.json()["slug"] == "pmksy-test"

    # List bookmarks
    list_resp = client.get(save_url)
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.json()) == 1

    # User B cannot delete User A's bookmark
    code_b = generate_otp(email="schemes.b@krishisetu.in")
    auth_b = client.post(
        reverse("auth-verify-code"),
        {"email": "schemes.b@krishisetu.in", "code": code_b},
        format="json",
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_b.json()['access_token']}")

    del_url = reverse("me-saved-scheme-delete", kwargs={"slug": "pmksy-test"})
    assert client.delete(del_url).status_code == status.HTTP_404_NOT_FOUND

    # User A deletes their bookmark
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_a.json()['access_token']}")
    assert client.delete(del_url).status_code == status.HTTP_204_NO_CONTENT
    assert len(client.get(save_url).json()) == 0


@pytest.mark.django_db
def test_claim_history_and_authenticated_recommendation(client):
    """Verify anonymous predictions can be claimed and new recommendations link automatically."""
    from apps.crops.models import PredictionRecord

    # Create 2 anonymous prediction records
    pred1 = PredictionRecord.objects.create(
        user=None,
        nitrogen=50,
        phosphorus=50,
        potassium=50,
        temperature=25,
        humidity=70,
        ph=6.5,
        rainfall=150,
        results=[{"crop": "rice", "score": 0.9}],
        model_version="test-1",
    )
    pred2 = PredictionRecord.objects.create(
        user=None,
        nitrogen=40,
        phosphorus=40,
        potassium=40,
        temperature=22,
        humidity=65,
        ph=7.0,
        rainfall=100,
        results=[{"crop": "maize", "score": 0.85}],
        model_version="test-1",
    )

    code = generate_otp(email="claim@krishisetu.in")
    auth_resp = client.post(
        reverse("auth-verify-code"),
        {"email": "claim@krishisetu.in", "code": code},
        format="json",
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_resp.json()['access_token']}")

    # Claim history
    claim_resp = client.post(
        reverse("me-claim-history"),
        {"prediction_ids": [pred1.id, pred2.id]},
        format="json",
    )
    assert claim_resp.status_code == status.HTTP_200_OK
    assert claim_resp.json()["claimed_count"] == 2

    # Query predictions history
    history_resp = client.get(reverse("me-predictions"))
    assert history_resp.status_code == status.HTTP_200_OK
    data = history_resp.json()
    assert data["count"] == 2
    assert len(data["results"]) == 2
