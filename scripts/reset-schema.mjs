/**
 * Drops the tables (journal_entries, daily_checkins, daily_intentions, weekly_reviews, sessions, users)
 * from the configured database (Turso or local file).
 *
 * Safety: Requires the `--yes` flag to execute.
 *
 * Usage:
 *   npm run db:reset-schema          (dry run / prints what it would do)
 *   npm run db:reset-schema -- --yes (executes the drop)
 */
import { createClient } from "@libsql/client";

const TABLES_TO_DROP = [
  "daily_checkins",
  "journal_entries",
  "daily_intentions",
  "weekly_reviews",
  "sessions",
  "users",
];

const envUrl = process.env.TURSO_DATABASE_URL?.trim();
const url = envUrl
  ? envUrl.replace(/^libsql:\/\//i, "https://")
  : "file:./data/daylog.db";

const hasYes = process.argv.includes("--yes");

console.log(`Configured database URL: ${url}`);

if (!hasYes) {
  console.log("\n[DRY RUN] Schema reset would DROP the following tables:");
  for (const table of TABLES_TO_DROP) {
    console.log(`  - ${table}`);
  }
  console.log("\nNo changes were made.");
  console.log("To confirm and drop all tables, run:");
  console.log("  npm run db:reset-schema -- --yes\n");
  process.exit(0);
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
});

try {
  console.log("\nExecuting schema reset with --yes...");
  await client.execute("PRAGMA foreign_keys = OFF");
  for (const table of TABLES_TO_DROP) {
    await client.execute(`DROP TABLE IF EXISTS ${table}`);
    console.log(`  ✓ Dropped ${table} (if it existed)`);
  }
  await client.execute("PRAGMA foreign_keys = ON");
  console.log("\nSchema reset complete. All specified tables have been dropped.\n");
} catch (err) {
  console.error("Schema reset failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  client.close();
}
