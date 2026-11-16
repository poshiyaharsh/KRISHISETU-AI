"""
Management command to inspect email and SMTP settings without exposing credentials.
"""

from django.conf import settings
from django.core.management.base import BaseCommand


def mask_email(email_str: str) -> str:
    """Mask email as ha***@gmail.com for security."""
    if not email_str:
        return "<empty>"
    email_clean = email_str.strip()
    if "@" not in email_clean:
        return f"set ({len(email_clean)} chars)"
    parts = email_clean.split("@", 1)
    user, domain = parts[0], parts[1]
    if len(user) <= 2:
        masked_user = f"{user[0]}***"
    else:
        masked_user = f"{user[:2]}***"
    return f"{masked_user}@{domain}"


class Command(BaseCommand):
    help = "Inspect Django email configuration and report SMTP diagnostics with secrets masked."

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                "=== KrishiSetu AI: Email Configuration Audit ==="
            )
        )

        settings_mod = getattr(settings, "SETTINGS_MODULE", "unknown")
        email_backend = getattr(
            settings, "EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend"
        )
        email_provider = getattr(settings, "EMAIL_PROVIDER", "smtp")
        brevo_key = getattr(settings, "BREVO_API_KEY", "")
        resend_key = getattr(settings, "RESEND_API_KEY", "")
        google_clients = getattr(settings, "GOOGLE_OAUTH_CLIENT_IDS", [])
        email_host = getattr(settings, "EMAIL_HOST", "")
        email_port = getattr(settings, "EMAIL_PORT", 587)
        use_tls = getattr(settings, "EMAIL_USE_TLS", False)
        use_ssl = getattr(settings, "EMAIL_USE_SSL", False)
        email_timeout = getattr(settings, "EMAIL_TIMEOUT", None)
        email_user = getattr(settings, "EMAIL_HOST_USER", "")
        email_password = getattr(settings, "EMAIL_HOST_PASSWORD", "")
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "")
        debug = getattr(settings, "DEBUG", False)

        # 1. Print configuration table
        self.stdout.write(f"Settings Module      : {settings_mod}")
        self.stdout.write(f"DEBUG Mode           : {debug}")
        self.stdout.write(f"EMAIL_PROVIDER       : {email_provider}")
        self.stdout.write(f"EMAIL_BACKEND        : {email_backend}")
        if email_provider == "brevo":
            self.stdout.write(
                f"BREVO_API_KEY        : {'set (' + str(len(brevo_key)) + ' chars)' if brevo_key else '<missing>'}"
            )
        elif email_provider == "resend":
            self.stdout.write(
                f"RESEND_API_KEY       : {'set (' + str(len(resend_key)) + ' chars)' if resend_key else '<missing>'}"
            )
        self.stdout.write(
            f"GOOGLE CLIENT IDS    : {len(google_clients)} client(s) configured"
        )
        self.stdout.write(f"EMAIL_HOST           : {email_host or '<not configured>'}")
        self.stdout.write(f"EMAIL_PORT           : {email_port}")
        self.stdout.write(f"EMAIL_USE_TLS        : {use_tls}")
        self.stdout.write(f"EMAIL_USE_SSL        : {use_ssl}")
        self.stdout.write(
            f"EMAIL_TIMEOUT        : {email_timeout}s"
            if email_timeout
            else "EMAIL_TIMEOUT        : None (default socket timeout)"
        )
        self.stdout.write(f"EMAIL_HOST_USER      : {mask_email(email_user)}")
        if email_password:
            self.stdout.write(
                f"EMAIL_HOST_PASSWORD  : set ({len(email_password)} chars)"
            )
        else:
            self.stdout.write("EMAIL_HOST_PASSWORD  : <missing / empty>")
        self.stdout.write(f"DEFAULT_FROM_EMAIL   : {from_email}")
        self.stdout.write("-" * 50)

        # 2. Diagnostics
        issues = []
        warnings = []

        is_smtp = "smtp" in email_backend.lower()
        if not is_smtp:
            if "console" in email_backend.lower():
                warnings.append(
                    "EMAIL_BACKEND is set to console. Emails are printed to stdout, not delivered over SMTP."
                )
            elif "locmem" in email_backend.lower():
                warnings.append(
                    "EMAIL_BACKEND is set to locmem (in-memory test outbox)."
                )
            elif (
                "dummy" in email_backend.lower() or "filebased" in email_backend.lower()
            ):
                warnings.append(
                    f"EMAIL_BACKEND is {email_backend}. Emails will not reach recipients."
                )

        if is_smtp:
            if not email_host:
                issues.append("EMAIL_HOST is empty. Cannot establish SMTP connection.")
            if not email_user:
                issues.append(
                    "EMAIL_HOST_USER is empty. SMTP authentication requires a username/email."
                )
            if not email_password:
                issues.append(
                    "EMAIL_HOST_PASSWORD is empty. SMTP authentication requires an app password or token."
                )

            if use_tls and use_ssl:
                issues.append(
                    "Both EMAIL_USE_TLS and EMAIL_USE_SSL are True. Choose either TLS (port 587) or SSL (port 465)."
                )

            if email_port == 587 and not use_tls:
                warnings.append(
                    "Port 587 typically expects EMAIL_USE_TLS = True (STARTTLS)."
                )
            elif email_port == 465 and not use_ssl:
                warnings.append(
                    "Port 465 typically expects EMAIL_USE_SSL = True (implicit SSL)."
                )

            if "gmail.com" in (email_host or "").lower():
                if email_port != 587 or not use_tls or use_ssl:
                    warnings.append(
                        "Gmail SMTP standard setting is Port 587 with EMAIL_USE_TLS=True, EMAIL_USE_SSL=False."
                    )
                if email_password and " " in email_password:
                    issues.append(
                        "EMAIL_HOST_PASSWORD contains whitespace. Google App Passwords must be entered without spaces."
                    )
                if email_password and len(email_password.strip()) != 16:
                    warnings.append(
                        "Google App Passwords are normally 16 characters. Ensure 2-Step Verification App Password is used."
                    )

            if (
                email_user
                and from_email
                and email_user.lower() not in from_email.lower()
            ):
                warnings.append(
                    "DEFAULT_FROM_EMAIL address differs from EMAIL_HOST_USER. Some SMTP providers (like Gmail) reject or rewrite this."
                )

        if not email_timeout or email_timeout > 10:
            warnings.append(
                f"EMAIL_TIMEOUT is {email_timeout}. Consider setting EMAIL_TIMEOUT = 5 or 10 to avoid request hangs."
            )

        # 3. Report Results
        if issues:
            self.stdout.write(
                self.style.ERROR("\n[FAIL] Configuration Issues Detected:")
            )
            for issue in issues:
                self.stdout.write(self.style.ERROR(f"  • {issue}"))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    "\n[OK] No critical configuration syntax errors detected."
                )
            )

        if warnings:
            self.stdout.write(
                self.style.WARNING("\n[WARN] Important Warnings / Recommendations:")
            )
            for warn in warnings:
                self.stdout.write(self.style.WARNING(f"  • {warn}"))

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                "================================================"
            )
        )
