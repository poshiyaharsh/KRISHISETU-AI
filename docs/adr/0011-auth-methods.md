# ADR 0011: Authentication Methods and Session Architecture for Free-Tier Cloud Hosting

**Status:** Accepted  
**Date:** 2026-11-16  
**Deciders:** Product Owner, Engineering Team  
**Consulted:** AGENTS.md, Phase 13 Architecture, India DPDP Act 2023 Guidelines

---

## 1. Context & Problem Statement

KrishiSetu AI was initially designed with passwordless Email OTP using standard SMTP (`smtp.gmail.com:587`). During Phase 13 deployment to Render Free Web Services, live delivery completely failed.

### The Hosting Platform Limitation
According to official Render documentation ([Render Free Web Services](https://render.com/docs/free#free-web-services), updated November 2026):
> *"Render Free Web Services block all outbound traffic on ports 25, 465, and 587 to prevent spam abuse."*

Any TCP connection attempted from a Render free instance to `smtp.gmail.com:587` is silently dropped by the hosting firewall, hanging until socket timeout (10–12 seconds) and raising `socket.timeout` or `ConnectionRefusedError`.

The product requires authentication methods that:
1. Operate reliably on zero-cost free-tier hosting (Render free web service + Vercel frontend).
2. Minimize farmer friction in rural and semi-urban India.
3. Protect user data under the India Digital Personal Data Protection (DPDP) Act, 2023.
4. Allow instant, unauthenticated "Guest Mode" for all agricultural advisory tools.

---

## 2. Options Considered

| Method | Free-Tier Feasibility | India Farmer Ergonomics | Costs & Compliance | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Google Sign-In (OAuth2 / GIS)** | **100% Free** (Google Cloud Identity Services free tier, no credit card required) | Extremely high on Android smartphones (every Android farmer has a Google account) | Zero SMS costs; zero template approvals; built-in phishing resistance | **Selected: Primary Web & Mobile Login** |
| **Email Code via HTTP API (Brevo / Resend)** | **100% Free** (Brevo 300 emails/day; Resend 100 emails/day; communicates over HTTPS port 443) | Good fallback for farmers preferring email or without Google Play services | Bypasses Render port blocks completely; zero spam port restrictions | **Selected: Secondary Login** |
| **Continue as Guest** | **100% Free** | Immediate access without login or barriers | Full functionality; farm advice, weather, nutrition, and schemes accessible; local history claimable later | **Selected: Always Available** |
| **Phone OTP (SMS)** | Not viable on zero budget | High reach across non-smartphones | **Blocked by India DLT regulations**: TRAI mandates enterprise DLT registration, entity registration fees (₹5,900+), sender header approval, SMS template whitelisting, and per-SMS cost (~₹0.15–0.30/SMS). High financial and administrative barrier. | *Deferred to future funded phase* |
| **WhatsApp OTP** | Not viable on zero budget | High familiar usage | Requires Meta WhatsApp Business API verification, BSP integration (Twilio/Gupshup), and per-authentication conversation fees (~₹0.50/message). | *Deferred to future funded phase* |
| **Passkeys (WebAuthn)** | Free | Low in rural India (inconsistent biometrics/OS support on low-end Android Go devices) | Technical complexity high for low-literacy farmers. | *Deferred to future phase* |
| **Passwords** | Free | Poor: Forgotten passwords, credential stuffing, weak PINs | High support overhead, insecure for rural user base. | **Rejected** |

---

## 3. Decision

1. **Primary Login Method:** Google Sign-In using Google Identity Services (GIS).
   - Verified via Google's `google-auth` library (`verify_oauth2_token`).
   - Identifies farmers by immutable Google `sub` ID in a `SocialIdentity` table.
   - Account linking to existing accounts permitted **only** if the email was previously verified.
2. **Secondary Login Method:** 6-digit Email Verification Code sent over an HTTP Transactional API using `django-anymail`.
   - **Primary Provider:** Brevo (formerly Sendinblue) with 300 free emails/day over HTTPS Port 443.
   - **Alternative Provider:** Resend with 100 free emails/day.
   - Retains 6-digit hashed storage, 10-minute expiry (aware UTC), max 5 attempts, and rate limiting.
3. **Always Available:** "Continue as Guest" remains prominent on all entry points. Guests can claim unauthenticated recommendations upon logging in.

---

## 4. Session Architecture (Web and Mobile)

### Token Specifications
* **Access Token:** Short-lived (15 minutes), stateless HMAC-SHA256 token containing `user_id`, `email`, and `exp`. Stored strictly **in memory** on web clients.
* **Refresh Token:** Long-lived (30 days), opaque random 64-character token stored hashed (SHA-256) in the database with **Token Family Rotation**:
  * Each login creates a `family_id`.
  * Every refresh cycle revokes the old refresh token and issues a new one under the same family.
  * **Reuse Detection:** If a revoked refresh token is presented, reuse/theft is detected. The entire token family is immediately revoked, all active sessions for that family are terminated, and an `AuthEvent` security alert is recorded.

### Cookie Policy & Cross-Domain Topology
* **Frontend:** `krishisetu-ai-gamma.vercel.app`
* **Backend:** `krishisetu-api-n0by.onrender.com`

Because Vercel and Render are on different registrable domains, third-party cookies face strict partitioning and blocking in Safari (ITP) and Google Chrome.
* **Architecture Solution:** Vercel Rewrite Proxy.
  * `frontend/vercel.json` proxies `/api/:path*` to the Render backend service.
  * Web browsers interact with `/api/` on the same origin (`krishisetu-ai-gamma.vercel.app`), transforming the refresh token cookie (`krishisetu_rf`) into a **first-party cookie**:
    * `HttpOnly = True` (inaccessible to JavaScript, zero XSS exfiltration risk).
    * `Secure = True` (HTTPS only).
    * `SameSite = Lax` (defends against cross-site request forgery).
  * Streaming chat connects directly with the in-memory Bearer token to prevent Vercel proxy buffer delays.
* **Mobile Clients (`client_type=mobile`):**
  * The refresh token is returned in the JSON body for secure native device storage (Keychain / EncryptedSharedPreferences).
* **CSRF Defense on Cookie Refresh:**
  * `POST /api/auth/refresh/` validates a custom header (`X-KrishiSetu-Client: web` or `X-Requested-With`) to defeat simple browser CSRF cross-origin POSTs.

---

## 5. Security & DPDP Act 2023 Compliance
* **No Raw IP Storage:** Client audit logs store salted SHA-256 hashes (`hashed_client_id`) in `AuthEvent`.
* **Consent Tracking:** Users must have `consented_at` and `consent_version` recorded upon registration.
* **Right to Erasure:** `DELETE /api/me/` purges all farmer personal records, farm plots, saved schemes, identities, and active sessions.
* **No Secrets in Repo:** Client IDs are public; OAuth secrets and API keys are strictly loaded via environment variables.
