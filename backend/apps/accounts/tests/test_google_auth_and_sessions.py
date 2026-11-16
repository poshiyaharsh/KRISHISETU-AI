"""
Tests for Google OAuth verification, account linking, session cookies, CSRF protection,
token family rotation, reuse detection, and account deletion (Step 2, 3, 5).
"""

from unittest.mock import patch
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import AuthEvent, RefreshToken, SocialIdentity, User
from apps.accounts.services import create_refresh_token_record, rotate_refresh_token


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
def test_google_auth_success_new_user(client):
    """Verify Google sign-in registers a new farmer, sets email_verified=True, creates SocialIdentity and sets cookie."""
    url = reverse("auth-google")
    mock_payload = {
        "sub": "google-sub-12345",
        "email": "googlefarmer@example.com",
        "name": "Ramesh Patel",
        "email_verified": True,
        "iss": "accounts.google.com",
        "aud": "1234567890-testclientid.apps.googleusercontent.com",
    }

    with patch("apps.accounts.views.verify_google_credential", return_value=mock_payload):
        resp = client.post(
            url,
            {"credential": "mock-valid-google-jwt", "client_type": "web", "language": "gu"},
            format="json",
        )

    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["status"] == "ok"
    assert "access_token" in data
    assert data["user"]["email"] == "googlefarmer@example.com"
    assert data["user"]["email_verified"] is True
    assert data["user"]["profile"]["display_name"] == "Ramesh Patel"
    assert data["user"]["profile"]["preferred_language"] == "gu"

    # Verify SocialIdentity was created
    social = SocialIdentity.objects.get(provider="google", subject="google-sub-12345")
    assert social.user.email == "googlefarmer@example.com"

    # Verify cookie was set for web client
    assert "krishisetu_rf" in resp.cookies
    assert resp.cookies["krishisetu_rf"]["httponly"] is True
    assert resp.cookies["krishisetu_rf"]["samesite"] == "Lax"

    # Verify AuthEvent was logged
    event = AuthEvent.objects.filter(event_type="google_signup").first()
    assert event is not None
    assert event.user.email == "googlefarmer@example.com"


@pytest.mark.django_db
def test_google_auth_mobile_client_returns_refresh_token_in_body(client):
    """Verify mobile client receives refresh token in JSON body instead of cookie."""
    url = reverse("auth-google")
    mock_payload = {
        "sub": "google-sub-mobile-999",
        "email": "mobile@example.com",
        "email_verified": True,
        "iss": "https://accounts.google.com",
        "aud": "1234567890-testclientid.apps.googleusercontent.com",
    }

    with patch("apps.accounts.views.verify_google_credential", return_value=mock_payload):
        resp = client.post(
            url,
            {"credential": "mock-valid-google-jwt", "client_type": "mobile"},
            format="json",
        )

    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert "refresh_token" in data
    assert len(data["refresh_token"]) > 32
    assert "krishisetu_rf" not in resp.cookies


@pytest.mark.django_db
def test_google_auth_account_linking_to_verified_email(client):
    """Verify Google sign-in links to existing account when email is already verified."""
    existing_user = User.objects.create(
        email="verified@example.com", email_verified=True, is_active=True
    )
    url = reverse("auth-google")
    mock_payload = {
        "sub": "google-sub-linked-777",
        "email": "verified@example.com",
        "email_verified": True,
        "iss": "accounts.google.com",
        "aud": "1234567890-testclientid.apps.googleusercontent.com",
    }

    with patch("apps.accounts.views.verify_google_credential", return_value=mock_payload):
        resp = client.post(
            url,
            {"credential": "mock-valid-jwt", "client_type": "web"},
            format="json",
        )

    assert resp.status_code == status.HTTP_200_OK
    social = SocialIdentity.objects.get(provider="google", subject="google-sub-linked-777")
    assert social.user == existing_user
    assert AuthEvent.objects.filter(event_type="account_linked", user=existing_user).exists()


@pytest.mark.django_db
def test_google_auth_refuses_linking_to_unverified_email(client):
    """Verify Google sign-in rejects linking if the existing user's email was not verified."""
    User.objects.create(
        email="unverified@example.com", email_verified=False, is_active=True
    )
    url = reverse("auth-google")
    mock_payload = {
        "sub": "google-sub-malicious-444",
        "email": "unverified@example.com",
        "email_verified": True,
        "iss": "accounts.google.com",
        "aud": "1234567890-testclientid.apps.googleusercontent.com",
    }

    with patch("apps.accounts.views.verify_google_credential", return_value=mock_payload):
        resp = client.post(
            url,
            {"credential": "mock-valid-jwt", "client_type": "web"},
            format="json",
        )

    assert resp.status_code == status.HTTP_400_BAD_REQUEST
    assert resp.json()["error"]["code"] == "unverified_email_linking_forbidden"
    assert not SocialIdentity.objects.filter(subject="google-sub-malicious-444").exists()


