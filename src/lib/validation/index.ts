import { z } from "zod";

export const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates that an ISO date string (YYYY-MM-DD) represents an actual valid calendar day.
 * Rejects nonexistent days like February 30 or November 31.
 */
export function isValidISODateString(val: string): boolean {
  if (!dateStringRegex.test(val)) return false;
  const [yearStr, monthStr, dayStr] = val.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Check with Date object UTC
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export const checkinSchema = z.object({
  entryDate: z
    .string()
    .regex(dateStringRegex, "Invalid date format. Expected YYYY-MM-DD")
    .refine(isValidISODateString, "Invalid calendar date (YYYY-MM-DD)"),
  sleepHours: z
    .number({ invalid_type_error: "Sleep hours must be a number" })
    .min(0, "Sleep duration cannot be negative")
    .max(24, "Sleep duration cannot exceed 24 hours"),
  sleepQuality: z
    .number({ invalid_type_error: "Sleep quality must be selected" })
    .int("Sleep quality must be an integer")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
  energy: z
    .number({ invalid_type_error: "Energy must be selected" })
    .int("Energy must be an integer")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
  mood: z
    .number({ invalid_type_error: "Mood must be selected" })
    .int("Mood must be an integer")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
  focus: z
    .number({ invalid_type_error: "Focus must be selected" })
    .int("Focus must be an integer")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
  workload: z
    .number({ invalid_type_error: "Workload must be selected" })
    .int("Workload must be an integer")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
  studyMinutes: z
    .number({ invalid_type_error: "Study minutes must be a number" })
    .int("Study duration must be whole minutes")
    .min(0, "Study duration cannot be negative")
    .max(1440, "Study duration cannot exceed 1440 minutes in a single day"),
});

export const journalSchema = z.object({
  entryDate: z
    .string()
    .regex(dateStringRegex, "Invalid date format. Expected YYYY-MM-DD")
    .refine(isValidISODateString, "Invalid calendar date (YYYY-MM-DD)"),
  gratitude: z.string().trim().nullable().optional(),
  wentWell: z.string().trim().nullable().optional(),
  challenge: z.string().trim().nullable().optional(),
  freeText: z.string().trim().nullable().optional(),
});

export const intentionSchema = z.object({
  targetDate: z
    .string()
    .regex(dateStringRegex, "Invalid date format. Expected YYYY-MM-DD")
    .refine(isValidISODateString, "Invalid calendar date (YYYY-MM-DD)"),
  learningPriority: z
    .string()
    .trim()
    .min(1, "Learning priority cannot be empty")
    .max(500, "Learning priority is too long"),
  recoveryAction: z
    .string()
    .trim()
    .min(1, "Recovery action cannot be empty")
    .max(500, "Recovery action is too long"),
});

export const weeklyReflectionSchema = z.object({
  startDate: z
    .string()
    .regex(dateStringRegex, "Invalid start date format. Expected YYYY-MM-DD")
    .refine(isValidISODateString, "Invalid calendar date"),
  endDate: z
    .string()
    .regex(dateStringRegex, "Invalid end date format. Expected YYYY-MM-DD")
    .refine(isValidISODateString, "Invalid calendar date"),
  reflection: z
    .string()
    .trim()
    .min(1, "Reflection cannot be empty")
    .max(5000, "Reflection is too long"),
});

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address format")
    .max(254, "Email must not exceed 254 characters"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export type ValidatedCheckin = z.infer<typeof checkinSchema>;
export type ValidatedJournal = z.infer<typeof journalSchema>;
export type ValidatedIntention = z.infer<typeof intentionSchema>;
export type ValidatedWeeklyReflection = z.infer<typeof weeklyReflectionSchema>;
export type ValidatedRegister = z.infer<typeof registerSchema>;
export type ValidatedLogin = z.infer<typeof loginSchema>;
