import "./load-env";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema/index";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/socialbd";

// Lazy initialization: don't create pool until first use
let pool: Pool | null = null;
let db_instance: ReturnType<typeof drizzle> | null = null;

function initializePool() {
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
    // Handle connection errors gracefully
    pool.on("error", (err) => {
      console.error("[db-pool] Unexpected error on idle client:", err);
    });
  }
  return pool;
}

export function getPool() {
  return initializePool();
}

export function getDb() {
  if (!db_instance) {
    const p = initializePool();
    db_instance = drizzle(p, { schema });
  }
  return db_instance;
}

// Lazy getters for backward compatibility
Object.defineProperty(exports, "pool", {
  get: () => {
    console.warn("[db] Direct pool access is deprecated. Use getPool() instead.");
    return initializePool();
  },
});

Object.defineProperty(exports, "db", {
  get: () => getDb(),
});

export { schema };
