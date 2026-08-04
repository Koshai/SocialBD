/**
 * Create or reset a Meta App Review test user (email verified, ready to sign in).
 *
 * Usage (from monorepo root, with DATABASE_URL in .env):
 *   pnpm db:create-test-user
 *   pnpm db:create-test-user -- testuser@queueora.com 'QueueOra123!'
 *
 * Defaults:
 *   email    testuser@queueora.com
 *   password QueueOra123!
 *   name     Meta App Reviewer
 *   workspace "QueueOra Review Workspace" (created if user has none)
 */
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../..");
const require = createRequire(path.join(__dirname, "../package.json"));
const { config } = require("dotenv");
config({ path: path.join(monorepoRoot, ".env") });

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/socialbd";

const args = process.argv.slice(2).filter((a) => a !== "--");
const email = (args[0] ?? process.env.TEST_USER_EMAIL ?? "testuser@queueora.com")
  .trim()
  .toLowerCase();
const password = args[1] ?? process.env.TEST_USER_PASSWORD ?? "QueueOra123!";
const name = args[2] ?? process.env.TEST_USER_NAME ?? "Meta App Reviewer";
const workspaceName =
  process.env.TEST_USER_WORKSPACE ?? "QueueOra Review Workspace";

async function loadHashPassword() {
  const candidates = [
    path.join(monorepoRoot, "apps/web/node_modules/better-auth/dist/crypto/password.mjs"),
    path.join(monorepoRoot, "node_modules/better-auth/dist/crypto/password.mjs"),
  ];
  for (const file of candidates) {
    try {
      const mod = await import(pathToFileURL(file).href);
      if (typeof mod.hashPassword === "function") return mod.hashPassword;
    } catch {
      // try next
    }
  }
  throw new Error(
    "Could not load better-auth hashPassword. Run from monorepo after pnpm install (apps/web needs better-auth).",
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  const hashPassword = await loadHashPassword();
  const passwordHash = await hashPassword(password);
  const now = new Date();

  const existing = await pool.query(
    `SELECT id, email, email_verified FROM "user" WHERE lower(email) = lower($1)`,
    [email],
  );

  let userId;
  if (existing.rowCount > 0) {
    userId = existing.rows[0].id;
    await pool.query(
      `UPDATE "user"
       SET name = $1, email_verified = true, updated_at = $2
       WHERE id = $3`,
      [name, now, userId],
    );
    const account = await pool.query(
      `SELECT id FROM account WHERE user_id = $1 AND provider_id = 'credential' LIMIT 1`,
      [userId],
    );
    if (account.rowCount > 0) {
      await pool.query(
        `UPDATE account SET password = $1, updated_at = $2 WHERE id = $3`,
        [passwordHash, now, account.rows[0].id],
      );
    } else {
      await pool.query(
        `INSERT INTO account (
          id, account_id, provider_id, user_id, password, created_at, updated_at
        ) VALUES ($1, $2, 'credential', $3, $4, $5, $5)`,
        [randomUUID(), userId, userId, passwordHash, now],
      );
    }
    console.log(`Updated existing user ${email} (verified + password reset).`);
  } else {
    userId = randomUUID();
    await pool.query(
      `INSERT INTO "user" (
        id, name, email, email_verified, image, created_at, updated_at
      ) VALUES ($1, $2, $3, true, null, $4, $4)`,
      [userId, name, email, now],
    );
    await pool.query(
      `INSERT INTO account (
        id, account_id, provider_id, user_id, password, created_at, updated_at
      ) VALUES ($1, $2, 'credential', $3, $4, $5, $5)`,
      [randomUUID(), userId, userId, passwordHash, now],
    );
    console.log(`Created user ${email} (email_verified=true).`);
  }

  const memberships = await pool.query(
    `SELECT organization_id FROM member WHERE user_id = $1 LIMIT 1`,
    [userId],
  );

  if (memberships.rowCount === 0) {
    const orgId = randomUUID();
    let slug = slugify(workspaceName) || "review-workspace";
    const slugClash = await pool.query(`SELECT 1 FROM organization WHERE slug = $1`, [slug]);
    if (slugClash.rowCount > 0) {
      slug = `${slug}-${randomUUID().slice(0, 8)}`;
    }
    await pool.query(
      `INSERT INTO organization (id, name, slug, logo, metadata, created_at)
       VALUES ($1, $2, $3, null, null, $4)`,
      [orgId, workspaceName, slug, now],
    );
    await pool.query(
      `INSERT INTO member (id, organization_id, user_id, role, created_at)
       VALUES ($1, $2, $3, 'owner', $4)`,
      [randomUUID(), orgId, userId, now],
    );
    console.log(`Created workspace "${workspaceName}" (owner). slug=${slug}`);
  } else {
    await pool.query(
      `UPDATE member SET role = 'owner' WHERE user_id = $1 AND lower(role) IS DISTINCT FROM 'owner'`,
      [userId],
    );
    console.log("User already has a workspace (role set to owner where needed).");
  }

  console.log("\nMeta App Review credentials:");
  console.log(`  URL:      ${process.env.NEXT_PUBLIC_APP_URL ?? "https://queueora.com"}/login`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("  Note: email is pre-verified (no Resend required).");
  console.log(
    "  Facebook connect still requires a Meta App Tester/Admin or Advanced Access for Pages.",
  );
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await pool.end();
}
