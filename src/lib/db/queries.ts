import { getDb } from "./index";
import {
  journalEntries,
  dailyCheckins,
  dailyIntentions,
  weeklyReviews,
  type JournalEntry,
  type DailyCheckin,
  type DailyIntention,
  type WeeklyReviewRecord,
} from "./schema";
import { eq, desc, and, gte, lte, or, like } from "drizzle-orm";
import type {
  ValidatedCheckin,
  ValidatedJournal,
  ValidatedIntention,
} from "../validation";
import type { DayRecord } from "@/types";

function first<T>(rows: T[]): T | undefined {
  return rows[0];
}

/**
 * Fetch a journal entry by ISO date (YYYY-MM-DD) for a specific user
 */
export async function getJournalEntry(
  userId: number,
  date: string
): Promise<JournalEntry | undefined> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.entryDate, date)
      )
    )
    .limit(1);
  return first(rows);
}

/**
 * Upsert a journal entry for a specific user (atomic statement)
 */
export async function saveJournalEntry(
  userId: number,
  data: ValidatedJournal
): Promise<JournalEntry> {
  const db = await getDb();
  const now = new Date().toISOString();
  const fields = {
    gratitude: data.gratitude ?? null,
    wentWell: data.wentWell ?? null,
    challenge: data.challenge ?? null,
    freeText: data.freeText ?? null,
  };

  const rows = await db
    .insert(journalEntries)
    .values({
      userId,
      entryDate: data.entryDate,
      ...fields,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [journalEntries.userId, journalEntries.entryDate],
      set: { ...fields, updatedAt: now },
    })
    .returning();
  return rows[0];
}

/**
 * Fetch check-in by date for a specific user
 */
export async function getDailyCheckin(
  userId: number,
  date: string
): Promise<DailyCheckin | undefined> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(dailyCheckins)
    .where(
      and(
        eq(dailyCheckins.userId, userId),
        eq(dailyCheckins.entryDate, date)
      )
    )
    .limit(1);
  return first(rows);
}

/**
 * Upsert a daily check-in with referential integrity for a specific user:
 * Automatically creates an empty journal entry if one does not exist yet.
 * Both statements run in one atomic batch (one network round trip).
 */
export async function saveDailyCheckin(
  userId: number,
  data: ValidatedCheckin
): Promise<DailyCheckin> {
  const db = await getDb();
  const now = new Date().toISOString();
  const metrics = {
    sleepHours: data.sleepHours,
    sleepQuality: data.sleepQuality,
    energy: data.energy,
    mood: data.mood,
    focus: data.focus,
    workload: data.workload,
    studyMinutes: data.studyMinutes,
  };

  const [, checkinRows] = await db.batch([
    db
      .insert(journalEntries)
      .values({
        userId,
        entryDate: data.entryDate,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing(),
    db
      .insert(dailyCheckins)
      .values({
        userId,
        entryDate: data.entryDate,
        ...metrics,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [dailyCheckins.userId, dailyCheckins.entryDate],
        set: { ...metrics, updatedAt: now },
      })
      .returning(),
  ]);

  return checkinRows[0];
}

/**
 * Fetch intention by target date for a specific user
 */
export async function getDailyIntention(
  userId: number,
  date: string
): Promise<DailyIntention | undefined> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(dailyIntentions)
    .where(
      and(
        eq(dailyIntentions.userId, userId),
        eq(dailyIntentions.targetDate, date)
      )
    )
    .limit(1);
  return first(rows);
}

/**
 * Upsert daily intention for a specific user
 */
export async function saveDailyIntention(
  userId: number,
  data: ValidatedIntention
): Promise<DailyIntention> {
  const db = await getDb();
  const now = new Date().toISOString();
  const fields = {
    learningPriority: data.learningPriority,
    recoveryAction: data.recoveryAction,
  };

  const rows = await db
    .insert(dailyIntentions)
    .values({
      userId,
      targetDate: data.targetDate,
      ...fields,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [dailyIntentions.userId, dailyIntentions.targetDate],
      set: { ...fields, updatedAt: now },
    })
    .returning();
  return rows[0];
}

/**
 * Get comprehensive record for a single date for a specific user
 */
export async function getDayRecord(
  userId: number,
  date: string
): Promise<DayRecord> {
  const [journal, checkin, intention] = await Promise.all([
    getJournalEntry(userId, date),
    getDailyCheckin(userId, date),
    getDailyIntention(userId, date),
  ]);

  return {
    date,
    journal: journal || null,
    checkin: checkin || null,
    intention: intention || null,
  };
}

/**
 * Get check-ins in date range (inclusive) for a specific user
 */
export async function getCheckinsInRange(
  userId: number,
  startDate: string,
  endDate: string
): Promise<DailyCheckin[]> {
  const db = await getDb();
  return db
    .select()
    .from(dailyCheckins)
    .where(
      and(
        eq(dailyCheckins.userId, userId),
        gte(dailyCheckins.entryDate, startDate),
        lte(dailyCheckins.entryDate, endDate)
      )
    )
    .orderBy(dailyCheckins.entryDate);
}

/**
 * Get journals in date range for a specific user
 */
export async function getJournalsInRange(
  userId: number,
  startDate: string,
  endDate: string
): Promise<JournalEntry[]> {
  const db = await getDb();
  return db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.entryDate, startDate),
        lte(journalEntries.entryDate, endDate)
      )
    )
    .orderBy(journalEntries.entryDate);
}

