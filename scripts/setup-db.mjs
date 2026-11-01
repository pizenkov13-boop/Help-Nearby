/**
 * Creates the Help Nearby tables from supabase/schema.sql when they do not exist yet.
 * Runs before `next build` (npm run setup). It never fails the build.
 *
 * - No connection string (POSTGRES_URL_NON_POOLING or DATABASE_URL) -> skipped.
 * - `organizations` already exists -> skipped, nothing is read or changed (safe on an existing site).
 * - Otherwise the whole schema is applied in one transaction.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const SCHEMA_PATH = fileURLToPath(new URL("../supabase/schema.sql", import.meta.url));

function connectionString() {
  const raw = (process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || "").trim();
  if (!raw) return null;
  try {
    // Supabase uses a certificate chain Node does not trust by default; TLS is kept, verification is relaxed below.
    const url = new URL(raw);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("supa");
    return url.toString();
  } catch {
    return null;
  }
}

async function main() {
  const connection = connectionString();
  if (!connection) {
    console.log("[setup-db] no database connection string set; skipping.");
    return;
  }

  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(connection);
  const client = new pg.Client({
    connectionString: connection,
    ssl: local ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });

  await client.connect();
  try {
    const { rows } = await client.query("SELECT to_regclass('public.organizations') AS found");
    if (rows[0]?.found) {
      console.log("[setup-db] tables already exist; nothing to do.");
      return;
    }

    const schema = await readFile(SCHEMA_PATH, "utf8");
    await client.query("BEGIN");
    try {
      await client.query(schema);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    console.log("[setup-db] schema created.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  // Never block the build: the site still runs (OpenStreetMap only) and the SQL can be run by hand.
  console.warn(`[setup-db] could not apply the schema (${error?.code ?? error?.name ?? "error"}): ${error?.message ?? error}`);
});
