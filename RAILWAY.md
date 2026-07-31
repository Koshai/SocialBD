# QueueOra — Railway deploy (simple)

Deploy **4 things**: Postgres + Redis + Web + Worker.

## 1. Create project

1. Go to [railway.app](https://railway.app) → New Project
2. Add **PostgreSQL**
3. Add **Redis**
4. Add **GitHub Repo** (this monorepo) → this becomes **web**
5. Add the **same GitHub Repo** again → rename to **worker**

## 2. Wire config files

For each service → **Settings → Config-as-code**:

| Service | Config file |
|---------|-------------|
| web | `railway.web.toml` |
| worker | `railway.worker.toml` |

Root directory for both: repo root (`/`).

## 3. Shared variables

In Railway, create a **shared variable group** (or copy to both web + worker):

```env
NEXT_PUBLIC_APP_URL=https://queueora.com
BETTER_AUTH_URL=https://queueora.com
PUBLIC_MEDIA_BASE_URL=https://queueora.com
BETTER_AUTH_SECRET=<generate-a-new-long-secret>

DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

MEDIA_STORAGE_PATH=/data/uploads

RESEND_API_KEY=<your-key>
EMAIL_FROM=QueueOra <noreply@queueora.com>

META_APP_ID=...
META_APP_SECRET=...
META_REDIRECT_URI=https://queueora.com/api/meta/callback
META_LOGIN_CONFIG_ID=...
META_OAUTH_EXTENDED_SCOPES=true
META_OAUTH_INSTAGRAM=true

LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=https://queueora.com/api/linkedin/callback

OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini

LEGAL_ENTITY_NAME=QueueOra
PRIVACY_CONTACT_EMAIL=privacy@queueora.com
```

Notes:
- Use Railway’s variable references for `DATABASE_URL` / `REDIS_URL` from the plugins.
- Generate a **new** `BETTER_AUTH_SECRET` for production (don’t reuse local).

## 4. Media volume (important)

Local disk is wiped on redeploy unless you add a volume.

1. On **web** and **worker**: add a Volume mounted at `/data`
2. Keep `MEDIA_STORAGE_PATH=/data/uploads`

Both services must share the same volume (or switch to S3/R2 later).

## 5. Custom domain

1. Web service → **Settings → Networking → Custom Domain**
2. Add `queueora.com` (and `www` if you want)
3. Set DNS records Railway shows at your registrar
4. Wait for HTTPS certificate

## 6. Run database migrations (once)

After Postgres is up and `DATABASE_URL` is set on web:

```bash
# From your laptop (with Railway DATABASE_URL), or Railway shell on web:
pnpm db:migrate:all
```

This applies all SQL files in `packages/db/drizzle` via `DATABASE_URL` (no Docker needed).

## 7. External dashboards

Update these to production URLs:

| Service | What to set |
|---------|-------------|
| Resend | Verify `queueora.com`, use `noreply@queueora.com` |
| Meta | OAuth redirect `https://queueora.com/api/meta/callback` |
| LinkedIn | OAuth redirect `https://queueora.com/api/linkedin/callback` |

## 8. Smoke test

1. Open https://queueora.com
2. Sign up / sign in
3. Upload an image in Composer
4. Schedule a post → confirm **worker** logs show publish jobs

## Commands reference

| Action | Command |
|--------|---------|
| Migrate DB | `pnpm db:migrate:all` |
| Build web | `pnpm build:web` |
| Start web | `pnpm start:web` |
| Start worker | `pnpm start:worker` |

## Local vs production

Keep local `.env` on `http://localhost:3001`.  
Production env lives only in Railway — never commit production secrets.