@pytest.mark.django_db
def test_google_auth_token_validation_failures(client):
    """Verify rejection on unverified google email, wrong audience, or invalid issuer."""
    from apps.accounts.services import verify_google_credential, AuthException

    # 1. email_verified false
    with pytest.raises(AuthException) as exc:
        with patch("google.oauth2.id_token.verify_oauth2_token", return_value={"sub": "123", "email": "a@b.com", "email_verified": False, "iss": "accounts.google.com", "aud": "1234567890-testclientid.apps.googleusercontent.com"}):
            verify_google_credential("token")
    assert exc.value.code == "unverified_google_email"

    # 2. invalid issuer
    with pytest.raises(AuthException) as exc:
        with patch("google.oauth2.id_token.verify_oauth2_token", return_value={"sub": "123", "email": "a@b.com", "email_verified": True, "iss": "malicious-issuer.com", "aud": "1234567890-testclientid.apps.googleusercontent.com"}):
            verify_google_credential("token")
    assert exc.value.code == "invalid_issuer"

    # 3. audience mismatch
    with pytest.raises(AuthException) as exc:
        with patch("google.oauth2.id_token.verify_oauth2_token", return_value={"sub": "123", "email": "a@b.com", "email_verified": True, "iss": "accounts.google.com", "aud": "wrong-client-id.apps.googleusercontent.com"}):
            verify_google_credential("token")
    assert exc.value.code == "audience_mismatch"


@pytest.mark.django_db
def test_refresh_token_family_rotation_and_reuse_detection(client):
    """Verify refresh token rotation updates family and revokes all tokens on reuse detection."""
    user = User.objects.create(email="family@example.com", is_active=True)
    raw_token_1 = create_refresh_token_record(user)

    # 1. First rotation succeeds
    access_1, raw_token_2 = rotate_refresh_token(raw_token_1)
    assert access_1 is not None
    assert raw_token_2 != raw_token_1

    # 2. Reusing raw_token_1 (the revoked token) triggers REUSE DETECTION
    with pytest.raises(Exception) as exc:
        rotate_refresh_token(raw_token_1)
    assert "reuse detected" in str(exc.value).lower()

    # Verify that raw_token_2 is now ALSO revoked as a safety measure
    with pytest.raises(Exception):
        rotate_refresh_token(raw_token_2)

    # All tokens in that family should be marked is_revoked=True
    assert RefreshToken.objects.filter(user=user, is_revoked=False).count() == 0
    assert AuthEvent.objects.filter(event_type="token_reuse_detected", user=user).exists()


@pytest.mark.django_db
def test_cookie_refresh_csrf_protection(client):
    """Verify cookie-based refresh endpoint requires custom header to prevent CSRF."""
    user = User.objects.create(email="cookie@example.com", is_active=True)
    raw_token = create_refresh_token_record(user)

    url = reverse("auth-refresh")
    client.cookies["krishisetu_rf"] = raw_token

    # 1. Missing custom header -> HTTP 403 CSRF rejected
    resp_no_header = client.post(url, {}, format="json")
    assert resp_no_header.status_code == status.HTTP_403_FORBIDDEN
    assert resp_no_header.json()["error"]["code"] == "csrf_rejected"

    # 2. With custom header X-KrishiSetu-Client -> HTTP 200 OK and rotates cookie
    resp_with_header = client.post(
        url, {}, format="json", HTTP_X_KRISHISETU_CLIENT="web"
    )
    assert resp_with_header.status_code == status.HTTP_200_OK
    assert "access_token" in resp_with_header.json()
    assert "krishisetu_rf" in resp_with_header.cookies


@pytest.mark.django_db
def test_logout_everywhere_revokes_all_sessions(client):
    """Verify POST /api/auth/logout-everywhere/ revokes all active refresh tokens for user."""
    from apps.accounts.authentication import create_access_token

    user = User.objects.create(email="omni@example.com", is_active=True)
    t1 = create_refresh_token_record(user)
    t2 = create_refresh_token_record(user)
    assert RefreshToken.objects.filter(user=user, is_revoked=False).count() == 2

    access = create_access_token(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    url = reverse("auth-logout-everywhere")
    resp = client.post(url, format="json")
    assert resp.status_code == status.HTTP_200_OK
    assert RefreshToken.objects.filter(user=user, is_revoked=False).count() == 0
    assert AuthEvent.objects.filter(event_type="logout_everywhere", user=user).exists()


@pytest.mark.django_db
def test_delete_user_account_erasure(client):
    """Verify DELETE /api/me/ permanently erases user, profile, plots, tokens under DPDP Act 2023."""
    from apps.accounts.authentication import create_access_token
    from apps.accounts.models import FarmerProfile

    user = User.objects.create(email="erasure@example.com", is_active=True)
    FarmerProfile.objects.create(user=user, display_name="To Delete")
    create_refresh_token_record(user)

    access = create_access_token(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    url = reverse("me-detail")
    resp = client.delete(url)
    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert not User.objects.filter(email="erasure@example.com").exists()
    assert AuthEvent.objects.filter(event_type="account_deleted").exists()
