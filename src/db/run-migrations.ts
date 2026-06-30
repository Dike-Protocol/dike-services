import { loadEnv } from "../config/env.js";
import { createPgPool } from "./client.js";
import { runMigrations } from "./migrations.js";

const env = loadEnv();
const pool = createPgPool(env);

try {
  await runMigrations(pool);
} finally {
  await pool.end();
}
