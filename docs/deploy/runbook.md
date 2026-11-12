# Production Operations & Rollback Runbook

## 1. Rollback Procedures

### Frontend (Vercel)
1. Open **Vercel Dashboard -> Deployments**.
2. Locate the last known-good production deployment.
3. Click the **⋮** menu -> **Instant Rollback** (takes effect globally in < 5 seconds).

### Backend (Render)
1. Open **Render Dashboard -> krishisetu-api -> Events / Deploys**.
2. Select the previous healthy deploy and click **Rollback to this deploy** (rebuilds/restarts container from that commit).
3. If a bad database migration was applied, revert to a Neon branch/point-in-time snapshot before rolling back code.

---

## 2. Database Backup & Restore (Neon PostgreSQL)
- **Instant Restore (Free Tier):** Neon retains a **6-hour point-in-time restore history window**. In **Neon Console -> Branches -> Restore**, create a branch from any timestamp in the last 6 hours and promote it if data corruption occurs.
- **Offline `pg_dump` Backup (Recommended before schema changes):**
  ```bash
  pg_dump "$DATABASE_URL" --format=custom --no-owner --file=krishisetu_backup_$(date +%F).dump
  ```
- **Restore from `pg_dump`:**
  ```bash
  pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner krishisetu_backup_YYYY-MM-DD.dump
  ```

---

## 3. Secret & API Key Rotation
- **`SECRET_KEY` (Django):** Generate a new 50+ char random key (`get_random_secret_key()`), update `SECRET_KEY` in Render **Environment**, and trigger a manual deploy. (Note: invalidates active Django admin sessions.)
- **`GEMINI_API_KEY`:** Create a new key in Google AI Studio, update `GEMINI_API_KEY` in Render **Environment**, redeploy, and revoke the old key in AI Studio.
- **`DATABASE_URL`:** Rotate the role password in Neon Console, update `DATABASE_URL` in Render **Environment**, and redeploy.

---

## 4. Uptime Monitoring & Cold-Start Policy
- Configure a free monitor (e.g., **UptimeRobot** or **Better Stack**) on `https://<render-service>.onrender.com/api/health/` and `https://<vercel-app>.vercel.app/`.
- **Terms & Quota Note:** Render Free tier provides **750 free instance hours/month** (~31 days for 1 service) and spins down after 15 minutes of inactivity. Use a **30–60 minute** monitor interval if you only want outage alerts without artificially keeping the free service awake 24/7; upgrade to Render Starter (\$7/month) if zero cold-start latency is required.

---

## 5. Escalation & Contacts
- **Project Owner / Maintainer:** Harsh Poshiya (`harshposhiya92@gmail.com`)
- **Platform Status Pages:**
  - Render: https://status.render.com
  - Vercel: https://www.vercel-status.com
  - Neon: https://neonstatus.com
