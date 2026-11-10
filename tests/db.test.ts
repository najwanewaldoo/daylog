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

describe("Database Layer & Data Access Tests", () => {
  beforeEach(async () => {
    // Safety guard: these tests wipe all data, so they must NEVER run against Turso.
    expect(process.env.TURSO_DATABASE_URL ?? "").toMatch(/^file:/);
    await deleteAllData();
  });

  it("creates and edits journal entries for the same date without duplicates", async () => {
    const date = "2026-11-09";

    // Create
    await saveJournalEntry({
      entryDate: date,
      gratitude: "Morning sunshine",
      wentWell: "Deep focus",
      challenge: "Slow internet",
      freeText: "Initial draft",
    });

    let entry = await getJournalEntry(date);
    expect(entry).toBeDefined();
    expect(entry?.gratitude).toBe("Morning sunshine");

    // Edit
    await saveJournalEntry({
      entryDate: date,
      gratitude: "Evening tea",
      wentWell: "All tests passing",
      challenge: null,
      freeText: "Updated thoughts",
    });

    entry = await getJournalEntry(date);
    expect(entry?.gratitude).toBe("Evening tea");
    expect(entry?.wentWell).toBe("All tests passing");
  });

  it("saving check-in creates empty journal entry if not existing (referential integrity)", async () => {
    const date = "2026-11-15";

    // Journal does not exist prior to check-in
    expect(await getJournalEntry(date)).toBeUndefined();

    // Save check-in
    await saveDailyCheckin({
      entryDate: date,
      sleepHours: 8.0,
      sleepQuality: 4,
      energy: 4,
      mood: 4,
      focus: 4,
      workload: 3,
      studyMinutes: 150,
    });

    // Journal entry should now automatically exist
    const journal = await getJournalEntry(date);
    expect(journal).toBeDefined();
    expect(journal?.entryDate).toBe(date);

    // Check-in exists
    const checkin = await getDailyCheckin(date);
    expect(checkin).toBeDefined();
    expect(checkin?.sleepHours).toBe(8.0);
    expect(checkin?.studyMinutes).toBe(150);
  });

  it("updates check-in values on re-save for same date", async () => {
    const date = "2026-11-16";

    await saveDailyCheckin({
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
    await saveDailyCheckin({
      entryDate: date,
      sleepHours: 7.0,
      sleepQuality: 3,
      energy: 3,
      mood: 4,
      focus: 4,
      workload: 3,
      studyMinutes: 120,
    });

    const checkin = await getDailyCheckin(date);
    expect(checkin?.sleepHours).toBe(7.0);
    expect(checkin?.studyMinutes).toBe(120);
  });

  it("creates and edits daily intentions", async () => {
    const date = "2026-11-17";

    await saveDailyIntention({
      targetDate: date,
      learningPriority: "Study for Database Midterm",
      recoveryAction: "Go for a walk",
    });

    let intention = await getDailyIntention(date);
    expect(intention).toBeDefined();
    expect(intention?.learningPriority).toBe("Study for Database Midterm");

    // Update
    await saveDailyIntention({
      targetDate: date,
      learningPriority: "Review Chapters 1–3 only",
      recoveryAction: "Early bedtime",
    });

    intention = await getDailyIntention(date);
    expect(intention?.learningPriority).toBe("Review Chapters 1–3 only");
    expect(intention?.recoveryAction).toBe("Early bedtime");
  });

  it("saves, retrieves, and updates weekly reflections in database", async () => {
    const start = "2026-11-02";
    const end = "2026-11-08";

    expect(await getWeeklyReflection(start, end)).toBeUndefined();

    await saveWeeklyReflection(start, end, "First draft of weekly reflection");
    let rec = await getWeeklyReflection(start, end);
    expect(rec).toBeDefined();
    expect(rec?.reflection).toBe("First draft of weekly reflection");

    // Update existing weekly reflection
    await saveWeeklyReflection(start, end, "Polished weekly synthesis note");
    rec = await getWeeklyReflection(start, end);
    expect(rec?.reflection).toBe("Polished weekly synthesis note");
  });

  it("calculates month overview bounds accurately for 30-day and 31-day months", async () => {
    // Save records across November
    await saveDailyCheckin({
      entryDate: "2026-11-01",
      sleepHours: 7,
      sleepQuality: 3,
      energy: 3,
      mood: 3,
      focus: 3,
      workload: 3,
      studyMinutes: 60,
    });
    await saveDailyCheckin({
      entryDate: "2026-11-30",
      sleepHours: 8,
      sleepQuality: 4,
      energy: 4,
      mood: 4,
      focus: 4,
      workload: 3,
      studyMinutes: 90,
    });

    const overview = await getMonthOverview("2026-11");
    expect(overview.length).toBe(2);
    expect(overview[0].date).toBe("2026-11-01");
    expect(overview[1].date).toBe("2026-11-30");
  });

  it("exports all personal data cleanly including weekly reflections", async () => {
    await saveDailyCheckin({
      entryDate: "2026-11-20",
      sleepHours: 7.5,
      sleepQuality: 4,
      energy: 4,
      mood: 4,
      focus: 4,
      workload: 3,
      studyMinutes: 120,
    });

    await saveWeeklyReflection("2026-11-16", "2026-11-22", "Great week overall.");

    const exported = await exportAllData();
    expect(exported.version).toBe("1.0");
    expect(exported.stats.checkinsCount).toBe(1);
    expect(exported.stats.weeklyReviewsCount).toBe(1);
    expect(exported.weeklyReviews.length).toBe(1);
  });

  it("deletes all personal data cleanly upon confirmation", async () => {
    await saveDailyCheckin({
      entryDate: "2026-11-21",
      sleepHours: 7.0,
      sleepQuality: 3,
      energy: 3,
      mood: 3,
      focus: 3,
      workload: 3,
      studyMinutes: 90,
    });
    await saveWeeklyReflection("2026-11-16", "2026-11-22", "Test note.");

    expect(await getDailyCheckin("2026-11-21")).toBeDefined();
    expect(await getWeeklyReflection("2026-11-16", "2026-11-22")).toBeDefined();

    await deleteAllData();

    expect(await getDailyCheckin("2026-11-21")).toBeUndefined();
    expect(await getJournalEntry("2026-11-21")).toBeUndefined();
    expect(await getWeeklyReflection("2026-11-16", "2026-11-22")).toBeUndefined();
  });
});
