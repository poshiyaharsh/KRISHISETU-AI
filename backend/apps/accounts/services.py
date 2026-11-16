"""
Core business logic and service layer for passwordless email OTP authentication.
"""

from datetime import timedelta
import hashlib
import logging
import secrets
import smtplib
import socket
import ssl
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

from .authentication import create_access_token
from .models import EmailVerificationOTP, FarmerProfile, RefreshToken, User

logger = logging.getLogger("krishisetu.accounts")

OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
HOURLY_RATE_LIMIT = 5
REFRESH_TOKEN_TTL_DAYS = 30

EMAIL_SUBJECTS = {
    "en": "Your KrishiSetu AI login code",
    "hi": "आपका कृषिसेतु AI लॉगिन कोड",
    "gu": "તમારો કૃષિસેતુ AI લૉગિન કોડ",
}

EMAIL_TEXT_BODIES = {
    "en": (
        "Namaste!\n\n"
        "Your login code for KrishiSetu AI is:\n\n"
        "  {code}\n\n"
        "This code is valid for 10 minutes.\n"
        "If you did not ask for this, ignore this email.\n\n"
        "— KrishiSetu AI"
    ),
    "hi": (
        "नमस्ते!\n\n"
        "कृषिसेतु AI के लिए आपका लॉगिन कोड है:\n\n"
        "  {code}\n\n"
        "यह कोड 10 मिनट के लिए मान्य है।\n"
        "यदि आपने यह अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा करें।\n\n"
        "— KrishiSetu AI"
    ),
    "gu": (
        "નમસ્તે!\n\n"
        "કૃષિસેતુ AI માટે તમારો લૉગિન કોડ છે:\n\n"
        "  {code}\n\n"
        "આ કોડ 10 મિનિટ માટે માન્ય છે.\n"
        "જો તમે આ માટે વિનંતી નથી કરી, તો આ ઈમેલને અવગણો.\n\n"
        "— KrishiSetu AI"
    ),
}

EMAIL_HTML_BODIES = {
    "en": (
        "<!DOCTYPE html>"
        "<html><body style='font-family: sans-serif; line-height: 1.6; color: #1D2B22; max-width: 500px; margin: 0 auto; padding: 24px;'>"
        "<h2 style='color: #0F4A32; margin-top: 0;'>Namaste!</h2>"
        "<p style='margin-bottom: 24px;'>Your login verification code for KrishiSetu AI is:</p>"
        "<div style='background-color: #E4ECDD; padding: 18px 24px; border-radius: 12px; text-align: center; margin: 24px 0;'>"
        "<span style='font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0F4A32;'>{code}</span>"
        "</div>"
        "<p style='font-size: 14px; color: #4D6854; margin-bottom: 8px;'>This code is valid for <strong>10 minutes</strong>.</p>"
        "<p style='font-size: 13px; color: #666;'>If you did not ask for this, ignore this email.</p>"
        "<hr style='border: none; border-top: 1px solid #E4ECDD; margin: 24px 0;' />"
        "<p style='font-size: 12px; color: #4D6854; margin: 0;'>KrishiSetu AI — Smarter Farming. Better Decisions. Brighter Tomorrow.</p>"
        "</body></html>"
    ),
    "hi": (
        "<!DOCTYPE html>"
        "<html><body style='font-family: sans-serif; line-height: 1.6; color: #1D2B22; max-width: 500px; margin: 0 auto; padding: 24px;'>"
        "<h2 style='color: #0F4A32; margin-top: 0;'>नमस्ते!</h2>"
        "<p style='margin-bottom: 24px;'>कृषिसेतु AI के लिए आपका लॉगिन सत्यापन कोड है:</p>"
        "<div style='background-color: #E4ECDD; padding: 18px 24px; border-radius: 12px; text-align: center; margin: 24px 0;'>"
        "<span style='font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0F4A32;'>{code}</span>"
        "</div>"
        "<p style='font-size: 14px; color: #4D6854; margin-bottom: 8px;'>यह कोड <strong>10 मिनट</strong> के लिए मान्य है।</p>"
        "<p style='font-size: 13px; color: #666;'>यदि आपने यह अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा करें।</p>"
        "<hr style='border: none; border-top: 1px solid #E4ECDD; margin: 24px 0;' />"
        "<p style='font-size: 12px; color: #4D6854; margin: 0;'>कृषिसेतु AI — बेहतर निर्णय, समृद्ध किसान।</p>"
        "</body></html>"
    ),
    "gu": (
        "<!DOCTYPE html>"
        "<html><body style='font-family: sans-serif; line-height: 1.6; color: #1D2B22; max-width: 500px; margin: 0 auto; padding: 24px;'>"
        "<h2 style='color: #0F4A32; margin-top: 0;'>નમસ્તે!</h2>"
        "<p style='margin-bottom: 24px;'>કૃષિસેતુ AI માટે તમારો લૉગિન વેરિફિકેશન કોડ છે:</p>"
        "<div style='background-color: #E4ECDD; padding: 18px 24px; border-radius: 12px; text-align: center; margin: 24px 0;'>"
        "<span style='font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0F4A32;'>{code}</span>"
        "</div>"
        "<p style='font-size: 14px; color: #4D6854; margin-bottom: 8px;'>આ કોડ <strong>10 મિનિટ</strong> માટે માન્ય છે.</p>"
        "<p style='font-size: 13px; color: #666;'>જો તમે આ માટે વિનંતી નથી કરી, તો આ ઈમેલને અવગણો.</p>"
        "<hr style='border: none; border-top: 1px solid #E4ECDD; margin: 24px 0;' />"
        "<p style='font-size: 12px; color: #4D6854; margin: 0;'>કૃષિસેતુ AI — સ્માર્ટ ખેતી, સમૃદ્ધ ખેડૂત.</p>"
        "</body></html>"
    ),
}


