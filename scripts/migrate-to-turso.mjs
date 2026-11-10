/**
 * One-off migration: copies all data from the local SQLite file
 * (default ./data/daylog.db) into your Turso database.
 *
 * Usage:
 *   1. Put TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local
 *   2. npm run db:migrate-to-turso
 *      (optional: -- --source ./path/to/daylog.db   |   -- --force)
 *
 * Safe by design:
 *   - Never modifies your local data.
 *   - Refuses to run if the Turso tables already contain rows (unless --force,
 *     which merges and skips rows that already exist).
 *   - Verifies row counts at the end.
 *
 * NOTE: keep daylog.db-wal / daylog.db-shm next to daylog.db if they exist;
 * they can contain recent writes that are not yet in the main file.
 */
import fs from "node:fs";
import { createClient } from "@libsql/client";

// Keep in sync with src/lib/db/index.ts
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL UNIQUE,
    gratitude TEXT,
    went_well TEXT,
    challenge TEXT,
    free_text TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS daily_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL UNIQUE,
    sleep_hours REAL NOT NULL CHECK(sleep_hours >= 0.0 AND sleep_hours <= 24.0),
    sleep_quality INTEGER NOT NULL CHECK(sleep_quality >= 1 AND sleep_quality <= 5),
    energy INTEGER NOT NULL CHECK(energy >= 1 AND energy <= 5),
    mood INTEGER NOT NULL CHECK(mood >= 1 AND mood <= 5),
    focus INTEGER NOT NULL CHECK(focus >= 1 AND focus <= 5),
    workload INTEGER NOT NULL CHECK(workload >= 1 AND workload <= 5),
    study_minutes INTEGER NOT NULL CHECK(study_minutes >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_date) REFERENCES journal_entries(entry_date) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS daily_intentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_date TEXT NOT NULL UNIQUE,
    learning_priority TEXT NOT NULL,
    recovery_action TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS weekly_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reflection TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(start_date, end_date)
  )`,
];

// Parent table first (daily_checkins references journal_entries).
const TABLES = [
  { name: "journal_entries", columns: ["id", "entry_date", "gratitude", "went_well", "challenge", "free_text", "created_at", "updated_at"] },
  { name: "daily_checkins", columns: ["id", "entry_date", "sleep_hours", "sleep_quality", "energy", "mood", "focus", "workload", "study_minutes", "created_at", "updated_at"] },
  { name: "daily_intentions", columns: ["id", "target_date", "learning_priority", "recovery_action", "created_at", "updated_at"] },
  { name: "weekly_reviews", columns: ["id", "start_date", "end_date", "reflection", "created_at", "updated_at"] },
];

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const srcIdx = args.indexOf("--source");
const sourcePath = (srcIdx !== -1 && args[srcIdx + 1]) || "./data/daylog.db";

const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

if (!tursoUrl || /^(file:|:memory:)/i.test(tursoUrl)) {
  fail("TURSO_DATABASE_URL must be set (in .env.local) to your remote Turso URL, e.g. libsql://name-org.turso.io");
}
if (!fs.existsSync(sourcePath)) {
  fail(`Local database not found at ${sourcePath}. Use: npm run db:migrate-to-turso -- --source <path>`);
}

const source = createClient({ url: `file:${sourcePath.replace(/\\/g, "/")}` });
const dest = createClient({
  url: tursoUrl.replace(/^libsql:\/\//i, "https://"),
  authToken: tursoToken,
});

async function count(client, table) {
  const rs = await client.execute(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(rs.rows[0].c);
}

try {
  console.log(`Source : ${sourcePath}`);
  console.log(`Target : ${tursoUrl}\n`);

  await dest.batch(SCHEMA_STATEMENTS, "write");

  if (!force) {
    for (const t of TABLES) {
      const n = await count(dest, t.name);
      if (n > 0) {
        fail(`Turso table "${t.name}" already has ${n} row(s). Nothing was changed. Re-run with "-- --force" to merge (existing rows are kept).`);
      }
    }
  }

  const summary = [];
  for (const t of TABLES) {
    let rows = [];
    try {
      const rs = await source.execute(`SELECT ${t.columns.join(", ")} FROM ${t.name} ORDER BY id`);
      rows = rs.rows;
    } catch (err) {
      console.log(`- ${t.name}: not found in source, skipped (${err.message})`);
      summary.push({ table: t.name, source: 0, turso: await count(dest, t.name) });
      continue;
    }

    const placeholders = t.columns.map(() => "?").join(", ");
    const sql = `INSERT INTO ${t.name} (${t.columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
    const statements = rows.map((row) => ({
      sql,
      args: t.columns.map((c) => (row[c] === undefined ? null : row[c])),
    }));

    for (let i = 0; i < statements.length; i += 100) {
      await dest.batch(statements.slice(i, i + 100), "write");
    }

    summary.push({ table: t.name, source: rows.length, turso: await count(dest, t.name) });
    console.log(`✓ ${t.name}: ${rows.length} row(s) copied`);
  }

  console.log("\nVerification:");
  console.table(summary);

  const bad = summary.filter((s) => s.turso < s.source);
  if (bad.length > 0) {
    fail("Row counts in Turso are lower than in the local database. Please review the table above.");
  }
  console.log("\n✔ Migration finished successfully.");
} catch (err) {
  fail(`Migration failed: ${err instanceof Error ? err.message : String(err)}`);
} finally {
  source.close();
  dest.close();
}
