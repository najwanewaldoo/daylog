import {
  sqliteTable,
  text,
  integer,
  real,
  unique,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(), // stored trimmed + lowercase
  passwordHash: text("password_hash").notNull(), // scrypt$<saltB64>$<hashB64>
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // sha256 hex of token
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(), // ISO timestamp
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryDate: text("entry_date").notNull(), // YYYY-MM-DD
    gratitude: text("gratitude"),
    wentWell: text("went_well"),
    challenge: text("challenge"),
    freeText: text("free_text"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userDateUnique: unique("journal_entries_user_date_unique").on(
      table.userId,
      table.entryDate
    ),
  })
);

export const dailyCheckins = sqliteTable(
  "daily_checkins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryDate: text("entry_date").notNull(),
    sleepHours: real("sleep_hours").notNull(), // 0.0 - 24.0
    sleepQuality: integer("sleep_quality").notNull(), // 1 - 5
    energy: integer("energy").notNull(), // 1 - 5
    mood: integer("mood").notNull(), // 1 - 5
    focus: integer("focus").notNull(), // 1 - 5
    workload: integer("workload").notNull(), // 1 - 5
    studyMinutes: integer("study_minutes").notNull(), // >= 0
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userDateUnique: unique("daily_checkins_user_date_unique").on(
      table.userId,
      table.entryDate
    ),
    journalFk: foreignKey({
      columns: [table.userId, table.entryDate],
      foreignColumns: [journalEntries.userId, journalEntries.entryDate],
    }).onDelete("cascade"),
  })
);

export const dailyIntentions = sqliteTable(
  "daily_intentions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetDate: text("target_date").notNull(), // YYYY-MM-DD
    learningPriority: text("learning_priority").notNull(),
    recoveryAction: text("recovery_action").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userTargetDateUnique: unique("daily_intentions_user_target_date_unique").on(
      table.userId,
      table.targetDate
    ),
  })
);

export const weeklyReviews = sqliteTable(
  "weekly_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startDate: text("start_date").notNull(), // YYYY-MM-DD
    endDate: text("end_date").notNull(), // YYYY-MM-DD
    reflection: text("reflection").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    weeklyRange: unique("weekly_reviews_user_start_end_unique").on(
      table.userId,
      table.startDate,
      table.endDate
    ),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type NewDailyCheckin = typeof dailyCheckins.$inferInsert;

export type DailyIntention = typeof dailyIntentions.$inferSelect;
export type NewDailyIntention = typeof dailyIntentions.$inferInsert;

export type WeeklyReviewRecord = typeof weeklyReviews.$inferSelect;
export type NewWeeklyReviewRecord = typeof weeklyReviews.$inferInsert;
