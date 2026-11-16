# ADR 0010: Email Delivery Transport & Outbound Network Boundaries

- **Status:** PROPOSED (Pending Owner Selection)
- **Date:** 2026-11-16
- **Context:** Phase 13 Passwordless Email Authentication & OTP Dispatch
- **Host Infrastructure:** Render (Free Web Service)

---

## 1. Context & Problem Statement

KrishiSetu AI uses passwordless 6-digit email OTP codes to authenticate farmers. When deployed to Render's Free Web Service, outbound network connections to `smtp.gmail.com:587` silently hang and trigger `Request timed out after 12000ms`.

### Verified Platform Restriction
According to [Render's Official Documentation (Email Ports Policy, updated November 2026)](https://render.com/docs/free#email-ports):
- **Port 25:** Blocked globally across all instances.
- **Ports 465 & 587:** **Completely blocked on Free Web Services** to prevent spam and protect IP reputation.
- **Port 443 (HTTPS):** Open and unrestricted on all tiers.

Because SMTP submission on ports 465 and 587 is blocked by Render's firewall on the free plan, traditional SMTP connections will always timeout unless upgraded or routed over an HTTP/REST API.

---

## 2. Decision Comparison

| Criteria | Option A: Render Paid Instance + SMTP | Option B1: Resend (HTTP API via django-anymail) | Option B2: Brevo (Sendinblue HTTP API via django-anymail) | Option B3: SendGrid (HTTP API via django-anymail) |
| :--- | :--- | :--- | :--- | :--- |
| **Protocol & Port** | SMTP over Port 587 / 465 | HTTPS (Port 443) REST API | HTTPS (Port 443) REST API | HTTPS (Port 443) REST API |
| **Works on Render Free?** | ❌ No (Requires $7/mo upgrade) | ✅ Yes (Port 443 is open) | ✅ Yes (Port 443 is open) | ✅ Yes (Port 443 is open) |
| **Free Tier Limits** | Gmail SMTP: 500 emails/day | 3,000 emails/month (100/day) | 300 emails/day (9,000/month) | 100 emails/day |
| **Deliverability in India** | High risk of landing in spam if using `@gmail.com` | Excellent inbox placement | High deliverability to Indian ISPs & Gmail | Good, but strict initial warmup |
| **Setup Effort** | 0 new libraries (existing Django SMTP) | 1 library (`django-anymail[resend]`) + API key | 1 library (`django-anymail[brevo]`) + API key | 1 library (`django-anymail[sendgrid]`) + API key |
| **Domain & DNS Requirements** | None (uses personal Gmail address) | Requires domain verification (SPF, DKIM, MX) OR sandbox | Requires domain verification (SPF, DKIM) OR single sender | Requires domain verification (SPF, DKIM) |

---

## 3. Analysis & Recommendation

### Option A: Retain Gmail SMTP
- **Pros:** No new accounts needed, already configured with App Password.
- **Cons:** Cannot run on Render Free Tier. Outbound ports 587/465 are dropped by Render firewall. Requires upgrading the Render web service to an Individual/Starter plan ($7/mo).

### Option B (Recommended): Transactional Email HTTP API (Resend or Brevo)
- **Pros:** 
  1. Operates entirely over standard outbound HTTPS (Port 443), which is 100% permitted on Render Free Tier.
  2. Latency is 100–300ms vs multi-second SMTP handshakes.
  3. Integrated seamlessly into Django via standard `django-anymail` backend (`EMAIL_BACKEND = "anymail.backends.resend.EmailBackend"`).
  4. Free tier provides 300 emails/day (Brevo) or 3,000/month (Resend) with zero fees.
- **Cons:** Requires creating a free account on Resend or Brevo and obtaining an API key.

---

## 4. Required Action & Next Steps

We pause for the owner's explicit decision:
1. **Choice 1:** Keep standard SMTP (requires paid host plan or non-blocked VPS/host).
2. **Choice 2:** Switch to HTTP API (`Resend` or `Brevo`) via `django-anymail` for 100% free operation on Render Free Tier.
