/**
 * Promote users to workspace owner, and self-heal sole-member orgs stuck as "member".
 *
 * Usage:
 *   node packages/db/scripts/promote-workspace-owners.mjs
 *   node packages/db/scripts/promote-workspace-owners.mjs user1@example.com user2@example.com
 */
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

const emails =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ["khadem.deep@gmail.com", "shishir.artc@gmail.com"];

const pool = new Pool({ connectionString: databaseUrl });

try {
  console.log("DATABASE_URL host:", new URL(databaseUrl.replace(/^postgresql/, "http")).host);

  // Promote sole members of any org to owner.
  const sole = await pool.query(`
    WITH sole AS (
      SELECT organization_id
      FROM member
      GROUP BY organization_id
      HAVING COUNT(*) = 1
    )
    UPDATE member m
    SET role = 'owner'
    FROM sole s
    WHERE m.organization_id = s.organization_id
      AND lower(m.role) IS DISTINCT FROM 'owner'
    RETURNING m.user_id, m.organization_id, m.role
  `);
  console.log(`Sole-member orgs promoted: ${sole.rowCount}`);

  for (const email of emails) {
    const users = await pool.query(
      `SELECT id, email, name FROM "user" WHERE lower(email) = lower($1)`,
      [email.trim()],
    );
    if (users.rowCount === 0) {
      console.log(`\nNo user found for ${email}`);
      continue;
    }
    const u = users.rows[0];
    const updated = await pool.query(
      `UPDATE member SET role = 'owner' WHERE user_id = $1 AND lower(role) IS DISTINCT FROM 'owner' RETURNING organization_id, role`,
      [u.id],
    );
    const memberships = await pool.query(
      `SELECT m.organization_id, m.role, o.name
       FROM member m
       JOIN organization o ON o.id = m.organization_id
       WHERE m.user_id = $1`,
      [u.id],
    );
    console.log(`\n${u.email} (${u.name ?? "—"})`);
    console.log(`  memberships updated to owner: ${updated.rowCount}`);
    for (const row of memberships.rows) {
      console.log(`  - ${row.name} → ${row.role}`);
    }
  }

  // Optional: show pending approvals that owners can now review.
  const pending = await pool.query(`
    SELECT p.id, p.status, o.name AS org_name, u.email AS author
    FROM post p
    JOIN organization o ON o.id = p.organization_id
    LEFT JOIN "user" u ON u.id = p.created_by_user_id
    WHERE p.status = 'pending_approval'
    ORDER BY p.created_at DESC
    LIMIT 20
  `);
  if (pending.rowCount) {
    console.log(`\nPending approval posts (${pending.rowCount} shown):`);
    for (const row of pending.rows) {
      console.log(`  - ${row.org_name} · ${row.author ?? "?"} · ${row.id}`);
    }
    console.log("Owners can approve these under Dashboard → Approvals.");
  }

  console.log("\nDone.");
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await pool.end();
}
