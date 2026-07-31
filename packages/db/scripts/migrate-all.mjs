import { readdirSync, readFileSync } from "node:fs";
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

const drizzleDir = path.join(__dirname, "../drizzle");
const files = readdirSync(drizzleDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error("No SQL migrations found in packages/db/drizzle");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

console.log(`Applying ${files.length} migrations to database…`);

try {
  for (const file of files) {
    const sql = readFileSync(path.join(drizzleDir, file), "utf8");
    process.stdout.write(`  → ${file} … `);
    await pool.query(sql);
    console.log("ok");
  }
  console.log("All migrations applied.");
} catch (error) {
  console.error("\nMigration failed:", error);
  process.exit(1);
} finally {
  await pool.end();
}
