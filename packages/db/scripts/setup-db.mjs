import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "../drizzle/0000_auth.sql");
const sql = readFileSync(sqlPath, "utf8");

const container = process.env.POSTGRES_CONTAINER ?? "socialbd-postgres-1";

const result = spawnSync(
  "docker",
  ["exec", "-i", container, "psql", "-U", "postgres", "-d", "socialbd"],
  { input: sql, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] },
);

if (result.error) {
  console.error("Failed to run docker. Is Docker running?");
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Auth tables created successfully.");
