import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { PoolClient } from "pg";
import type { PgPool } from "./client.js";

const MIGRATION_LOCK_KEY = "dike_services_schema_migrations";

type MigrationPool = Pick<PgPool, "connect">;

async function unlock(client: PoolClient) {
  await client.query("SELECT pg_advisory_unlock(hashtext($1)::bigint)", [MIGRATION_LOCK_KEY]);
}

export async function runMigrations(pool: MigrationPool, migrationsDir = path.join(process.cwd(), "migrations")) {
  const client = await pool.connect();
  let locked = false;

  try {
    await client.query("SELECT pg_advisory_lock(hashtext($1)::bigint)", [MIGRATION_LOCK_KEY]);
    locked = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationFiles = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const applied = await client.query<{ name: string }>(
        "SELECT name FROM schema_migrations WHERE name = $1",
        [file],
      );
      if (applied.rowCount) {
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
          [file],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    try {
      if (locked) {
        await unlock(client);
      }
    } finally {
      client.release();
    }
  }
}
