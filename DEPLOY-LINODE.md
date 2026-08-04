# QueueOra — Linode deploy (like localhost)

Run the same stack as local: Docker Postgres + Redis, then web + worker with pnpm.  
Point `queueora.com` / `www.queueora.com` at the Linode.

## 1. Create the Linode

1. [cloud.linode.com](https://cloud.linode.com) → **Create Linode**
2. Image: **Ubuntu 24.04 LTS**
3. Plan: **Nanode 1GB** works for testing; **Shared 2GB** is safer for Next.js builds
4. Region: closest to you / your users
5. Set a strong root password (and SSH key if you use one)
6. Note the **public IPv4**

Firewall (Cloud Firewall or UFW later): allow **22**, **80**, **443**.

## 2. DNS

At your domain registrar (or Cloudflare DNS for `queueora.com`):

| Type | Name | Value |
|------|------|--------|
| A | `@` | your Linode IPv4 |
| A | `www` | your Linode IPv4 |

Wait until DNS resolves before expecting HTTPS.

## 3. SSH in and install basics

```bash
ssh root@YOUR_LINODE_IP

apt update && apt upgrade -y
apt install -y curl git ufw

# Firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# Docker (Postgres + Redis)
curl -fsSL https://get.docker.com | sh

# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
corepack enable
corepack prepare pnpm@11.1.2 --activate

# Process manager + reverse proxy
npm install -g pm2
apt install -y caddy
```

## 4. Clone the app

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Koshai/SocialBD.git queueora
cd queueora
```

(Use your real repo URL / SSH deploy key if the repo is private.)

## 5. Start Postgres + Redis (same as local)

```bash
cd /var/www/queueora
docker compose up -d
```

Local compose maps Postgres to host port **5434** and Redis to **6379**.  
On the Linode that is fine — only you talk to them via localhost.

## 6. Production `.env`

```bash
cp .env.example .env
nano .env
```

Set at least:

```env
NEXT_PUBLIC_APP_URL=https://queueora.com
BETTER_AUTH_URL=https://queueora.com
PUBLIC_MEDIA_BASE_URL=https://queueora.com
BETTER_AUTH_SECRET=<new-long-secret-for-production>

DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5434/socialbd
REDIS_URL=redis://127.0.0.1:6379

MEDIA_STORAGE_PATH=/var/www/queueora/storage/uploads

RESEND_API_KEY=...
EMAIL_FROM=QueueOra <noreply@queueora.com>

META_APP_ID=...
META_APP_SECRET=...
META_REDIRECT_URI=https://queueora.com/api/meta/callback
# META_LOGIN_CONFIG_ID=...
# META_OAUTH_EXTENDED_SCOPES=true
# META_OAUTH_INSTAGRAM=true

LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=https://queueora.com/api/linkedin/callback

OPENAI_API_KEY=...
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```bash
mkdir -p /var/www/queueora/storage/uploads
```

## 7. Install, migrate, build

```bash
cd /var/www/queueora
pnpm install
pnpm db:migrate:all
pnpm build:web
# worker uses tsx at runtime; optional:
pnpm build:worker
```

## 8. Run web + worker with pm2

```bash
cd /var/www/queueora

# Next listens on 3000 by default in production
pm2 start pnpm --name queueora-web --cwd /var/www/queueora -- --filter @socialbd/web start
pm2 start pnpm --name queueora-worker --cwd /var/www/queueora -- --filter @socialbd/worker start

pm2 save
pm2 startup
# run the command pm2 prints
```

Check:

```bash
pm2 status
curl -I http://127.0.0.1:3000
```

## 9. Caddy → HTTPS for queueora.com

```bash
nano /etc/caddy/Caddyfile
```

```caddy
# Canonical host: redirect www → apex (avoids Better Auth "invalid origin")
www.queueora.com {
	redir https://queueora.com{uri} permanent
}

queueora.com {
	encode gzip
	reverse_proxy 127.0.0.1:3000
}
```

```bash
systemctl reload caddy
```

Caddy gets Let’s Encrypt certificates automatically once DNS points here.

## 10. External dashboards

| Service | Update |
|---------|--------|
| Resend | Verify `queueora.com`, use `noreply@queueora.com` |
| Meta | OAuth redirect `https://queueora.com/api/meta/callback` |
| Meta webhooks (agents) | Callback `https://queueora.com/api/meta/webhook` + verify token matching `META_WEBHOOK_VERIFY_TOKEN` |
| LinkedIn | OAuth redirect `https://queueora.com/api/linkedin/callback` |

### AI reply agents (optional)

1. In Meta Developer → your app → **Webhooks**:
   - Callback: `https://queueora.com/api/meta/webhook` + verify token matching `META_WEBHOOK_VERIFY_TOKEN`
   - Object **Page**: subscribe `messages`, `feed`, `mention`
   - Object **Instagram** (required for IG DMs): subscribe **`messages`**
     - Meta does **not** allow Graph API `/ig-id/subscribed_apps` for messaging; dashboard-only
2. On the Linode `.env` set:
   - `NEXT_PUBLIC_AGENTS_ENABLED=true`
   - `META_OAUTH_MESSAGING=true`
   - `META_OAUTH_INSTAGRAM=true` (for IG scopes + follower counts)
   - `META_WEBHOOK_VERIFY_TOKEN=...` (same as Meta)
   - `OPENAI_API_KEY=...`
3. Rebuild/restart web + worker, run `pnpm db:migrate:all` (includes `0008_reply_agents.sql`).
4. Reconnect Facebook in QueueOra Accounts so messaging scopes are granted and **each Page** gets `subscribed_apps` with `messages`.
   - Errors with `#200` / admin permission / 2FA: that Page will not receive webhooks until the connecting user is a full Page admin with 2FA (if the Page requires it).
5. Open **Agents** in the dashboard, enable an agent on the **Instagram** channel (or linked Page).
6. Test IG DMs from a **personal** Instagram account (not the business account talking to itself).

Production messaging scopes usually need Meta App Review (`pages_messaging`, `pages_manage_metadata`, `instagram_manage_messages`, etc.).

## 11. Smoke test

1. Open https://queueora.com  
2. Sign up / verify email  
3. Upload media + schedule a post  
4. `pm2 logs queueora-worker` — job should run  

---

## Updating later (deploy new code)

From your laptop: commit and push to GitHub (`main`).

Then on the Linode:

```bash
cd /var/www/queueora
git pull origin main
pnpm install
pnpm db:migrate:all          # safe if no new migrations
pnpm build:web
pm2 restart queueora-web queueora-worker
```

Check:

```bash
pm2 status
pm2 logs queueora-web --lines 30
curl -I https://queueora.com
```

Do **not** overwrite the server `.env` with your laptop `.env`. Keep production secrets only on the Linode.

## Common issues

| Symptom | Fix |
|---------|-----|
| Build runs out of memory | Use a 2GB Linode, or add swap |
| Site HTTP only | DNS not pointing yet, or Caddyfile domain typo |
| Auth / cookies wrong | `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` must be `https://queueora.com` (no trailing slash) |
| Login “invalid origin” | Use `https://queueora.com` (not www), or update Caddy to redirect www → apex, then `pm2 restart` |
| Instagram media fetch fails | `PUBLIC_MEDIA_BASE_URL=https://queueora.com` |
| Worker idle forever | `REDIS_URL` and both pm2 processes running |

## Local vs Linode

| | Local | Linode |
|--|-------|--------|
| App URLs | `http://localhost:3001` | `https://queueora.com` |
| DB/Redis | Docker compose | Same compose |
| Processes | `pnpm dev` | `pm2` + Caddy |
| Secrets | `.env` on laptop | `.env` on server (never commit) |
