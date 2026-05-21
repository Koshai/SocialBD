import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "../drizzle/0005_content_ideas.sql"), "utf8");
const container = process.env.POSTGRES_CONTAINER ?? "socialbd-postgres-1";

const result = spawnSync(
  "docker",
  ["exec", "-i", container, "psql", "-U", "postgres", "-d", "socialbd"],
  { input: sql, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Content ideas tables migration applied.");
