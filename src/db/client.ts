import pg from "pg";
import type { Env } from "../config/env.js";

export function createPgPool(env: Env) {
  return new pg.Pool({
    connectionString: env.DATABASE_URL,
  });
}

export type PgPool = ReturnType<typeof createPgPool>;
