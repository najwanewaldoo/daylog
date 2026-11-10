import type { DailyCheckinData, JournalEntryData, WeeklyAnalytics } from "@/types";

/**
 * Calculates descriptive averages for a list of daily checkins.
 * Returns 0/null-safe statistics without fabricating numbers.
 */
export function calculateAverages(checkins: DailyCheckinData[]) {
  if (checkins.length === 0) {
    return {
      sleepHours: 0,
      sleepQuality: 0,
      energy: 0,
      mood: 0,
      focus: 0,
      workload: 0,
      studyMinutes: 0,
    };
  }

  const sum = checkins.reduce(
    (acc, curr) => ({
      sleepHours: acc.sleepHours + curr.sleepHours,
      sleepQuality: acc.sleepQuality + curr.sleepQuality,
      energy: acc.energy + curr.energy,
      mood: acc.mood + curr.mood,
      focus: acc.focus + curr.focus,
      workload: acc.workload + curr.workload,
      studyMinutes: acc.studyMinutes + curr.studyMinutes,
    }),
    {
      sleepHours: 0,
      sleepQuality: 0,
      energy: 0,
      mood: 0,
      focus: 0,
      workload: 0,
      studyMinutes: 0,
    }
  );

  const count = checkins.length;
  return {
    sleepHours: Math.round((sum.sleepHours / count) * 10) / 10,
    sleepQuality: Math.round((sum.sleepQuality / count) * 10) / 10,
    energy: Math.round((sum.energy / count) * 10) / 10,
    mood: Math.round((sum.mood / count) * 10) / 10,
    focus: Math.round((sum.focus / count) * 10) / 10,
    workload: Math.round((sum.workload / count) * 10) / 10,
    studyMinutes: Math.round(sum.studyMinutes / count),
  };
}

/**
 * Generates an array of all dates between startDate and endDate (YYYY-MM-DD inclusive).
 */
export function getDateRangeList(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const stop = new Date(`${endDate}T00:00:00`);

  while (current <= stop) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Builds weekly analytics structure for visualization and review.
 */
export function buildWeeklyAnalytics(
  checkins: DailyCheckinData[],
  journals: JournalEntryData[],
  startDate: string,
  endDate: string
): WeeklyAnalytics {
  const checkinMap = new Map<string, DailyCheckinData>();
  for (const c of checkins) {
    checkinMap.set(c.entryDate, c);
  }

  const journalMap = new Map<string, JournalEntryData>();
  for (const j of journals) {
    // Only mark hasJournal if at least one qualitative reflection field is filled
    const hasContent = Boolean(
      (j.gratitude && j.gratitude.trim().length > 0) ||
      (j.wentWell && j.wentWell.trim().length > 0) ||
      (j.challenge && j.challenge.trim().length > 0) ||
      (j.freeText && j.freeText.trim().length > 0)
    );
    if (hasContent) {
      journalMap.set(j.entryDate, j);
    }
  }

  const dateList = getDateRangeList(startDate, endDate);
  const dailyMetrics = dateList.map((dateStr) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = DAY_NAMES[d.getDay()];
    const c = checkinMap.get(dateStr);

    return {
      date: dateStr,
      dayOfWeek,
      sleepHours: c ? c.sleepHours : null,
      sleepQuality: c ? c.sleepQuality : null,
      energy: c ? c.energy : null,
      mood: c ? c.mood : null,
      focus: c ? c.focus : null,
      workload: c ? c.workload : null,
      studyMinutes: c ? c.studyMinutes : null,
      hasJournal: journalMap.has(dateStr),
    };
  });

  const validCheckins = checkins.filter((c) =>
    dateList.includes(c.entryDate)
  );

  const averages = calculateAverages(validCheckins);
  const totalStudyMinutes = validCheckins.reduce((sum, c) => sum + c.studyMinutes, 0);
  const totalStudyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;

  return {
    startDate,
    endDate,
    totalDaysRecorded: validCheckins.length,
    totalStudyHours,
    averages,
    dailyMetrics,
  };
}
