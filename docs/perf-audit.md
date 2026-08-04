# Performance audit — QueueOra web (`apps/web`)

Branch: `feature/perf-audit`  
Date: 2026-08-03 (code) · 2026-08-04 (production)  
Scope: feel-faster for dashboard users. Worker out of scope. No code changes yet.

## Verdict

**Yes, the app can feel meaningfully faster** without leaving Next.js.  
Client bundle bloat is mild (no chart libs, full OpenAI SDK, etc.). The main issues are:

1. Client gates blocking paint of already-fetched RSC content  
2. Repeated session / org work on every navigation  
3. Aggressive polling and SSR-then-refetch  
4. Analytics Meta API sequential TTFB  
5. Whole-dashboard forced client chrome + dual locale catalogs  

Alpine/rewrite would not address these better than targeted Next fixes.

**Production (`queueora.com`):** Public marketing already scores well in lab Lighthouse (~95). Most remaining user-perceived slowness is almost certainly **logged-in dashboard** paths, not the homepage.

---

## Production audit — https://queueora.com (2026-08-04)

Measured externally (no login cookies): document timing + asset weights + Lighthouse home.

### Latency (document HTML)

| URL | Status | ~ms cold/sample | ~ms warm | HTML size | Cache-Control |
|-----|--------|-----------------|----------|-----------|---------------|
| `/` | 200 | ~250 | ~80 | ~15 KB | `private, no-cache, no-store` |
| `/login` | 200 | ~70 | ~60 | ~17 KB | same |
| `/signup` | 200 | ~65 | — | ~17 KB | same |
| `/privacy` | 200 | ~90 | ~100 | ~36 KB | same |
| `/terms` | 200 | ~85 | — | ~37 KB | same |
| `/dashboard` (logged out) | **307** → auth | ~85 | — | login shell | same |
| Meta webhook unauth | 403 | expected | — | — | — |

Stack: **Caddy → Next.js (PM2)**. Gzip on. Lighthouse root server response **~20 ms** (good).

### First-load assets

**Home**

- ~12 `/_next/static` files in HTML  
- ~**765 KB** raw JS+CSS sum (browser compresses further)  
- Largest chunks ~222 / 138 / 110 KB  
- Static: `public, max-age=31536000, immutable`  

**Login**

- ~**804 KB** raw static sum (similar + auth form chunks)

**Fonts (preloaded)**

- 4 × woff2 ≈ **181 KB** total (~105 + 25 + 23 + 29)  
- Matches multi-family / multi-weight preload (Geist + Noto)

### Lighthouse (headless, home only)

| Metric | Result |
|--------|--------|
| Performance score | **~95** |
| FCP | ~0.8 s |
| LCP | ~2.9 s (softest vitals metric) |
| TBT | ~60 ms |
| CLS | 0 |
| TTI | ~2.9 s |
| Payload (LH) | ~398 KiB total weight path |
| Opportunity | Unused JS ~29 KiB |

### Production conclusions

| Finding | Severity |
|---------|----------|
| HTML always `no-store` (dynamic root prefs/cookies) | Low for app; medium for marketing caching |
| ~0.75 MB raw JS on public pages | Medium — can slim marketing client shell |
| Font preload ~181 KB | Medium — LCP candidate |
| Gzip + immutable static + low TTFB | Good |
| Unauth `/dashboard` → 307 login | Correct |
| **Logged-in dashboard not measured live** | Highest remaining gap (manual / auth Lighthouse) |

### How to re-check logged-in live

1. Log in at https://queueora.com/login  
2. Network hard-reload `/dashboard` — count org/session calls before main  
3. Lighthouse on `/dashboard`, `/dashboard/composer`, `/dashboard/analytics`  
4. Calendar with scheduled posts — expect `/api/posts/calendar` every ~4s today  

---

## Ranked findings (codebase)

### HIGH impact · LOW effort

| # | Issue | Evidence | User impact |
|---|--------|----------|-------------|
| 1 | **WorkspaceGate** waits on client org list before main | `workspace-gate.tsx`, `dashboard-shell.tsx` | Spinner despite active org |
| 2 | **Session 2–3×** per nav | layout + `dashboard-session` + home | Extra auth DB work |
| 3 | **Calendar** SSR refetch + 4s poll | `publishing-calendar.tsx` | Constant network |
| 4 | **Ideas** SSR then client refetch | `ideas-workspace.tsx` | Waste / flicker |
| 5 | **Agents** CSR + 20s poll | `agents/*` | Empty then load |
| 6 | Composer / approvals serial awaits | page servers | Slight TTFB |
| 7 | Root `cookies()` → all dynamic | `app/layout.tsx` | Marketing never static |

### HIGH impact · MEDIUM effort

| # | Issue | Notes |
|---|--------|--------|
| 8 | Analytics sequential Meta Graph | Worst TTFB |
| 9 | Client shell; no `loading.tsx` / little dynamic import | Soft-nav lag feel |
| 10 | EN + BN catalogs always via prefs | Extra client weight |
| 11 | caption constants co-imported with openai path | Split constants |
| 12 | Fonts / preloads | **Live ~181 KB** fonts |

### Already fine

- Lean deps; many `Promise.all` pages  
- Gzip + long-cache static assets on prod  
- Public Lighthouse ~95  

---

## Measurement plan

1. Logged-in Network + Lighthouse on dashboard routes  
2. Bundle analyzer on build  
3. Server timing for `buildAnalyticsSnapshot`  
4. Re-run public Lighthouse after font/marketing wins  

## Implementation order (this branch)

1. WorkspaceGate + session dedupe  
2. Calendar / ideas / agents poll & double-fetch  
3. Parallel page data  
4. Analytics concurrency / skeleton  
5. Fonts + optional marketing static-ish shell  

## Out of scope

Alpine rewrite · Supabase · Smarter AI / consent (later track)  
