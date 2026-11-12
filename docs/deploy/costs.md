# Hosting Costs & Free-Tier Limits

**Verified on:** 2026-11-12

---

## 1. Frontend — Vercel (Hobby Plan — \$0/month)
- **Eligibility:** Personal, non-commercial projects only.
- **Fast Data Transfer (Bandwidth):** 100 GB/month included; Fast Origin Transfer: 10 GB/month. Projects pause on limit (no surprise overage bills).
- **Builds & Deployments:** 1 concurrent build, up to 100 deployments/day (rate limit 100/hour), max 45 minutes build duration, 2 vCPUs.
- **Projects:** Up to 200 projects.
- **Cold Start:** None for static SPA assets served from Vercel's Edge CDN.

---

## 2. Backend — Render (Free Web Service — \$0/month)
- **Compute:** 512 MB RAM, shared CPU, **750 free instance hours/month** per workspace.
- **Sleep / Spin-Down Behavior:** Free web services **automatically spin down after 15 minutes** of inactivity. The next request triggers a cold start taking **~45–60 seconds**.
- **Filesystem:** Ephemeral — local SQLite or local files are wiped on restart/redeploy (hence PostgreSQL on Neon is mandatory).
- **Upgrade Path:** Render Starter plan (\$7/month) eliminates spin-down for always-on latency.
- **Note on Render PostgreSQL Free:** Expires 30 days after creation — **do not use Render Free Postgres**; use Neon instead.

---

## 3. Database — Neon PostgreSQL (Free Tier — \$0/month)
- **Storage:** Up to **1 GB** per project (20 GB account cap). No 30-day expiration.
- **Compute:** **100 Compute-Unit (CU) hours/month** per project, autoscales up to 2 CU (~8 GB RAM) when active.
- **Scale to Zero:** Compute suspends after **5 minutes** of inactivity (wakes automatically in ~0.5–1s on query).
- **Egress & Branches:** 5 GB public network transfer/month; up to 10 branches/project; 6-hour point-in-time restore history window.

---

## 4. External APIs
- **Open-Meteo (Weather & Geocoding):** Free for non-commercial use (attribution required, already rendered in footer).
- **Google Gemini (`gemini-2.0-flash`, `text-embedding-004`):** Free tier up to 1,500 requests/day; guarded in-app by `CHAT_DAILY_LIMIT=500` and `10/min` throttling.
