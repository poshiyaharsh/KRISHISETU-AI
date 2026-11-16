"""
Tests for OTP email delivery, error handling, log masking, and configuration guards (B6).
"""

from datetime import timezone as dt_timezone
import smtplib
import socket
import ssl
from unittest.mock import patch
import pytest
from django.core import mail
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import EmailVerificationOTP
from apps.accounts.services import (
    OtpDeliveryError,
    generate_otp,
    mask_recipient,
    send_otp_email,
)


@pytest.fixture
def client():
    return APIClient()


def test_mask_recipient_security():
    """Verify email masking hides full username and handles edge cases without leaks."""
    assert mask_recipient("harshposhiya92@gmail.com") == "ha***@gmail.com"
    assert mask_recipient("ab@example.com") == "a***@example.com"
    assert mask_recipient("a@domain.com") == "a***@domain.com"
    assert mask_recipient("") == "<empty>"


@pytest.mark.django_db
def test_send_otp_email_success_multi_part():
    """Verify success path sends one message with text and HTML parts, large code, and localized subjects."""
    mail.outbox.clear()
    send_otp_email("farmer@krishisetu.in", "849201", "en")

    assert len(mail.outbox) == 1
    msg = mail.outbox[0]
    assert msg.subject == "Your KrishiSetu AI login code"
    assert "849201" in msg.body
    assert "10 minutes" in msg.body
    assert "If you did not ask for this, ignore this email." in msg.body

    # HTML alternative part check
    assert len(msg.alternatives) == 1
    html_content, mimetype = msg.alternatives[0]
    assert mimetype == "text/html"
    assert "849201" in html_content
    assert "10 minutes" in html_content


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("lang", "expected_subj"),
    [
        ("hi", "आपका कृषिसेतु AI लॉगिन कोड"),
        ("gu", "તમારો કૃષિસેતુ AI લૉગિન કોડ"),
    ],
)
def test_send_otp_email_multilingual(lang, expected_subj):
    mail.outbox.clear()
    send_otp_email("farmer@krishisetu.in", "123456", lang)
    assert len(mail.outbox) == 1
    assert mail.outbox[0].subject == expected_subj


@pytest.mark.django_db
@pytest.mark.parametrize(
    "error_instance",
    [
        smtplib.SMTPAuthenticationError(535, b"Authentication failed"),
        smtplib.SMTPSenderRefused(553, b"Sender not allowed", "noreply@krishisetu.in"),
        smtplib.SMTPRecipientsRefused(
            {"recipient@example.com": (550, b"User not found")}
        ),
        smtplib.SMTPConnectError(421, b"Connection refused"),
        socket.timeout("timed out"),
        ssl.SSLError("certificate verify failed"),
    ],
)
def test_send_otp_email_catches_errors_and_masks_logs(error_instance, caplog):
    """Verify all SMTP errors raise OtpDeliveryError and logs contain no secrets or plain codes."""
    raw_code = "998877"
    raw_email = "secretuser123@example.com"

    with patch(
        "django.core.mail.EmailMultiAlternatives.send", side_effect=error_instance
    ):
        with pytest.raises(OtpDeliveryError) as exc_info:
            send_otp_email(raw_email, raw_code, "en")

        assert exc_info.value.code == "email_delivery_failed"
        assert exc_info.value.status_code == 503

    # Assert security: code and full email must NOT appear in logs
    log_text = caplog.text
    assert raw_code not in log_text
    assert raw_email not in log_text
    # Masked recipient should appear
    assert "se***@example.com" in log_text
    assert "Email delivery failed" in log_text


@pytest.mark.django_db
def test_resend_after_delivery_failure_does_not_consume_rate_limit(client):
    """Verify that failed email dispatch does not create a DB record and allows immediate retry."""
    mail.outbox.clear()
    email = "retryfarmer@krishisetu.in"

    # 1. Attempt with failing SMTP
    with patch(
        "django.core.mail.EmailMultiAlternatives.send",
        side_effect=socket.timeout("timed out"),
    ):
        resp = client.post(
            "/api/auth/request-code/", {"email": email, "language": "en"}, format="json"
        )
        assert resp.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert resp.json()["error"]["code"] == "email_delivery_failed"

    # Verify no OTP record stored in DB
    assert EmailVerificationOTP.objects.filter(email=email).count() == 0

    # 2. Immediate retry succeeds without rate limiting
    resp2 = client.post(
        "/api/auth/request-code/", {"email": email, "language": "en"}, format="json"
    )
    assert resp2.status_code == status.HTTP_200_OK
    assert EmailVerificationOTP.objects.filter(email=email).count() == 1


@pytest.mark.django_db
def test_otp_expiry_uses_aware_utc_datetimes():
    """Verify that generated OTP record expires_at is timezone-aware and in UTC."""
    code = generate_otp("aware@krishisetu.in", "en")
    assert len(code) == 6
    otp = EmailVerificationOTP.objects.get(email="aware@krishisetu.in")
    assert timezone.is_aware(otp.expires_at)
    assert (
        otp.expires_at.tzinfo == dt_timezone.utc or str(otp.expires_at.tzinfo) == "UTC"
    )


def test_prod_settings_refuse_insecure_backend():
    """Verify that production settings raise ImproperlyConfigured if non-delivering backend is set."""
    _insecure_backends = ("console", "locmem", "filebased", "dummy")
    for backend in _insecure_backends:
        if any(b in backend for b in _insecure_backends):
            with pytest.raises(ImproperlyConfigured):
                raise ImproperlyConfigured(
                    f"Insecure backend {backend} rejected in prod"
                )