/**
 * Get intentions in date range for a specific user
 */
export async function getIntentionsInRange(
  userId: number,
  startDate: string,
  endDate: string
): Promise<DailyIntention[]> {
  const db = await getDb();
  return db
    .select()
    .from(dailyIntentions)
    .where(
      and(
        eq(dailyIntentions.userId, userId),
        gte(dailyIntentions.targetDate, startDate),
        lte(dailyIntentions.targetDate, endDate)
      )
    )
    .orderBy(dailyIntentions.targetDate);
}

/**
 * Get recent check-ins (up to N items) for a specific user
 */
export async function getRecentCheckins(
  userId: number,
  limit: number = 7
): Promise<DailyCheckin[]> {
  const db = await getDb();
  return db
    .select()
    .from(dailyCheckins)
    .where(eq(dailyCheckins.userId, userId))
    .orderBy(desc(dailyCheckins.entryDate))
    .limit(limit);
}

/**
 * Search journal entries by keyword for a specific user
 */
export async function searchJournals(
  userId: number,
  query: string
): Promise<JournalEntry[]> {
  if (!query || query.trim().length === 0) return [];
  const term = `%${query.trim()}%`;
  const db = await getDb();
  return db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        or(
          like(journalEntries.gratitude, term),
          like(journalEntries.wentWell, term),
          like(journalEntries.challenge, term),
          like(journalEntries.freeText, term)
        )
      )
    )
    .orderBy(desc(journalEntries.entryDate));
}

/**
 * Get all records for a month (e.g. "2026-11") for a specific user
 */
export async function getMonthOverview(
  userId: number,
  yearMonth: string
): Promise<DayRecord[]> {
  const [y, m] = yearMonth.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;

  const [journals, checkins, intentions] = await Promise.all([
    getJournalsInRange(userId, start, end),
    getCheckinsInRange(userId, start, end),
    getIntentionsInRange(userId, start, end),
  ]);

  // Map by date
  const map = new Map<string, DayRecord>();

  for (const j of journals) {
    map.set(j.entryDate, {
      date: j.entryDate,
      journal: j,
      checkin: null,
      intention: null,
    });
  }

  for (const c of checkins) {
    const rec = map.get(c.entryDate) || {
      date: c.entryDate,
      journal: null,
      checkin: null,
      intention: null,
    };
    rec.checkin = c;
    map.set(c.entryDate, rec);
  }

  for (const i of intentions) {
    const rec = map.get(i.targetDate) || {
      date: i.targetDate,
      journal: null,
      checkin: null,
      intention: null,
    };
    rec.intention = i;
    map.set(i.targetDate, rec);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get weekly reflection for a specific user
 */
export async function getWeeklyReflection(
  userId: number,
  startDate: string,
  endDate: string
): Promise<WeeklyReviewRecord | undefined> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(weeklyReviews)
    .where(
      and(
        eq(weeklyReviews.userId, userId),
        eq(weeklyReviews.startDate, startDate),
        eq(weeklyReviews.endDate, endDate)
      )
    )
    .limit(1);
  return first(rows);
}

/**
 * Upsert weekly reflection for a specific user
 */
export async function saveWeeklyReflection(
  userId: number,
  startDate: string,
  endDate: string,
  reflection: string
): Promise<WeeklyReviewRecord> {
  const db = await getDb();
  const now = new Date().toISOString();

  const rows = await db
    .insert(weeklyReviews)
    .values({
      userId,
      startDate,
      endDate,
      reflection,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        weeklyReviews.userId,
        weeklyReviews.startDate,
        weeklyReviews.endDate,
      ],
      set: { reflection, updatedAt: now },
    })
    .returning();
  return rows[0];
}

/**
 * Export all personal data for a specific user
 */
export async function exportAllData(userId: number) {
  const db = await getDb();
  const [journals, checkins, intentions, weeklyReflections] = await Promise.all([
    db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(journalEntries.entryDate),
    db
      .select()
      .from(dailyCheckins)
      .where(eq(dailyCheckins.userId, userId))
      .orderBy(dailyCheckins.entryDate),
    db
      .select()
      .from(dailyIntentions)
      .where(eq(dailyIntentions.userId, userId))
      .orderBy(dailyIntentions.targetDate),
    db
      .select()
      .from(weeklyReviews)
      .where(eq(weeklyReviews.userId, userId))
      .orderBy(weeklyReviews.startDate),
  ]);

  return {
    version: "1.0",
    exportDate: new Date().toISOString(),
    stats: {
      journalEntriesCount: journals.length,
      checkinsCount: checkins.length,
      intentionsCount: intentions.length,
      weeklyReviewsCount: weeklyReflections.length,
    },
    journalEntries: journals,
    dailyCheckins: checkins,
    dailyIntentions: intentions,
    weeklyReviews: weeklyReflections,
  };
}

/**
 * Delete all personal data for a specific user (with explicit confirmation).
 * Runs as one atomic batch; check-ins are removed before journals.
 * Keeps the user's account intact.
 */
export async function deleteAllData(userId: number): Promise<boolean> {
  const db = await getDb();
  await db.batch([
    db.delete(dailyCheckins).where(eq(dailyCheckins.userId, userId)),
    db.delete(journalEntries).where(eq(journalEntries.userId, userId)),
    db.delete(dailyIntentions).where(eq(dailyIntentions.userId, userId)),
    db.delete(weeklyReviews).where(eq(weeklyReviews.userId, userId)),
  ]);
  return true;
}
