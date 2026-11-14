# ADR 0002: Authentication Architecture for Farmer Profiles and Dashboard

- **Status:** ACCEPTED (Approved by Product Owner on 2026-11-14: "Add Best And Totally Free And Best Secure")
- **Date:** 2026-11-14
- **Deciders:** KrishiSetu Product Owner & Engineering Team
- **Technical Scope:** Phase 13 (Farmer Profiles and Dashboard) — T13.1
- **Feature Flag:** `FEATURE_ACCOUNTS` (Enabled, defaults to graceful guest degradation)

---

## 1. Context and Problem Statement

KrishiSetu AI is evolving to introduce personal farmer accounts in Phase 13.
Key architectural requirements:
1. **Optional Accounts (Zero Friction):** The entire application (Crop Recommendation System, Weather, Schemes, Crop Nutrition, Krishi Mitra Chat) must remain 100% usable without logging in. Accounts are strictly opt-in for farmers desiring saved plots, recommendation history, and bookmarked schemes.
2. **Totally Free Operational Cost:** Zero per-SMS gateway charges, zero third-party identity provider subscription fees, and zero vendor lock-in.
3. **Maximum Security & Privacy:** Immune to credential stuffing, rainbow tables, password database breaches, and SMS toll fraud. Compliant with India's Digital Personal Data Protection (DPDP) Act, 2023.
4. **Cross-Origin Resiliency:** Seamless communication between the Vercel-hosted frontend (`*.vercel.app`) and the Render-hosted Django API (`*.onrender.com`).

---

## 2. Options Considered

### Option A: Passwordless Email One-Time Code (OTP) + Token Rotation (SELECTED)
- Farmer submits their email address.
- A 6-digit cryptographically secure numeric code is generated, salted and hashed, and stored in the database with a 10-minute TTL.
- The plain code is delivered via standard SMTP (console/mock in development, zero-cost SMTP in production).
- Verification validates the hash via constant-time comparison, issuing a short-lived access token and refresh token.

### Option B: Google Sign-In (OAuth 2.0 / OpenID Connect)
- Farmer signs in via Google OAuth popup or redirect.
- Requires every farmer to possess an active Google account. While common on Android, it excludes desktop/feature browsers without Google session management and adds third-party OAuth configuration complexity.

### Option C: Phone Number OTP via Indian SMS Gateway
- Farmer enters a 10-digit Indian mobile number; OTP is sent via SMS.
- **Critical Drawbacks:**
  - **Financial Cost:** Commercial SMS gateways (Twilio, Msg91, Fast2SMS) charge per SMS (~₹0.20 to ₹0.35 per domestic SMS).
  - **Regulatory Barrier:** TRAI (Telecom Regulatory Authority of India) mandates Distributed Ledger Technology (DLT) registration. Registration requires an incorporated Indian business entity, entity registration fee (~₹5,900), DLT telemarketer approval, and registered header/template whitelisting with telecom operators (Airtel/Jio/Vi).
  - **Abuse Risk:** International SMS pumping / toll fraud attacks can rapidly drain account balances if public endpoints are targeted by bots.

### Option D: Traditional Username + Password
- Standard registration with password creation.
- **Drawbacks:** High friction for rural users; creates forgotten-password support overhead; vulnerable to weak passwords, brute force, and credential stuffing.

---

## 3. Comparative Evaluation Matrix

