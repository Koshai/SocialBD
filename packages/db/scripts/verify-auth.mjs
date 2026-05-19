import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../src/schema/index.ts";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
config({ path: path.join(monorepoRoot, ".env") });

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/socialbd";

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool, { schema });

const users = await db.select().from(schema.user);
const sessions = await db
  .select({
    id: schema.session.id,
    userId: schema.session.userId,
    expiresAt: schema.session.expiresAt,
  })
  .from(schema.session);
const accounts = await db
  .select({
    id: schema.account.id,
    userId: schema.account.userId,
    providerId: schema.account.providerId,
  })
  .from(schema.account);

console.log(
  JSON.stringify(
    {
      userCount: users.length,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
      })),
      sessionCount: sessions.length,
      accountCount: accounts.length,
    },
    null,
    2,
  ),
);

await pool.end();
