# QueueOra

Social media scheduling platform — Turborepo monorepo (formerly SocialBD).

## Structure

```
apps/
  web/       Next.js 16 dashboard & marketing
  worker/    BullMQ publish worker
packages/
  ui/        Shared React components & design tokens
  db/        Drizzle ORM schema & migrations
  eslint-config/
  typescript-config/
```

## Prerequisites

- Node.js 20.9+
- pnpm 9+
- Docker (optional, for Postgres + Valkey)

## Setup

```bash
pnpm install
cp .env.example .env
docker compose up -d   # Postgres on host port 5434 (avoids local PG on 5433)
pnpm db:setup          # create auth tables (first time; uses docker exec)
# or: pnpm db:push     # alternative if host can reach Postgres on 5434
pnpm dev
```

## Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `pnpm dev`     | Start web + worker in development    |
| `pnpm build`   | Production build (all packages)      |
| `pnpm lint`    | ESLint across the monorepo           |
| `pnpm typecheck` | TypeScript check                   |

## Apps

- **Web:** http://localhost:3000 (`@socialbd/web`)
- **Worker:** listens on BullMQ queue `publish` (requires Redis/Valkey)
- **Brand domain:** https://queueora.com

## Deploy

See **[RAILWAY.md](./RAILWAY.md)** for Postgres + Redis + web + worker on Railway.
