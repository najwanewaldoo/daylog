import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryDate: text("entry_date").notNull().unique(), // YYYY-MM-DD
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
});

export const dailyCheckins = sqliteTable("daily_checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryDate: text("entry_date")
    .notNull()
    .unique()
    .references(() => journalEntries.entryDate, { onDelete: "cascade" }),
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
});

export const dailyIntentions = sqliteTable("daily_intentions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetDate: text("target_date").notNull().unique(), // YYYY-MM-DD
  learningPriority: text("learning_priority").notNull(),
  recoveryAction: text("recovery_action").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const weeklyReviews = sqliteTable(
  "weekly_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    // Required so weekly reflections can be upserted on (start_date, end_date)
    weeklyRange: unique("weekly_reviews_start_date_end_date_unique").on(
      table.startDate,
      table.endDate
    ),
  })
);

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type NewDailyCheckin = typeof dailyCheckins.$inferInsert;

export type DailyIntention = typeof dailyIntentions.$inferSelect;
export type NewDailyIntention = typeof dailyIntentions.$inferInsert;

export type WeeklyReviewRecord = typeof weeklyReviews.$inferSelect;
export type NewWeeklyReviewRecord = typeof weeklyReviews.$inferInsert;
