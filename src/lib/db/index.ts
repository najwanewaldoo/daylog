import fs from "fs";
import path from "path";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
// IMPORTANT: use the "/web" entry point for remote (Turso) connections.
// It is pure JavaScript (HTTP/fetch based) and has NO native binaries, so it
// installs and bundles cleanly on Vercel regardless of the Node.js version.
import { createClient as createRemoteClient } from "@libsql/client/web";
import type { Client } from "@libsql/client/web";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

/**
 * Idempotent schema bootstrap (same constraints as before the Turso migration).
 * Safe to run on every cold start: every statement is CREATE ... IF NOT EXISTS.
 * Keep in sync with scripts/migrate-to-turso.mjs.
 */
const SCHEMA_STATEMENTS: string[] = [
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

const LOCAL_URL_PATTERN = /^(file:|:memory:)/i;

function resolveConfig(): { url: string; authToken?: string } {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

  if (url) {
    return { url, authToken };
  }

  // On Vercel there is no writable/persistent disk, so a local file fallback
  // can never work there. Fail loudly with an actionable message instead.
  if (process.env.VERCEL) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN " +
        "in Vercel → Project Settings → Environment Variables, then redeploy."
    );
  }

  // Local development fallback (no Turso credentials needed).
  return { url: "file:./data/daylog.db", authToken: undefined };
}

async function createDbClient(url: string, authToken?: string): Promise<Client> {
  if (LOCAL_URL_PATTERN.test(url)) {
    // Local file / in-memory database: dev & tests only. Needs the native
    // libSQL binding, which is loaded lazily (and hidden from the bundler)
    // so it is never part of the production bundle.
    if (/^file:/i.test(url)) {
      try {
        const filePath = url.replace(/^file:/i, "");
        fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
      } catch {
        // ignore: libSQL will report a clear error if the path is unusable
      }
    }
    const { createClient } = await import(
      /* webpackIgnore: true */ "@libsql/client"
    );
    const client = createClient({ url });
    await client.execute("PRAGMA foreign_keys = ON");
    return client;
  }

  // Remote Turso database over HTTPS (ideal for serverless).
  // "libsql://" URLs are mapped to "https://" to avoid WebSocket connections.
  return createRemoteClient({
    url: url.replace(/^libsql:\/\//i, "https://"),
    authToken,
  });
}

async function initDatabase(): Promise<Database> {
  const { url, authToken } = resolveConfig();
  const client = await createDbClient(url, authToken);
  await client.batch(SCHEMA_STATEMENTS, "write");
  return drizzle(client, { schema });
}

// Cache the initialised connection across hot reloads and warm invocations.
declare global {
  // eslint-disable-next-line no-var
  var __daylogDb: Promise<Database> | undefined;
}

/**
 * Lazily creates (once) and returns the Drizzle database instance.
 * Nothing connects at import time, so `next build` never needs DB credentials.
 */
export function getDb(): Promise<Database> {
  if (!globalThis.__daylogDb) {
    globalThis.__daylogDb = initDatabase().catch((error) => {
      // Don't cache a failed init; the next request will retry.
      globalThis.__daylogDb = undefined;
      throw error;
    });
  }
  return globalThis.__daylogDb;
}
