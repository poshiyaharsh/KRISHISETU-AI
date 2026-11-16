# Email Deliverability & Domain Verification Guide

> Reference for configuring production email delivery, avoiding spam filters, and configuring DNS records (SPF, DKIM, DMARC) for KrishiSetu AI.

---

## 1. Important Note on Free Gmail Addresses (`@gmail.com`)

If your `EMAIL_HOST_USER` and `DEFAULT_FROM_EMAIL` use a personal `@gmail.com` address:
* **Spam Filter Risk:** Modern mail systems (Google, Yahoo, Microsoft) enforce strict DMARC alignment. Because a third-party server or cloud instance is sending mail claiming to be from `@gmail.com`, receiving providers may flag OTP emails as spam or route them to the Promotions tab.
* **Daily Quotas:** Personal Gmail accounts allow a maximum of 500 recipients per rolling 24-hour period.
* **Farmer Advisory:** Always instruct farmers to check their **Spam** and **Promotions** folders if the OTP does not immediately appear in their Primary inbox.

---

## 2. Custom Domain Verification (SPF, DKIM, DMARC)

When using a custom agricultural domain (e.g., `krishisetu.in` or `krishisetu.ai`) with a transactional mail provider (Brevo, Resend, SendGrid, or Google Workspace), add the following DNS TXT records to your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy):

### 1. SPF (Sender Policy Framework)
Authorizes your designated mail servers to send email on behalf of your domain.
* **Type:** `TXT`
* **Host / Name:** `@`
* **Value (Example for Brevo):** `v=spf1 include:spf.brevo.com ~all`
* **Value (Example for Google Workspace):** `v=spf1 include:_spf.google.com ~all`

### 2. DKIM (DomainKeys Identified Mail)
Cryptographically signs every outbound message with a private key, verified via public key in DNS.
* **Type:** `TXT` (or `CNAME` depending on provider)
* **Host / Name:** `mail._domainkey` (or provider-specified selector)
* **Value:** Public key string provided by your mail service dashboard (e.g., `k=rsa; p=MIGfMA0GCSqG...`)

### 3. DMARC (Domain-based Message Authentication, Reporting & Conformance)
Specifies how receiving servers handle messages that fail SPF or DKIM validation.
* **Type:** `TXT`
* **Host / Name:** `_dmarc`
* **Value (Recommended start):**
  ```text
  v=DMARC1; p=none; rua=mailto:dmarc-reports@krishisetu.in; sp=none; aspf=r;
  ```
  *(Once alignment is confirmed, transition `p=none` to `p=quarantine` or `p=reject` for strict security).*

---

## 3. Host Restrictions (Render)
As documented in `docs/adr/0010-email-delivery.md`, Render Free Web Services block outbound network connections on ports 25, 465, and 587. For reliable email delivery on Render Free, route transactional emails through an HTTPS API (Port 443) using `django-anymail`.
