"""
Core business logic and service layer for passwordless email OTP authentication.
"""

from datetime import timedelta
import hashlib
import logging
import secrets
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .authentication import create_access_token
from .models import EmailVerificationOTP, FarmerProfile, RefreshToken, User

logger = logging.getLogger("krishisetu.accounts")

OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
HOURLY_RATE_LIMIT = 5
REFRESH_TOKEN_TTL_DAYS = 30

EMAIL_SUBJECTS = {
    "en": "Your KrishiSetu AI Verification Code",
    "hi": "आपका कृषिसेतु AI सत्यापन कोड",
    "gu": "તમારો કૃષિસેતુ AI વેરિફિકેશન કોડ",
}

EMAIL_BODIES = {
    "en": (
        "Namaste!\n\n"
        "Your verification code for KrishiSetu AI is:\n\n"
        "  {code}\n\n"
        "This code is valid for 10 minutes. For your security, do not share this code with anyone.\n\n"
        "— Team KrishiSetu AI"
    ),
    "hi": (
        "नमस्ते!\n\n"
        "कृषिसेतु AI के लिए आपका सत्यापन कोड है:\n\n"
        "  {code}\n\n"
        "यह कोड 10 मिनट के लिए मान्य है। अपनी सुरक्षा के लिए, यह कोड किसी के साथ साझा न करें।\n\n"
        "— टीम कृषिसेतु AI"
    ),
    "gu": (
        "નમસ્તે!\n\n"
        "કૃષિસેતુ AI માટે તમારો વેરિફિકેશન કોડ છે:\n\n"
        "  {code}\n\n"
        "આ કોડ 10 મિનિટ માટે માન્ય છે. તમારી સુરક્ષા માટે, આ કોડ કોઈની સાથે શેર કરશો નહીં.\n\n"
        "— ટીમ કૃષિસેતુ AI"
    ),
}


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


def generate_otp(email: str, language: str = "en") -> str:
    """
    Generate a 6-digit OTP, store its salted SHA-256 hash, and deliver via email.
    Enforces hourly rate limits and invalidates prior unused codes.
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
        logger.warning("Auth rate limit exceeded for email: %s", normalized_email)
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

    # 4. Save hashed record to DB
    EmailVerificationOTP.objects.create(
        email=normalized_email,
        salt=salt,
        code_hash=code_hash,
        expires_at=expires_at,
    )

    # 5. Dispatch email
    lang = language.lower()[:2]
    if lang not in EMAIL_SUBJECTS:
        lang = "en"

    subject = EMAIL_SUBJECTS[lang]
    body = EMAIL_BODIES[lang].format(code=code)
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@krishisetu.in")

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[normalized_email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error("Failed to send verification email to %s: %s", normalized_email, e)

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
    Verify the submitted 6-digit code against the latest active OTP hash.
    Returns (user, access_token, refresh_token).
    """
    normalized_email = email.lower().strip()
    now = timezone.now()

    # 1. Lookup latest OTP record for this email
    otp = EmailVerificationOTP.objects.filter(
        email=normalized_email, is_used=False
    ).first()
    if not otp:
        raise CodeNotFoundError()

    # 2. Check Expiration
    if otp.expires_at < now:
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        raise CodeExpiredError()

    # 3. Check Attempt Limit
    if otp.attempts >= OTP_MAX_ATTEMPTS:
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        raise TooManyAttemptsError()

    # 4. Constant-Time Hash Comparison
    expected_hash = hashlib.sha256(f"{otp.salt}:{code.strip()}".encode()).hexdigest()
    if not secrets.compare_digest(expected_hash, otp.code_hash):
        otp.attempts += 1
        if otp.attempts >= OTP_MAX_ATTEMPTS:
            otp.is_used = True
        otp.save(update_fields=["attempts", "is_used"])
        raise InvalidCodeError()

    # 5. Success: Consume OTP
    otp.is_used = True
    otp.save(update_fields=["is_used"])

    # 6. Retrieve or Register User
    user, created = User.objects.get_or_create(
        email=normalized_email,
        defaults={
            "is_active": True,
            "consented_at": now,
            "consent_version": "1.0",
        },
    )

    user.last_login = now
    user.save(update_fields=["last_login"])

    # 7. Ensure FarmerProfile exists
    preferred_lang = language.lower()[:2] if language else "en"
    FarmerProfile.objects.get_or_create(
        user=user,
        defaults={"preferred_language": preferred_lang},
    )

    # 8. Issue Token Pair
    access_token = create_access_token(user)
    refresh_token = create_refresh_token_record(user)

    return user, access_token, refresh_token


def rotate_refresh_token(raw_refresh_token: str) -> tuple[str, str]:
    """
    Validate refresh token, revoke old token, and issue new (access_token, refresh_token) pair.
    """
    token_hash = hashlib.sha256(raw_refresh_token.strip().encode()).hexdigest()
    now = timezone.now()

    token_obj = (
        RefreshToken.objects.select_related("user")
        .filter(
            token_hash=token_hash,
            is_revoked=False,
            expires_at__gte=now,
        )
        .first()
    )

    if not token_obj or not token_obj.user.is_active:
        raise InvalidRefreshTokenError()

    # Revoke current refresh token
    token_obj.is_revoked = True
    token_obj.save(update_fields=["is_revoked"])

    # Issue new token pair
    new_access_token = create_access_token(token_obj.user)
    new_refresh_token = create_refresh_token_record(token_obj.user)

    return new_access_token, new_refresh_token


def revoke_refresh_token(raw_refresh_token: str) -> None:
    """Revoke a refresh token on logout."""
    token_hash = hashlib.sha256(raw_refresh_token.strip().encode()).hexdigest()
    RefreshToken.objects.filter(token_hash=token_hash).update(is_revoked=True)
