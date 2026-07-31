import "./load-env";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema/index";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/socialbd";

// Create pool with proper error handling
export const pool = new Pool({ 
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5000,
  max: 20,
});

// Handle pool errors gracefully so they don't crash the app
pool.on("error", (err) => {
  console.error("[db-pool] Unexpected error on idle client:", err);
});

export const db = drizzle(pool, { schema });

export { schema };