def mask_recipient(email_str: str) -> str:
    """Mask email for privacy and security in logs (e.g. ha***@gmail.com)."""
    if not email_str:
        return "<empty>"
    clean = email_str.strip().lower()
    if "@" not in clean:
        return f"set ({len(clean)} chars)"
    parts = clean.split("@", 1)
    user, domain = parts[0], parts[1]
    masked = f"{user[0]}***" if len(user) <= 2 else f"{user[:2]}***"
    return f"{masked}@{domain}"


class AuthException(Exception):
    """Base exception for authentication errors carrying a machine error code."""

    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class RateLimitedError(AuthException):
    def __init__(
        self,
        message: str = "Too many verification code requests. Please try again later.",
    ):
        super().__init__(code="rate_limited", message=message, status_code=429)


class CodeNotFoundError(AuthException):
    def __init__(
        self, message: str = "No active verification code found for this email."
    ):
        super().__init__(code="code_not_found", message=message, status_code=400)


class CodeExpiredError(AuthException):
    def __init__(
        self, message: str = "Verification code has expired. Please request a new code."
    ):
        super().__init__(code="code_expired", message=message, status_code=400)


class TooManyAttemptsError(AuthException):
    def __init__(
        self,
        message: str = "Maximum verification attempts exceeded. Please request a new code.",
    ):
        super().__init__(code="too_many_attempts", message=message, status_code=400)


class InvalidCodeError(AuthException):
    def __init__(self, message: str = "Invalid verification code."):
        super().__init__(code="invalid_code", message=message, status_code=400)


class InvalidRefreshTokenError(AuthException):
    def __init__(self, message: str = "Invalid, expired, or revoked refresh token."):
        super().__init__(code="invalid_refresh_token", message=message, status_code=401)


class OtpDeliveryError(AuthException):
    def __init__(
        self,
        code: str = "email_delivery_failed",
        message: str = "We could not send the email right now. Please try again in a few minutes.",
    ):
        super().__init__(code=code, message=message, status_code=503)


