/**
 * Exports every table of the configured database (Turso, or the local file if
 * TURSO_DATABASE_URL is not set) to data/backups/daylog-backup-<timestamp>.json
 *
 * Usage: npm run db:backup
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const TABLES = ["journal_entries", "daily_checkins", "daily_intentions", "weekly_reviews"];

const envUrl = process.env.TURSO_DATABASE_URL?.trim();
const url = envUrl ? envUrl.replace(/^libsql:\/\//i, "https://") : "file:./data/daylog.db";
const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
});

try {
  const backup = { version: "1.0", exportDate: new Date().toISOString(), tables: {} };
  for (const table of TABLES) {
    const rs = await client.execute(`SELECT * FROM ${table} ORDER BY id`);
    backup.tables[table] = rs.rows.map((row) =>
      Object.fromEntries(rs.columns.map((c) => [c, row[c]]))
    );
  }

  const dir = path.join(process.cwd(), "data", "backups");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `daylog-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(backup, null, 2));
  console.log(`Backup created: ${file}`);
  for (const t of TABLES) console.log(`  ${t}: ${backup.tables[t].length} row(s)`);
} catch (err) {
  console.error("Backup failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  client.close();
}
