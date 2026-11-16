"""
Management command to send a single test email through the active email backend.
Catches specific SMTP and socket exceptions with diagnostic human hints.
Never prints passwords or sensitive tokens.
"""

import smtplib
import socket
import ssl
from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Dispatch a single plain-text test email to verify SMTP transport."

    def add_arguments(self, parser):
        parser.add_argument(
            "--to",
            type=str,
            required=True,
            help="Recipient email address for the test message.",
        )

    def handle(self, *args, **options):
        recipient = options["to"].strip()
        if not recipient or "@" not in recipient:
            raise CommandError(
                "Please provide a valid recipient email address with --to."
            )

        self.stdout.write(
            self.style.MIGRATE_HEADING(f"=== Sending Test Email to {recipient} ===")
        )
        self.stdout.write(
            f"Active EMAIL_BACKEND : {getattr(settings, 'EMAIL_BACKEND', 'unknown')}"
        )
        self.stdout.write(
            f"Active EMAIL_HOST    : {getattr(settings, 'EMAIL_HOST', 'unknown')}:{getattr(settings, 'EMAIL_PORT', 'unknown')}"
        )

        subject = "KrishiSetu AI: SMTP Connectivity Test"
        message = (
            "Namaste!\n\n"
            "This is a test email sent from KrishiSetu AI to verify your email delivery configuration.\n"
            "If you received this message, your outbound mail transport is working properly.\n\n"
            "— Team KrishiSetu AI"
        )
        from_email = getattr(
            settings, "DEFAULT_FROM_EMAIL", "KrishiSetu AI <noreply@krishisetu.in>"
        )

        try:
            sent_count = send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[recipient],
                fail_silently=False,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n[SUCCESS] Test email dispatched successfully! (sent count: {sent_count})"
                )
            )
            self.stdout.write(
                "Please check the inbox and spam/promotions folder of the recipient address.\n"
            )

        except smtplib.SMTPAuthenticationError as e:
            code = getattr(e, "smtp_code", 535)
            err_msg = str(e)
            self.stdout.write(
                self.style.ERROR(
                    f"\n[FAIL] SMTPAuthenticationError ({code}): {err_msg}"
                )
            )
            if code == 535 or "5.7.8" in err_msg:
                self.stdout.write(
                    self.style.WARNING(
                        "Hint: Authentication failed. If using Gmail, you must use a 16-character Google App Password (not your account password) and 2-Step Verification must be enabled."
                    )
                )
            elif code == 534 or "5.7.9" in err_msg:
                self.stdout.write(
                    self.style.WARNING(
                        "Hint: Application-specific password required. Check Google Account -> Security -> App Passwords."
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        "Hint: Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in your environment."
                    )
                )

        except smtplib.SMTPSenderRefused as e:
            self.stdout.write(
                self.style.ERROR(
                    f"\n[FAIL] SMTPSenderRefused ({getattr(e, 'smtp_code', 'unknown')}): {e}"
                )
            )
            self.stdout.write(
                self.style.WARNING(
                    "Hint: The mail server refused DEFAULT_FROM_EMAIL. Set DEFAULT_FROM_EMAIL to match EMAIL_HOST_USER."
                )
            )

        except smtplib.SMTPRecipientsRefused as e:
            self.stdout.write(self.style.ERROR(f"\n[FAIL] SMTPRecipientsRefused: {e}"))
            self.stdout.write(
                self.style.WARNING(
                    "Hint: The recipient address was rejected by the mail server."
                )
            )

        except smtplib.SMTPConnectError as e:
            self.stdout.write(self.style.ERROR(f"\n[FAIL] SMTPConnectError: {e}"))
            self.stdout.write(
                self.style.WARNING(
                    "Hint: Could not connect to SMTP host. Outbound ports 25, 465, or 587 may be blocked by your hosting provider (e.g. Render Free Tier blocks outbound SMTP)."
                )
            )

        except socket.timeout:
            self.stdout.write(
                self.style.ERROR("\n[FAIL] Connection Timeout (socket.timeout)")
            )
            self.stdout.write(
                self.style.WARNING(
                    "Hint: The SMTP connection timed out. On cloud hosts like Render Free Tier, outbound connections on port 587 and 465 are blocked by firewall."
                )
            )

        except ssl.SSLError as e:
            self.stdout.write(self.style.ERROR(f"\n[FAIL] SSLError: {e}"))
            self.stdout.write(
                self.style.WARNING(
                    "Hint: SSL handshake failed. Check port vs protocol: Port 587 uses EMAIL_USE_TLS=True, EMAIL_USE_SSL=False. Port 465 uses EMAIL_USE_SSL=True, EMAIL_USE_TLS=False."
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"\n[FAIL] Unexpected Error ({type(e).__name__}): {e}")
            )
            self.stdout.write(
                self.style.WARNING(
                    "Hint: Verify network connectivity, proxy settings, and environment variables."
                )
            )
