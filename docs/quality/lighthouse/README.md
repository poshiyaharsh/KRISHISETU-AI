# Lighthouse Mobile Audit Summary (Phase 10 — T10.6)

**Profile:** Mobile (Simulated Slow 4G), Headless Chrome, Vite Production Build
**Targets:** Performance >= 85, Accessibility >= 95, Best Practices >= 95

| Page | Route | Performance | Accessibility | Best Practices |
|---|---|---|---|---|
| home | `/` | 82 | 100 | 100 |
| recommend | `/recommend` | 69 | 100 | 96 |
| weather | `/weather` | 72 | 100 | 96 |
| schemes | `/schemes` | 80 | 100 | 96 |
| chat | `/chat` | 95 | 100 | 100 |

## Observations & Fix Plan for Routes Below Performance 85

- **Accessibility (100/100 on all 5 routes)** and **Best Practices (96–100/100 on all 5 routes)** exceed targets (>= 95).
- **Why `/`, `/schemes`, `/weather`, and `/recommend` scored 69–82 under simulated Slow 4G:**
  1. **Main vendor chunk (`index-*.js`, 393.76 kB / 131.70 kB gzip) & route-level lazy chunks (`Recommend` 184.41 kB, `CartesianChart` 395.72 kB)**: Under simulated Slow 4G (1.6 Mbps, 150ms RTT), downloading and parsing `react-router-dom` + `@tanstack/react-query` + `i18next` + `recharts` delays LCP/TBT on initial cold load.
  2. **Standalone `vite preview` environment**: `vite preview` serves uncompressed/un-proxied responses without HTTP/2 multiplexing or CDN Brotli compression, and `/recommend`, `/weather`, and `/schemes` incurred failed `/api/*` requests when audited without the Django backend running (accounting for the 96 vs 100 Best Practices score as well).
- **Fix Plan (Phase 11 Deployment & Post-Launch Polish):**
  1. Configure `rollupOptions.output.manualChunks` in `vite.config.ts` to split `react-vendor`, `i18n-vendor`, and `charts-vendor`, and lazy-load `ForecastChart` inside `/weather` so Recharts (`395 kB`) does not block above-the-fold `WeatherCard` LCP.
  2. Serve production assets behind CDN/Nginx with Brotli + HTTP/2 and immutable `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` (plus Service Worker runtime cache in `public/sw.js`).

