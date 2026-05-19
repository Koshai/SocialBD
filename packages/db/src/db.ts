import "./load-env";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema/index";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5434/socialbd";

export const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });

export { schema };
