# Frontend Deployment on Vercel

## 1. Project Setup
1. In Vercel Dashboard -> **Add New... -> Project**, import the GitHub repository.
2. Configure **Build & Development Settings**:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

---

## 2. Environment Variables
Set in **Project Settings -> Environment Variables**:
- **Production:**
  - `VITE_API_BASE_URL` = `https://<your-render-service>.onrender.com/api`
- **Preview Deployments:**
  - **Do NOT point Preview deployments at production data.** Set `VITE_API_BASE_URL` on Preview to a staging backend URL (or leave unset if testing UI shell / mocked routes only).

---

## 3. Routing & Headers (`frontend/vercel.json`)
- **SPA Rewrite:** All client routes (`/recommend`, `/weather`, `/schemes`, `/nutrition`, `/chat`) rewrite cleanly to `/index.html` while preserving `/assets/*`, `/sw.js`, `/offline.html`, and manifest/icon files.
- **Security Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=(), microphone=()`.
- **Caching:** `/assets/*` served with `max-age=31536000, immutable`; `/sw.js` served with `no-cache` so PWA updates take effect immediately.
