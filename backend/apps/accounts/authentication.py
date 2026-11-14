"""
Cryptographic token authentication for KrishiSetu AI accounts.
Uses Django core TimestampSigner for zero-dependency, HMAC-SHA256 authenticated access tokens.
"""

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import User

SIGNER_SALT = "krishisetu-access-token"
ACCESS_TOKEN_LIFETIME_SECONDS = 900  # 15 minutes


def create_access_token(user: User) -> str:
    """Generate a signed, timestamped access token for the given user."""
    signer = TimestampSigner(salt=SIGNER_SALT)
    payload = {
        "user_id": user.pk,
        "email": user.email,
    }
    return signer.sign_object(payload)


def verify_access_token(token: str) -> dict:
    """Verify and decode a signed access token. Raises AuthenticationFailed on failure."""
    signer = TimestampSigner(salt=SIGNER_SALT)
    try:
        payload = signer.unsign_object(token, max_age=ACCESS_TOKEN_LIFETIME_SECONDS)
        return payload
    except SignatureExpired as e:
        raise AuthenticationFailed(
            {"code": "token_expired", "message": "Access token has expired."}
        ) from e
    except BadSignature as e:
        raise AuthenticationFailed(
            {"code": "token_invalid", "message": "Invalid or tampered access token."}
        ) from e


class JWTAuthentication(BaseAuthentication):
    """
    DRF Authentication class parsing 'Authorization: Bearer <token>' headers.
    """

    keyword = "Bearer"

    def authenticate_header(self, request):
        return self.keyword

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            return None

        raw_token = parts[1]
        payload = verify_access_token(raw_token)
        user_id = payload.get("user_id")

        try:
            user = User.objects.select_related("profile").get(
                pk=user_id, is_active=True
            )
        except User.DoesNotExist as e:
            raise AuthenticationFailed(
                {
                    "code": "user_not_found",
                    "message": "User account does not exist or is inactive.",
                }
            ) from e

        return (user, raw_token)


class JWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "apps.accounts.authentication.JWTAuthentication"
    name = "jwtAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
