# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| `v1.0.x` (`main`) | Yes |

## Reporting a Vulnerability
If you discover a security vulnerability in KrishiSetu AI, **please do not open a public GitHub issue** with exploit details.

Instead:
1. Use GitHub's **Private Vulnerability Reporting** ("Security" tab -> "Report a vulnerability") on this repository, or
2. Contact the repository maintainer directly via GitHub profile contact.

Please include:
- A clear description of the issue and affected endpoint/file.
- Steps to reproduce or a minimal proof-of-concept.
- Potential impact.

We aim to acknowledge reports within **72 hours** and provide a remediation plan or fix promptly.

## In-Scope Security Controls
- **No secrets in repository:** CI runs Gitleaks secret scanning on every push and PR.
- **Privacy by design:** Prediction records store only salted SHA-256 hashes of client IPs (never raw IPs). Chat content is not persisted by default (`CHAT_DEBUG_LOG_CONTENT=False`).
- **Rate limiting & spend guards:** Endpoint-scoped DRF throttling and daily `CHAT_DAILY_LIMIT` guards protect API and LLM quotas.
- **Production HTTP hardening:** HTTPS enforcement, HSTS, `Content-Security-Policy`, `Permissions-Policy`, `X-Content-Type-Options`, and non-default `ADMIN_URL` in `backend/config/settings/prod.py`.
- **AI safety guardrails:** Prompt-injection refusal, medical-advice refusal, out-of-scope redirection, and non-prescriptive pesticide advisory enforcement (`backend/apps/chat/safety.py`).
