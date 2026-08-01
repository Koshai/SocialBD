import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../..");
const require = createRequire(path.join(__dirname, "../package.json"));
const { config } = require("dotenv");
config({ path: path.join(monorepoRoot, ".env") });

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/socialbd";

const pool = new Pool({ connectionString: databaseUrl });

try {
  const users = await pool.query(
    `SELECT id, name, email, email_verified, created_at
     FROM "user"
     ORDER BY created_at`,
  );
  const sessions = await pool.query(`SELECT COUNT(*)::int AS count FROM "session"`);
  const accounts = await pool.query(
    `SELECT id, user_id, provider_id FROM "account" ORDER BY created_at`,
  );

  console.log(
    JSON.stringify(
      {
        userCount: users.rowCount,
        users: users.rows.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: u.email_verified,
          createdAt: u.created_at,
        })),
        sessionCount: sessions.rows[0]?.count ?? 0,
        accountCount: accounts.rowCount,
        accounts: accounts.rows.map((a) => ({
          id: a.id,
          userId: a.user_id,
          providerId: a.provider_id,
        })),
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("Verify failed:", error);
  process.exit(1);
} finally {
  await pool.end();
}