def send_otp_email(user_or_email: str, code: str, language: str = "en") -> None:
    """
    Renders multi-part plain text + HTML templates and sends OTP code with EMAIL_TIMEOUT.
    Logs structured error lines without leaking plain secrets or full email addresses.
    Raises OtpDeliveryError on any transport failure.
    """
    recipient = user_or_email.strip().lower()
    masked = mask_recipient(recipient)

    lang = language.lower()[:2]
    if lang not in EMAIL_SUBJECTS:
        lang = "en"

    subject = EMAIL_SUBJECTS[lang]
    text_content = EMAIL_TEXT_BODIES[lang].format(code=code)
    html_content = EMAIL_HTML_BODIES[lang].format(code=code)
    from_email = getattr(
        settings, "DEFAULT_FROM_EMAIL", "KrishiSetu AI <noreply@krishisetu.in>"
    )

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=from_email,
        to=[recipient],
    )
    msg.attach_alternative(html_content, "text/html")

    try:
        msg.send(fail_silently=False)
        logger.info("OTP email successfully dispatched to %s", masked)
    except smtplib.SMTPAuthenticationError as e:
        logger.error(
            "Email delivery failed: class=SMTPAuthenticationError smtp_code=%s recipient=%s",
            getattr(e, "smtp_code", 535),
            masked,
        )
        raise OtpDeliveryError("email_delivery_failed") from e
    except smtplib.SMTPSenderRefused as e:
        logger.error(
            "Email delivery failed: class=SMTPSenderRefused smtp_code=%s recipient=%s",
            getattr(e, "smtp_code", "unknown"),
            masked,
        )
        raise OtpDeliveryError("email_delivery_failed") from e
    except smtplib.SMTPRecipientsRefused as e:
        logger.error(
            "Email delivery failed: class=SMTPRecipientsRefused recipient=%s",
            masked,
        )
        raise OtpDeliveryError("email_delivery_failed") from e
    except smtplib.SMTPConnectError as e:
        logger.error(
            "Email delivery failed: class=SMTPConnectError recipient=%s",
            masked,
        )
        raise OtpDeliveryError("email_delivery_failed") from e
    except (socket.timeout, TimeoutError) as e:
        logger.error(
            "Email delivery failed: class=SocketTimeout recipient=%s",
            masked,
        )
        raise OtpDeliveryError("email_delivery_failed") from e
    except ssl.SSLError as e:
        logger.error(
            "Email delivery failed: class=SSLError recipient=%s",
            masked,
        )
        raise OtpDeliveryError("email_delivery_failed") from e
    except Exception as e:
        logger.error(
            "Email delivery failed: class=%s recipient=%s error=%s",
            type(e).__name__,
            masked,
            e,
        )
        raise OtpDeliveryError("email_delivery_failed") from e


def generate_otp(email: str, language: str = "en") -> str:
    """
    Generate a 6-digit OTP, deliver via email, and store its salted SHA-256 hash in DB.
    Enforces hourly rate limits and invalidates prior unused codes.
    Crucial: Saves DB record ONLY after successful email dispatch so failures do not consume limits.
    """
    normalized_email = email.lower().strip()
    now = timezone.now()
    one_hour_ago = now - timedelta(hours=1)

    # 1. Rate Limit Check (5 requests per hour per email)
    recent_requests = EmailVerificationOTP.objects.filter(
        email=normalized_email,
        created_at__gte=one_hour_ago,
    ).count()
    if recent_requests >= HOURLY_RATE_LIMIT:
        logger.warning(
            "Auth rate limit exceeded for email: %s", mask_recipient(normalized_email)
        )
        raise RateLimitedError()

    # 2. Invalidate previous unused codes for this email
    EmailVerificationOTP.objects.filter(email=normalized_email, is_used=False).update(
        is_used=True
    )

    # 3. Generate 6-digit code and cryptographic salt
    code = str(secrets.randbelow(900000) + 100000)
    salt = secrets.token_hex(16)
    code_hash = hashlib.sha256(f"{salt}:{code}".encode()).hexdigest()
    expires_at = now + timedelta(minutes=OTP_TTL_MINUTES)

    # 4. Dispatch email first; raises OtpDeliveryError on failure (no DB record saved)
    send_otp_email(normalized_email, code, language)

    # 5. Save hashed record to DB only after successful delivery
    EmailVerificationOTP.objects.create(
        email=normalized_email,
        salt=salt,
        code_hash=code_hash,
        expires_at=expires_at,
    )

    if settings.DEBUG:
        logger.info(
            "[KRISHISETU OTP] Code generated for %s", mask_recipient(normalized_email)
        )

    return code


