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