| Evaluation Dimension | Option A: Email OTP (Selected) | Option B: Google Sign-In | Option C: Phone OTP (SMS) | Option D: Username / Password |
| :--- | :--- | :--- | :--- | :--- |
| **Direct Financial Cost** | **₹0 (100% Free)**: Standard SMTP / free transactional tiers (e.g., Resend, Gmail SMTP, SendGrid free). | **₹0**: Free within standard Google Cloud Console quotas. | **High & Ongoing**: ~₹0.25/SMS + ₹5,900+ one-time TRAI DLT registration fee. | **₹0**: Handled internally. |
| **Regulatory Requirements** | **None**: No government telecom entity registration required. | **Google API TOS compliance**. | **Strict TRAI DLT Compliance**: Business registration, header approval, template registration. | **None**. |
| **Security & Breach Resistance** | **Exceptional (10/10)**: Passwordless. Zero passwords to breach. Codes stored hashed with salt. 10-min TTL. 5-attempt brute-force lock. | **High (9/10)**: Delegated to Google infrastructure. | **Moderate (6/10)**: Vulnerable to SIM swapping, SS7 interception, and SMS toll-fraud draining. | **Low (4/10)**: Vulnerable to weak passwords, credential stuffing, and phishing. |
| **Abuse & Toll-Fraud Risk** | **Zero Toll Risk**: Outgoing emails cannot incur telecom operator surcharges. Rate-limited to 5/hr/IP. | **Negligible**. | **Severe**: High risk of automated SMS toll fraud without paid Captcha barriers. | **Moderate**: Account enumeration and credential brute force. |
| **Farmer Experience** | Simple 6-digit code entry; works across all modern browsers and smartphones. | 1-click on Android; slightly clunky on non-Google browsers. | Familiar for mobile users, but blocked if SMS delivery is delayed. | High friction (remembering passwords). |
| **Implementation Effort** | Low to Moderate (self-contained Django app, 0 external paid dependencies). | Moderate (OAuth client handling, popup/redirect handling). | High (DLT templates, SMS webhook handling, balance monitoring). | Moderate. |

---

## 4. Cross-Origin Architecture (Vercel Frontend + Render Backend)

### Session & Token Handling Decision
Because KrishiSetu AI runs with the frontend on Vercel (`krishisetu-ai.vercel.app`) and backend on Render (`krishisetu-api.onrender.com`), they reside on different public eTLD+1 domains. Modern browsers (Chrome 2024+, Safari ITP, Firefox) partition or block third-party cookies across mismatched public origins unless custom top-level domains are mapped.

To ensure **100% reliability, zero broken cookies, and maximum security**:
1. **Access Token:** Short-lived JWT (15 minutes), stored securely in client frontend memory (React state / auth context). Transmitted in the standard `Authorization: Bearer <access_token>` HTTP header.
2. **Refresh Token:** Cryptographically secure 64-character random token stored in the database with a 30-day lifetime. Sent to `POST /api/auth/refresh/` to obtain a fresh access token.
3. **Revocation & Invalidation:**
   - Calling `POST /api/auth/logout/` immediately revokes the refresh token in the database.
   - Any refresh token reuse or expired token rejection completely resets the client session.

---

## 5. Security & Privacy Safeguards

1. **Cryptographic 6-Digit Code Generation:**
   ```python
   code = str(secrets.randbelow(900000) + 100000)
   ```
2. **Hashed Code Storage:**
   The database never stores the plaintext OTP. It stores `salt` and `code_hash`:
   ```python
   code_hash = hashlib.sha256(f"{salt}:{code}".encode()).hexdigest()
   ```
3. **Attempt & Time Limits:**
   - Expiration: Exactly 10 minutes (`expires_at = now + 10 minutes`).
   - Max Attempts: 5 failed attempts maximum. On the 5th failed attempt, the OTP is permanently invalidated.
   - Active Codes: Only one active OTP per email at any given time; requesting a new code automatically revokes previous ones.
4. **Anti-Enumeration Protection:**
   The `POST /api/auth/request-code/` endpoint returns the exact same 200 OK response (`{"status": "ok", "message": "If this email is valid, a verification code has been sent."}`) regardless of whether an account already exists.
5. **Rate Throttling:**
   Restricted to 5 code requests per hour per email and per client IP to eliminate flooding.
6. **India DPDP Act (2023) Compliance:**
   - Every user account maintains `consented_at` timestamp and `consent_version`.
   - Complete data export endpoint (`GET /api/me/export/`) in JSON format.
   - Complete account deletion endpoint (`DELETE /api/me/`) wiping all personal records.

---

## 6. Decision and Consequences

### Accepted Solution:
We adopt **Passwordless Email OTP with Hash Storage and Token Rotation**.

### Positive Consequences:
- **100% Free Forever:** Zero SMS bills, zero DLT bureaucracy.
- **Maximum Security:** No passwords to compromise, brute-force immune, anti-enumeration built in.
- **Clean Extensibility:** The architecture is isolated behind `apps.accounts`, allowing SMS OTP or OAuth to be added as alternative providers in the future if a sponsored telecom partnership is established.
