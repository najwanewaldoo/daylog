import { describe, it, expect } from "vitest";
import { generateWeeklyReview } from "../src/lib/recommendations";
import { buildWeeklyAnalytics } from "../src/lib/analytics";
import type { DailyCheckinData, JournalEntryData } from "../src/types";

describe("Weekly Review, Insights & Recommendation Rules", () => {
  it("does not generate insights or recommendations when data is insufficient (< 3 days)", () => {
    const checkins: DailyCheckinData[] = [
      {
        entryDate: "2026-11-02",
        sleepHours: 8,
        sleepQuality: 4,
        energy: 4,
        mood: 4,
        focus: 4,
        workload: 3,
        studyMinutes: 120,
      },
      {
        entryDate: "2026-11-03",
        sleepHours: 7,
        sleepQuality: 4,
        energy: 3,
        mood: 3,
        focus: 4,
        workload: 3,
        studyMinutes: 90,
      },
    ];

    const analytics = buildWeeklyAnalytics(checkins, [], "2026-11-02", "2026-11-08");
    const review = generateWeeklyReview(analytics, checkins, []);

    expect(review.hasSufficientData).toBe(false);
    expect(review.insights.length).toBe(0);
    expect(review.recommendations.length).toBe(0);
  });

  it("generates deterministic sleep vs focus insight and attaches journal context", () => {
    const checkins: DailyCheckinData[] = [
      {
        entryDate: "2026-11-02",
        sleepHours: 8.5, // High sleep
        sleepQuality: 5,
        energy: 4,
        mood: 4,
        focus: 5, // High focus
        workload: 3,
        studyMinutes: 180,
      },
      {
        entryDate: "2026-11-03",
        sleepHours: 5.0, // Low sleep
        sleepQuality: 2,
        energy: 2,
        mood: 2,
        focus: 2, // Low focus
        workload: 5,
        studyMinutes: 90,
      },
      {
        entryDate: "2026-11-04",
        sleepHours: 8.0, // High sleep
        sleepQuality: 4,
        energy: 4,
        mood: 4,
        focus: 4,
        workload: 3,
        studyMinutes: 150,
      },
    ];

    const journals: JournalEntryData[] = [
      {
        entryDate: "2026-11-02",
        gratitude: "Good sleep",
        wentWell: "Very clear thinking during calculus",
        challenge: null,
        freeText: "8.5 hours sleep made all the difference",
      },
    ];

    const analytics = buildWeeklyAnalytics(
      checkins,
      journals,
      "2026-11-02",
      "2026-11-08"
    );
    const review = generateWeeklyReview(analytics, checkins, journals);

    expect(review.hasSufficientData).toBe(true);

    const sleepFocusInsight = review.insights.find(
      (i) => i.id === "sleep-focus-correlation"
    );
    expect(sleepFocusInsight).toBeDefined();
    expect(sleepFocusInsight?.observation).toContain(
      "Your focus scores tended to be higher on days when your sleep duration was at or above your weekly average"
    );
    expect(sleepFocusInsight?.journalContext).toContain(
      "Very clear thinking during calculus"
    );
  });

  it("triggers recommendations with transparent recorded explanations", () => {
    const checkins: DailyCheckinData[] = [
      {
        entryDate: "2026-11-02",
        sleepHours: 5.0,
        sleepQuality: 2,
        energy: 1, // Low energy
        mood: 2,
        focus: 2,
        workload: 5, // High workload
        studyMinutes: 60,
      },
      {
        entryDate: "2026-11-03",
        sleepHours: 5.5,
        sleepQuality: 2,
        energy: 2, // Low energy
        mood: 2,
        focus: 2,
        workload: 5, // High workload
        studyMinutes: 60,
      },
      {
        entryDate: "2026-11-04",
        sleepHours: 5.0,
        sleepQuality: 2,
        energy: 2, // Low energy
        mood: 2,
        focus: 2,
        workload: 4, // High workload
        studyMinutes: 60,
      },
    ];

    const analytics = buildWeeklyAnalytics(checkins, [], "2026-11-02", "2026-11-08");
    const review = generateWeeklyReview(analytics, checkins, []);

    expect(review.recommendations.length).toBeGreaterThan(0);

    const energyRec = review.recommendations.find(
      (r) => r.id === "rec-low-energy"
    );
    expect(energyRec).toBeDefined();
    expect(energyRec?.triggerExplanation).toContain("recorded days with energy rated 2 or lower");

    const workloadRec = review.recommendations.find(
      (r) => r.id === "rec-high-workload"
    );
    expect(workloadRec).toBeDefined();
    expect(workloadRec?.title).toContain("Select a Smaller, Single Learning Priority");
  });
});
