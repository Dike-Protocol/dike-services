import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runMigrations } from "./migrations.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, {
    force: true,
    recursive: true,
  })));
});

describe("runMigrations", () => {
  it("uses an advisory lock around migration checks and applies migrations idempotently", async () => {
    const migrationsDir = await mkdtemp(path.join(os.tmpdir(), "dike-migrations-"));
    tempDirs.push(migrationsDir);
    await writeFile(path.join(migrationsDir, "001_test.sql"), "CREATE TABLE test_table (id INT);");

    const query = vi.fn(async (sql: string) => {
      if (sql.startsWith("SELECT name FROM schema_migrations")) {
        return {
          rowCount: 0,
          rows: [],
        };
      }
      return {
        rowCount: 1,
        rows: [],
      };
    });
    const release = vi.fn();
    const client = {
      query,
      release,
    };
    const pool = {
      connect: vi.fn().mockResolvedValue(client),
    };

    await runMigrations(pool as never, migrationsDir);

    const statements = query.mock.calls.map(([sql]) => sql);
    expect(statements[0]).toContain("pg_advisory_lock");
    expect(statements).toContain("BEGIN");
    expect(statements).toContain("CREATE TABLE test_table (id INT);");
    expect(statements.some((sql) => sql.includes("ON CONFLICT (name) DO NOTHING"))).toBe(true);
    expect(statements.at(-1)).toContain("pg_advisory_unlock");
    expect(release).toHaveBeenCalledOnce();
  });
});
