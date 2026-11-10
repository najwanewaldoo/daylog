import { describe, it, expect } from "vitest";
import {
  checkinSchema,
  journalSchema,
  intentionSchema,
  weeklyReflectionSchema,
  isValidISODateString,
} from "../src/lib/validation";

describe("Validation Layer Tests", () => {
  describe("Calendar Date Validation", () => {
    it("accepts real calendar dates", () => {
      expect(isValidISODateString("2026-11-09")).toBe(true);
      expect(isValidISODateString("2024-02-29")).toBe(true); // Leap year 2024
      expect(isValidISODateString("2026-12-31")).toBe(true);
    });

    it("rejects nonexistent calendar days", () => {
      expect(isValidISODateString("2026-02-29")).toBe(false); // 2026 is not a leap year
      expect(isValidISODateString("2026-02-31")).toBe(false);
      expect(isValidISODateString("2026-04-31")).toBe(false); // April has 30 days
      expect(isValidISODateString("2026-11-31")).toBe(false); // November has 30 days
      expect(isValidISODateString("2026-13-01")).toBe(false); // Invalid month 13
      expect(isValidISODateString("invalid-date")).toBe(false);
    });
  });

  describe("Check-in Validation", () => {
    it("validates a standard valid check-in", () => {
      const valid = {
        entryDate: "2026-11-09",
        sleepHours: 7.5,
        sleepQuality: 4,
        energy: 4,
        mood: 3,
        focus: 5,
        workload: 3,
        studyMinutes: 180,
      };
      const result = checkinSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects nonexistent dates in check-in schema", () => {
      const invalidDateCheckin = {
        entryDate: "2026-02-31",
        sleepHours: 8,
        sleepQuality: 3,
        energy: 3,
        mood: 3,
        focus: 3,
        workload: 3,
        studyMinutes: 60,
      };
      expect(checkinSchema.safeParse(invalidDateCheckin).success).toBe(false);
    });

    it("rejects sleep hours outside 0–24 range", () => {
      const negativeSleep = {
        entryDate: "2026-11-09",
        sleepHours: -1,
        sleepQuality: 3,
        energy: 3,
        mood: 3,
        focus: 3,
        workload: 3,
        studyMinutes: 60,
      };
      expect(checkinSchema.safeParse(negativeSleep).success).toBe(false);

      const excessiveSleep = {
        ...negativeSleep,
        sleepHours: 25,
      };
      expect(checkinSchema.safeParse(excessiveSleep).success).toBe(false);
    });

    it("rejects ratings outside 1–5 scale", () => {
      const invalidRating = {
        entryDate: "2026-11-09",
        sleepHours: 8,
        sleepQuality: 0, // Invalid: min is 1
        energy: 6, // Invalid: max is 5
        mood: 3,
        focus: 3,
        workload: 3,
        studyMinutes: 60,
      };
      const result = checkinSchema.safeParse(invalidRating);
      expect(result.success).toBe(false);
    });

    it("rejects negative study duration", () => {
      const negativeStudy = {
        entryDate: "2026-11-09",
        sleepHours: 7,
        sleepQuality: 3,
        energy: 3,
        mood: 3,
        focus: 3,
        workload: 3,
        studyMinutes: -30,
      };
      expect(checkinSchema.safeParse(negativeStudy).success).toBe(false);
    });

    it("rejects invalid date formats", () => {
      const badDate = {
        entryDate: "11/09/2026", // Wrong format
        sleepHours: 7,
        sleepQuality: 3,
        energy: 3,
        mood: 3,
        focus: 3,
        workload: 3,
        studyMinutes: 60,
      };
      expect(checkinSchema.safeParse(badDate).success).toBe(false);
    });
  });

  describe("Journal Validation", () => {
    it("accepts journal entries with all fields filled", () => {
      const entry = {
        entryDate: "2026-11-09",
        gratitude: "Good health",
        wentWell: "Finished coding task",
        challenge: "Minor debugging delay",
        freeText: "Felt very productive today.",
      };
      const result = journalSchema.safeParse(entry);
      expect(result.success).toBe(true);
    });

    it("accepts partially completed or empty journal fields", () => {
      const entry = {
        entryDate: "2026-11-09",
        gratitude: null,
        wentWell: "Just this one thing",
        challenge: null,
        freeText: null,
      };
      const result = journalSchema.safeParse(entry);
      expect(result.success).toBe(true);
    });
  });

  describe("Daily Intention Validation", () => {
    it("validates learning priority and recovery action", () => {
      const valid = {
        targetDate: "2026-11-10",
        learningPriority: "Finish Operating Systems notes",
        recoveryAction: "Evening walk without screen",
      };
      const result = intentionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects empty learning priority or recovery action", () => {
      const empty = {
        targetDate: "2026-11-10",
        learningPriority: "   ",
        recoveryAction: "",
      };
      expect(intentionSchema.safeParse(empty).success).toBe(false);
    });
  });

  describe("Weekly Reflection Validation", () => {
    it("validates valid weekly reflection payloads", () => {
      const valid = {
        startDate: "2026-11-02",
        endDate: "2026-11-08",
        reflection: "I noticed that sleeping over 7 hours correlated with clearer concentration.",
      };
      expect(weeklyReflectionSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects empty weekly reflection", () => {
      const empty = {
        startDate: "2026-11-02",
        endDate: "2026-11-08",
        reflection: "   ",
      };
      expect(weeklyReflectionSchema.safeParse(empty).success).toBe(false);
    });
  });
});
