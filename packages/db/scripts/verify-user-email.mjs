import { Pool } from "pg";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node verify-user-email.mjs <email>");
  process.exit(1);
}

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/socialbd",
});

const result = await pool.query(
  `UPDATE "user" SET email_verified = true WHERE lower(email) = lower($1)`,
  [email],
);

console.log(`Updated ${result.rowCount} user(s) for ${email}`);
await pool.end();
