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
import type { ValidatedCheckin, ValidatedJournal, ValidatedIntention } from "../validation";
import type { DayRecord } from "@/types";

function first<T>(rows: T[]): T | undefined {
  return rows[0];
}

/**
 * Fetch a journal entry by ISO date (YYYY-MM-DD)
 */
export async function getJournalEntry(date: string): Promise<JournalEntry | undefined> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.entryDate, date))
    .limit(1);
  return first(rows);
}

/**
 * Upsert a journal entry (single atomic statement)
 */
export async function saveJournalEntry(data: ValidatedJournal): Promise<JournalEntry> {
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
    .values({ entryDate: data.entryDate, ...fields, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: journalEntries.entryDate,
      set: { ...fields, updatedAt: now },
    })
    .returning();
  return rows[0];
}

/**
 * Fetch checkin by date
 */
export async function getDailyCheckin(date: string): Promise<DailyCheckin | undefined> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(dailyCheckins)
    .where(eq(dailyCheckins.entryDate, date))
    .limit(1);
  return first(rows);
}

/**
 * Upsert a daily check-in with referential integrity:
 * Automatically creates an empty journal entry if one does not exist yet.
 * Both statements run in one atomic batch (one network round trip).
 */
export async function saveDailyCheckin(data: ValidatedCheckin): Promise<DailyCheckin> {
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
      .values({ entryDate: data.entryDate, createdAt: now, updatedAt: now })
      .onConflictDoNothing(),
    db
      .insert(dailyCheckins)
      .values({ entryDate: data.entryDate, ...metrics, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: dailyCheckins.entryDate,
        set: { ...metrics, updatedAt: now },
      })
      .returning(),
  ]);

  return checkinRows[0];
}

/**
 * Fetch intention by target date
 */
export async function getDailyIntention(date: string): Promise<DailyIntention | undefined> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(dailyIntentions)
    .where(eq(dailyIntentions.targetDate, date))
    .limit(1);
  return first(rows);
}

/**
 * Upsert daily intention
 */
export async function saveDailyIntention(data: ValidatedIntention): Promise<DailyIntention> {
  const db = await getDb();
  const now = new Date().toISOString();
  const fields = {
    learningPriority: data.learningPriority,
    recoveryAction: data.recoveryAction,
  };

  const rows = await db
    .insert(dailyIntentions)
    .values({ targetDate: data.targetDate, ...fields, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: dailyIntentions.targetDate,
      set: { ...fields, updatedAt: now },
    })
    .returning();
  return rows[0];
}

/**
 * Get comprehensive record for a single date
 */
export async function getDayRecord(date: string): Promise<DayRecord> {
  const [journal, checkin, intention] = await Promise.all([
    getJournalEntry(date),
    getDailyCheckin(date),
    getDailyIntention(date),
  ]);

  return {
    date,
    journal: journal || null,
    checkin: checkin || null,
    intention: intention || null,
  };
}

/**
 * Get check-ins in date range (inclusive)
 */
export async function getCheckinsInRange(
  startDate: string,
  endDate: string
): Promise<DailyCheckin[]> {
  const db = await getDb();
  return db
    .select()
    .from(dailyCheckins)
    .where(
      and(
        gte(dailyCheckins.entryDate, startDate),
        lte(dailyCheckins.entryDate, endDate)
      )
    )
    .orderBy(dailyCheckins.entryDate);
}

/**
 * Get journals in date range
 */
export async function getJournalsInRange(
  startDate: string,
  endDate: string
): Promise<JournalEntry[]> {
  const db = await getDb();
  return db
    .select()
    .from(journalEntries)
    .where(
      and(
        gte(journalEntries.entryDate, startDate),
        lte(journalEntries.entryDate, endDate)
      )
    )
    .orderBy(journalEntries.entryDate);
}

/**
 * Get intentions in date range
 */
export async function getIntentionsInRange(
  startDate: string,
  endDate: string
): Promise<DailyIntention[]> {
  const db = await getDb();
  return db
    .select()
    .from(dailyIntentions)
    .where(
      and(
        gte(dailyIntentions.targetDate, startDate),
        lte(dailyIntentions.targetDate, endDate)
      )
    )
    .orderBy(dailyIntentions.targetDate);
}

/**
 * Get recent check-ins (up to N items)
 */
export async function getRecentCheckins(limit: number = 7): Promise<DailyCheckin[]> {
  const db = await getDb();
  return db
    .select()
    .from(dailyCheckins)
    .orderBy(desc(dailyCheckins.entryDate))
    .limit(limit);
}

/**
 * Search journal entries by keyword
 */
export async function searchJournals(query: string): Promise<JournalEntry[]> {
  if (!query || query.trim().length === 0) return [];
  const term = `%${query.trim()}%`;
  const db = await getDb();
  return db
    .select()
    .from(journalEntries)
    .where(
      or(
        like(journalEntries.gratitude, term),
        like(journalEntries.wentWell, term),
        like(journalEntries.challenge, term),
        like(journalEntries.freeText, term)
      )
    )
    .orderBy(desc(journalEntries.entryDate));
}

/**
 * Get all records for a month (e.g. "2026-11")
 */
export async function getMonthOverview(yearMonth: string): Promise<DayRecord[]> {
  const [y, m] = yearMonth.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;

  const [journals, checkins, intentions] = await Promise.all([
    getJournalsInRange(start, end),
    getCheckinsInRange(start, end),
    getIntentionsInRange(start, end),
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
 * Get weekly reflection
 */
export async function getWeeklyReflection(
  startDate: string,
  endDate: string
): Promise<WeeklyReviewRecord | undefined> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(weeklyReviews)
    .where(
      and(
        eq(weeklyReviews.startDate, startDate),
        eq(weeklyReviews.endDate, endDate)
      )
    )
    .limit(1);
  return first(rows);
}

/**
 * Upsert weekly reflection
 */
export async function saveWeeklyReflection(
  startDate: string,
  endDate: string,
  reflection: string
): Promise<WeeklyReviewRecord> {
  const db = await getDb();
  const now = new Date().toISOString();

  const rows = await db
    .insert(weeklyReviews)
    .values({ startDate, endDate, reflection, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [weeklyReviews.startDate, weeklyReviews.endDate],
      set: { reflection, updatedAt: now },
    })
    .returning();
  return rows[0];
}

/**
 * Export all personal data
 */
export async function exportAllData() {
  const db = await getDb();
  const [journals, checkins, intentions, weeklyReflections] = await Promise.all([
    db.select().from(journalEntries).orderBy(journalEntries.entryDate),
    db.select().from(dailyCheckins).orderBy(dailyCheckins.entryDate),
    db.select().from(dailyIntentions).orderBy(dailyIntentions.targetDate),
    db.select().from(weeklyReviews).orderBy(weeklyReviews.startDate),
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
 * Delete all personal data (with explicit confirmation).
 * Runs as one atomic batch; check-ins are removed before journals.
 */
export async function deleteAllData(): Promise<boolean> {
  const db = await getDb();
  await db.batch([
    db.delete(dailyCheckins),
    db.delete(journalEntries),
    db.delete(dailyIntentions),
    db.delete(weeklyReviews),
  ]);
  return true;
}
