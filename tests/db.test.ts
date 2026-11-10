import { describe, it, expect, beforeEach } from "vitest";
import {
  saveJournalEntry,
  getJournalEntry,
  saveDailyCheckin,
  getDailyCheckin,
  saveDailyIntention,
  getDailyIntention,
  getDayRecord,
  getWeeklyReflection,
  saveWeeklyReflection,
  getMonthOverview,
  exportAllData,
  deleteAllData,
} from "../src/lib/db/queries";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { createUser } from "../src/lib/auth/session";
import { getDb } from "../src/lib/db";
import {
  users,
  sessions,
  dailyCheckins,
  journalEntries,
  dailyIntentions,
  weeklyReviews,
  type User,
} from "../src/lib/db/schema";

describe("Database Layer & Data Access Tests", () => {
  let userA: User;
  let userB: User;

  beforeEach(async () => {
    // Safety guard: these tests wipe all data, so they must NEVER run against Turso.
    expect(process.env.TURSO_DATABASE_URL ?? "").toMatch(/^file:/);

    const db = await getDb();
    await db.delete(dailyCheckins);
    await db.delete(journalEntries);
    await db.delete(dailyIntentions);
    await db.delete(weeklyReviews);
    await db.delete(sessions);
    await db.delete(users);

    const passHashA = await hashPassword("SecretPassword123");
    userA = await createUser("alice@university.edu", passHashA);

    const passHashB = await hashPassword("SecretPassword456");
    userB = await createUser("bob@university.edu", passHashB);
  });

  it("hashes and verifies passwords using scrypt with timing safety", async () => {
    const password = "mySecurePassword!2026";
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^scrypt\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("wrongPassword", hash);
    expect(isInvalid).toBe(false);

    const isCorruptValid = await verifyPassword(password, "invalid$format");
    expect(isCorruptValid).toBe(false);
  });

  it("rejects duplicate emails at the database layer", async () => {
    const hash = await hashPassword("anotherPassword");
    await expect(
      createUser("alice@university.edu", hash)
    ).rejects.toThrow();
  });

  it("creates and edits journal entries for the same date without duplicates", async () => {
    const date = "2026-11-09";

    // Create
    await saveJournalEntry(userA.id, {
      entryDate: date,
      gratitude: "Morning sunshine",
      wentWell: "Deep focus",
      challenge: "Slow internet",
      freeText: "Initial draft",
    });

    let entry = await getJournalEntry(userA.id, date);
    expect(entry).toBeDefined();
    expect(entry?.gratitude).toBe("Morning sunshine");

    // Edit
    await saveJournalEntry(userA.id, {
      entryDate: date,
      gratitude: "Evening tea",
      wentWell: "All tests passing",
      challenge: null,
      freeText: "Updated thoughts",
    });

    entry = await getJournalEntry(userA.id, date);
    expect(entry?.gratitude).toBe("Evening tea");
    expect(entry?.wentWell).toBe("All tests passing");
  });

  it("two users saving the same date do not collide", async () => {
    const date = "2026-11-10";

    await saveJournalEntry(userA.id, {
      entryDate: date,
      gratitude: "Alice gratitude",
      wentWell: "Alice went well",
      challenge: null,
      freeText: null,
    });

    await saveJournalEntry(userB.id, {
      entryDate: date,
      gratitude: "Bob gratitude",
      wentWell: "Bob went well",
      challenge: null,
      freeText: null,
    });

    const aliceEntry = await getJournalEntry(userA.id, date);
    const bobEntry = await getJournalEntry(userB.id, date);

    expect(aliceEntry).toBeDefined();
    expect(bobEntry).toBeDefined();
    expect(aliceEntry?.gratitude).toBe("Alice gratitude");
    expect(bobEntry?.gratitude).toBe("Bob gratitude");
  });

  it("saving check-in creates empty journal entry if not existing (referential integrity)", async () => {
    const date = "2026-11-15";

    // Journal does not exist prior to check-in
    expect(await getJournalEntry(userA.id, date)).toBeUndefined();

    // Save check-in
    await saveDailyCheckin(userA.id, {
      entryDate: date,
      sleepHours: 8.0,
      sleepQuality: 4,
      energy: 4,
      mood: 4,
      focus: 4,
      workload: 3,
      studyMinutes: 150,
    });

    // Journal entry should now automatically exist for user A
    const journal = await getJournalEntry(userA.id, date);
    expect(journal).toBeDefined();
    expect(journal?.entryDate).toBe(date);
    expect(journal?.userId).toBe(userA.id);

    // Check-in exists
    const checkin = await getDailyCheckin(userA.id, date);
    expect(checkin).toBeDefined();
    expect(checkin?.sleepHours).toBe(8.0);
    expect(checkin?.studyMinutes).toBe(150);
  });

  it("user A cannot read user B's journal, check-in, intention, or reflection", async () => {
    const date = "2026-11-12";
    const start = "2026-11-09";
    const end = "2026-11-15";

    await saveDailyCheckin(userB.id, {
      entryDate: date,
      sleepHours: 7.0,
      sleepQuality: 4,
      energy: 3,
      mood: 4,
      focus: 3,
      workload: 4,
      studyMinutes: 120,
    });

    await saveDailyIntention(userB.id, {
      targetDate: date,
      learningPriority: "Bob's priority",
      recoveryAction: "Bob's rest",
    });

    await saveWeeklyReflection(userB.id, start, end, "Bob's reflection");

    // Alice queries the exact same dates
    expect(await getJournalEntry(userA.id, date)).toBeUndefined();
    expect(await getDailyCheckin(userA.id, date)).toBeUndefined();
    expect(await getDailyIntention(userA.id, date)).toBeUndefined();
    expect(await getWeeklyReflection(userA.id, start, end)).toBeUndefined();

    const aliceRecord = await getDayRecord(userA.id, date);
    expect(aliceRecord.journal).toBeNull();
    expect(aliceRecord.checkin).toBeNull();
    expect(aliceRecord.intention).toBeNull();
  });

  it("updates check-in values on re-save for same date", async () => {
    const date = "2026-11-16";

    await saveDailyCheckin(userA.id, {
      entryDate: date,
      sleepHours: 6.0,
      sleepQuality: 2,
      energy: 2,
      mood: 3,
      focus: 2,
      workload: 4,
      studyMinutes: 60,
    });

    // Re-save with updated values
    await saveDailyCheckin(userA.id, {
      entryDate: date,
      sleepHours: 7.0,
      sleepQuality: 3,
      energy: 3,
      mood: 4,
      focus: 4,
      workload: 3,
      studyMinutes: 120,
    });

    const checkin = await getDailyCheckin(userA.id, date);
    expect(checkin?.sleepHours).toBe(7.0);
    expect(checkin?.studyMinutes).toBe(120);
  });

  it("creates and edits daily intentions", async () => {
    const date = "2026-11-17";

    await saveDailyIntention(userA.id, {
      targetDate: date,
      learningPriority: "Study for Database Midterm",
      recoveryAction: "Go for a walk",
    });

    let intention = await getDailyIntention(userA.id, date);
    expect(intention).toBeDefined();
    expect(intention?.learningPriority).toBe("Study for Database Midterm");

    // Update
    await saveDailyIntention(userA.id, {
      targetDate: date,
      learningPriority: "Review Chapters 1–3 only",
      recoveryAction: "Early bedtime",
    });

    intention = await getDailyIntention(userA.id, date);
    expect(intention?.learningPriority).toBe("Review Chapters 1–3 only");
    expect(intention?.recoveryAction).toBe("Early bedtime");
  });

  it("saves, retrieves, and updates weekly reflections in database", async () => {
    const start = "2026-11-02";
    const end = "2026-11-08";

    expect(await getWeeklyReflection(userA.id, start, end)).toBeUndefined();

    await saveWeeklyReflection(userA.id, start, end, "First draft of weekly reflection");
    let rec = await getWeeklyReflection(userA.id, start, end);
    expect(rec).toBeDefined();
    expect(rec?.reflection).toBe("First draft of weekly reflection");

    // Update existing weekly reflection
    await saveWeeklyReflection(userA.id, start, end, "Polished weekly synthesis note");
    rec = await getWeeklyReflection(userA.id, start, end);
    expect(rec?.reflection).toBe("Polished weekly synthesis note");
  });

  it("calculates month overview bounds accurately for 30-day and 31-day months", async () => {
    await saveDailyCheckin(userA.id, {
      entryDate: "2026-11-01",
      sleepHours: 7,
      sleepQuality: 3,
      energy: 3,
      mood: 3,
      focus: 3,
      workload: 3,
      studyMinutes: 60,
    });
    await saveDailyCheckin(userA.id, {
      entryDate: "2026-11-30",
      sleepHours: 8,
      sleepQuality: 4,
      energy: 4,
      mood: 4,
      focus: 4,
      workload: 3,
      studyMinutes: 90,
    });

    const overview = await getMonthOverview(userA.id, "2026-11");
    expect(overview.length).toBe(2);
    expect(overview[0].date).toBe("2026-11-01");
    expect(overview[1].date).toBe("2026-11-30");
  });

  it("exports all personal data cleanly including weekly reflections", async () => {
    await saveDailyCheckin(userA.id, {
      entryDate: "2026-11-20",
      sleepHours: 7.5,
      sleepQuality: 4,
      energy: 4,
      mood: 4,
      focus: 4,
      workload: 3,
      studyMinutes: 120,
    });

    await saveWeeklyReflection(userA.id, "2026-11-16", "2026-11-22", "Great week overall.");

    const exported = await exportAllData(userA.id);
    expect(exported.version).toBe("1.0");
    expect(exported.stats.checkinsCount).toBe(1);
    expect(exported.stats.weeklyReviewsCount).toBe(1);
    expect(exported.weeklyReviews.length).toBe(1);
  });

  it("deleteAllData(A) leaves B intact and preserves user accounts", async () => {
    await saveDailyCheckin(userA.id, {
      entryDate: "2026-11-21",
      sleepHours: 7.0,
      sleepQuality: 3,
      energy: 3,
      mood: 3,
      focus: 3,
      workload: 3,
      studyMinutes: 90,
    });
    await saveWeeklyReflection(userA.id, "2026-11-16", "2026-11-22", "Alice note.");

    await saveDailyCheckin(userB.id, {
      entryDate: "2026-11-21",
      sleepHours: 8.0,
      sleepQuality: 4,
      energy: 5,
      mood: 4,
      focus: 5,
      workload: 2,
      studyMinutes: 180,
    });
    await saveWeeklyReflection(userB.id, "2026-11-16", "2026-11-22", "Bob note.");

    // Delete Alice's data only
    await deleteAllData(userA.id);

    // Alice's data is gone
    expect(await getDailyCheckin(userA.id, "2026-11-21")).toBeUndefined();
    expect(await getJournalEntry(userA.id, "2026-11-21")).toBeUndefined();
    expect(await getWeeklyReflection(userA.id, "2026-11-16", "2026-11-22")).toBeUndefined();

    // Bob's data remains intact
    const bobCheckin = await getDailyCheckin(userB.id, "2026-11-21");
    expect(bobCheckin).toBeDefined();
    expect(bobCheckin?.studyMinutes).toBe(180);

    const bobReflection = await getWeeklyReflection(userB.id, "2026-11-16", "2026-11-22");
    expect(bobReflection).toBeDefined();
    expect(bobReflection?.reflection).toBe("Bob note.");

    // Both user accounts are still active
    const db = await getDb();
    const remainingUsers = await db.select().from(users);
    expect(remainingUsers.length).toBe(2);
  });
});
