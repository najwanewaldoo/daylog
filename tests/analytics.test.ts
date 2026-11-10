import { describe, it, expect } from "vitest";
import { calculateAverages, buildWeeklyAnalytics, getDateRangeList } from "../src/lib/analytics";
import type { DailyCheckinData, JournalEntryData } from "../src/types";

describe("Analytics Calculations & Edge Cases", () => {
  it("handles empty check-in data gracefully without division by zero", () => {
    const emptyResult = calculateAverages([]);
    expect(emptyResult).toEqual({
      sleepHours: 0,
      sleepQuality: 0,
      energy: 0,
      mood: 0,
      focus: 0,
      workload: 0,
      studyMinutes: 0,
    });
  });

  it("calculates accurate descriptive averages for valid check-ins", () => {
    const checkins: DailyCheckinData[] = [
      {
        entryDate: "2026-11-02",
        sleepHours: 8.0,
        sleepQuality: 4,
        energy: 4,
        mood: 4,
        focus: 4,
        workload: 3,
        studyMinutes: 120,
      },
      {
        entryDate: "2026-11-03",
        sleepHours: 6.0,
        sleepQuality: 2,
        energy: 2,
        mood: 2,
        focus: 2,
        workload: 5,
        studyMinutes: 240,
      },
    ];

    const averages = calculateAverages(checkins);
    expect(averages.sleepHours).toBe(7.0);
    expect(averages.sleepQuality).toBe(3.0);
    expect(averages.energy).toBe(3.0);
    expect(averages.mood).toBe(3.0);
    expect(averages.focus).toBe(3.0);
    expect(averages.workload).toBe(4.0);
    expect(averages.studyMinutes).toBe(180);
  });

  it("handles incomplete weeks by representing missing days without fabricating data", () => {
    const checkins: DailyCheckinData[] = [
      {
        entryDate: "2026-11-02",
        sleepHours: 7.5,
        sleepQuality: 4,
        energy: 4,
        mood: 4,
        focus: 4,
        workload: 3,
        studyMinutes: 120,
      },
    ];
    const journals: JournalEntryData[] = [];

    const weekly = buildWeeklyAnalytics(
      checkins,
      journals,
      "2026-11-02",
      "2026-11-08"
    );

    expect(weekly.totalDaysRecorded).toBe(1);
    expect(weekly.dailyMetrics.length).toBe(7); // 7 calendar slots

    // Day 1 has data
    expect(weekly.dailyMetrics[0].sleepHours).toBe(7.5);

    // Days 2 through 7 have null data
    expect(weekly.dailyMetrics[1].sleepHours).toBeNull();
    expect(weekly.dailyMetrics[1].energy).toBeNull();
  });

  it("generates date range list correctly", () => {
    const range = getDateRangeList("2026-11-01", "2026-11-03");
    expect(range).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
  });
});
