import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

config({ path: path.join(monorepoRoot, ".env") });