def create_refresh_token_record(user: User) -> str:
    """Generate a high-entropy 64-char refresh token, hash it, and save in DB."""
    raw_token = secrets.token_hex(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = timezone.now() + timedelta(days=REFRESH_TOKEN_TTL_DAYS)

    RefreshToken.objects.create(
        user=user,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    return raw_token


def verify_otp(email: str, code: str, language: str = "en") -> tuple[User, str, str]:
    """
    Verify the 6-digit OTP against active database hash in constant time.
    Tracks failed attempts and invalidates on max attempts (5) or expiration (10 min).
    Returns user, short-lived access token, and long-lived refresh token.
    """
    normalized_email = email.lower().strip()
    now = timezone.now()

    otp_record = (
        EmailVerificationOTP.objects.filter(
            email=normalized_email,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )

    if not otp_record:
        logger.warning(
            "Verification attempted with no active code: %s",
            mask_recipient(normalized_email),
        )
        raise CodeNotFoundError()

    if otp_record.attempts >= OTP_MAX_ATTEMPTS:
        otp_record.is_used = True
        otp_record.save(update_fields=["is_used"])
        logger.warning(
            "Verification code attempts exceeded for %s",
            mask_recipient(normalized_email),
        )
        raise TooManyAttemptsError()

    if now > otp_record.expires_at:
        otp_record.is_used = True
        otp_record.save(update_fields=["is_used"])
        logger.warning(
            "Verification code expired for %s", mask_recipient(normalized_email)
        )
        raise CodeExpiredError()

    computed_hash = hashlib.sha256(f"{otp_record.salt}:{code}".encode()).hexdigest()
    if not secrets.compare_digest(computed_hash, otp_record.code_hash):
        otp_record.attempts += 1
        if otp_record.attempts >= OTP_MAX_ATTEMPTS:
            otp_record.is_used = True
        otp_record.save(update_fields=["attempts", "is_used"])
        logger.warning(
            "Invalid OTP attempt (%d/%d) for %s",
            otp_record.attempts,
            OTP_MAX_ATTEMPTS,
            mask_recipient(normalized_email),
        )
        raise InvalidCodeError()

    otp_record.is_used = True
    otp_record.save(update_fields=["is_used"])

    user, created = User.objects.get_or_create(email=normalized_email)
    user.last_login = now
    if created or user.consented_at is None:
        user.consented_at = now
    user.save(update_fields=["last_login", "consented_at"])

    if created:
        FarmerProfile.objects.create(
            user=user,
            display_name=normalized_email.split("@")[0],
            preferred_language=language[:2],
        )
        logger.info(
            "New farmer registered via passwordless email: %s",
            mask_recipient(normalized_email),
        )

    access_token = create_access_token(user)
    refresh_token = create_refresh_token_record(user)

    return user, access_token, refresh_token


def rotate_refresh_token(raw_refresh_token: str) -> tuple[str, str]:
    """
    Rotates a refresh token: verifies and revokes old token, returns new access & refresh tokens.
    Protects against reuse attacks.
    """
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    now = timezone.now()

    token_record = (
        RefreshToken.objects.select_related("user")
        .filter(
            token_hash=token_hash,
            is_revoked=False,
            expires_at__gt=now,
        )
        .first()
    )

    if not token_record:
        logger.warning("Invalid or expired refresh token attempted")
        raise InvalidRefreshTokenError()

    token_record.is_revoked = True
    token_record.save(update_fields=["is_revoked"])

    new_refresh_token = create_refresh_token_record(token_record.user)
    new_access_token = create_access_token(token_record.user)

    return new_access_token, new_refresh_token


def revoke_refresh_token(raw_refresh_token: str) -> None:
    """Explicitly revokes a refresh token on logout."""
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    RefreshToken.objects.filter(token_hash=token_hash, is_revoked=False).update(
        is_revoked=True
    )
