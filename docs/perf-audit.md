# Performance audit — QueueOra web (`apps/web`)

Branch: `feature/perf-audit`  
Date: 2026-08-03  
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

---

## Ranked findings

### HIGH impact · LOW effort

| # | Issue | Evidence | User impact |
|---|--------|----------|-------------|
| 1 | **WorkspaceGate** waits on client org list before showing main content | `workspace-gate.tsx`, `dashboard-shell.tsx` | Spinner even when server already knows active org |
| 2 | **Session fetched multiple times** per request (layout + page + home) | `dashboard/layout.tsx`, `dashboard-session.ts`, `dashboard-home.tsx` | Extra auth DB work every navigation |
| 3 | **Calendar** re-fetches after SSR + **4s poll** if any scheduled post exists | `publishing-calendar.tsx` | Continuous network load; needless double load |
| 4 | **Ideas** SSR then immediate client `fetchIdeas` | `ideas-workspace.tsx` | Waste + flicker |
| 5 | **Agents** pure CSR + **20s** poll always | `agents/page.tsx`, `agents-workspace.tsx` | Empty shell then load; background chatter |
| 6 | Composer / approvals **sequential awaits** before parallel data | `composer/page.tsx`, `approvals/page.tsx` | Slightly higher TTFB |
| 7 | Root **cookies()** → all routes dynamic incl. marketing | `app/layout.tsx` | Marketing never static |

### HIGH impact · MEDIUM effort

| # | Issue | Notes |
|---|--------|--------|
| 8 | **Analytics** sequential Meta debug_token + channel summaries + up to 25 post metrics | `analytics-server.ts` — worst TTFB |
| 9 | Full dashboard shell is client; **no** `loading.tsx`, no `next/dynamic` | Soft-nav waits with little feedback |
| 10 | **Both** `en` + `bn` catalogs bundled via PreferencesProvider | ~78KB messages total |
| 11 | `defaultCaptionBrief` imported from `openai-caption.ts` (pulls server client module graph) | Verify not in browser chunks; split constants |
| 12 | 3 fonts; Noto 4 weights always | Slow first paint on mobile |

### LOW impact

- Raw `<img>` instead of `next/image` for avatars/previews  
- Accounts `Suspense` wrapping already-awaited data  
- No code-split for gallery/template pickers until open  

### Already fine

- Lean deps (no recharts/moment/lodash mega-kit)  
- Many pages already use `Promise.all` for lists  
- Composer/calendar/posts often SSR first  
- Polling for publish status only when pending  
- Small public gallery SVGs  

---

## Measurement plan

1. **DevTools Network** on `/dashboard`: count better-auth org/session calls before main content  
2. **Lighthouse** (logged-in): `/dashboard`, `/dashboard/analytics`, `/dashboard/composer`, `/dashboard/calendar` (with scheduled posts)  
3. **`next build` + bundle analyzer**: confirm no `pg`/`bullmq`/`openai` api key path in client; locale catalogs  
4. **Server timing**: log ms for `buildAnalyticsSnapshot` vs rest of dashboard  

---

## Proposed implementation order (next steps on this branch)

1. Unblock main when session already has `activeOrganizationId` (gate only if missing)  
2. `cache()` / pass session+org from layout; remove redundant home session  
3. Calendar: skip first client fetch when SSR matches; poll only focused + has active scheduled in range  
4. Ideas: skip initial refetch; Agents: SSR seed + poll only when activity  
5. Parallelize composer/approvals awaits  
6. Analytics: concurrent Graph + skeleton first paint  
7. Locales split / lighter fonts (as capacity allows)  

---

## Not in scope for this track

- Rewrite to Alpine  
- Supabase  
- Smarter AI / consent / style profiles (follow-up track)  
