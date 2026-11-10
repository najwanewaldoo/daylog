import type {
  DailyCheckinData,
  JournalEntryData,
  WeeklyAnalytics,
  ContextualInsight,
  Recommendation,
  WeeklyReviewResult,
} from "@/types";

const MINIMUM_DAYS_FOR_INSIGHTS = 3;

/**
 * Generates explainable, deterministic insights connecting quantitative metrics
 * and qualitative journal entries.
 */
export function generateWeeklyReview(
  analytics: WeeklyAnalytics | null,
  checkins: DailyCheckinData[],
  journals: JournalEntryData[]
): WeeklyReviewResult {
  if (!analytics || analytics.totalDaysRecorded < MINIMUM_DAYS_FOR_INSIGHTS) {
    return {
      hasSufficientData: false,
      startDate: analytics?.startDate ?? "",
      endDate: analytics?.endDate ?? "",
      analytics,
      insights: [],
      recommendations: [],
      journalExcerpts: [],
    };
  }

  const validCheckins = [...checkins].sort((a, b) =>
    a.entryDate.localeCompare(b.entryDate)
  );

  const journalMap = new Map<string, JournalEntryData>();
  for (const j of journals) {
    journalMap.set(j.entryDate, j);
  }

  const avgSleep = analytics.averages.sleepHours;
  const avgFocus = analytics.averages.focus;
  const avgEnergy = analytics.averages.energy;
  const avgWorkload = analytics.averages.workload;

  const insights: ContextualInsight[] = [];
  const recommendations: Recommendation[] = [];

  // --- INSIGHT 1: Sleep Duration & Focus Tendency ---
  const aboveSleepDays = validCheckins.filter((c) => c.sleepHours >= avgSleep);
  const belowSleepDays = validCheckins.filter((c) => c.sleepHours < avgSleep);

  if (aboveSleepDays.length >= 1 && belowSleepDays.length >= 1) {
    const avgFocusAbove =
      aboveSleepDays.reduce((sum, c) => sum + c.focus, 0) / aboveSleepDays.length;
    const avgFocusBelow =
      belowSleepDays.reduce((sum, c) => sum + c.focus, 0) / belowSleepDays.length;

    if (avgFocusAbove > avgFocusBelow) {
      // Find a day in aboveSleepDays that has journal notes
      const matchedCheckin = aboveSleepDays.find((c) => {
        const j = journalMap.get(c.entryDate);
        return j && (j.wentWell || j.freeText || j.gratitude);
      }) || aboveSleepDays[0];

      const journal = journalMap.get(matchedCheckin.entryDate);
      const journalContext =
        journal?.wentWell || journal?.freeText || journal?.gratitude || null;

      insights.push({
        id: "sleep-focus-correlation",
        type: "correlation_observation",
        title: "Sleep & Focus Tendency",
        observation: `Your focus scores tended to be higher on days when your sleep duration was at or above your weekly average (${avgFocusAbove.toFixed(
          1
        )}/5 vs ${avgFocusBelow.toFixed(1)}/5).`,
        journalContext: journalContext
          ? `On ${matchedCheckin.entryDate}, you noted: "${journalContext}"`
          : null,
        journalDate: matchedCheckin.entryDate,
        triggerMetric: "sleepHours & focus",
      });
    }
  }

  // --- INSIGHT 2: Academic Workload & Energy ---
  const highWorkloadDays = validCheckins.filter((c) => c.workload >= 4);
  const lowWorkloadDays = validCheckins.filter((c) => c.workload < 4);

  if (highWorkloadDays.length >= 1) {
    const avgEnergyHigh =
      highWorkloadDays.reduce((sum, c) => sum + c.energy, 0) /
      highWorkloadDays.length;

    // Check if there is journal context on a high workload day
    const highWorkloadJournalDay = highWorkloadDays.find((c) => {
      const j = journalMap.get(c.entryDate);
      return j && (j.challenge || j.freeText);
    });

    const journal = highWorkloadJournalDay
      ? journalMap.get(highWorkloadJournalDay.entryDate)
      : null;
    const journalContext =
      journal?.challenge || journal?.freeText || null;

    if (lowWorkloadDays.length > 0) {
      const avgEnergyLow =
        lowWorkloadDays.reduce((sum, c) => sum + c.energy, 0) /
        lowWorkloadDays.length;

      insights.push({
        id: "workload-energy-correlation",
        type: "correlation_observation",
        title: "Workload & Energy Relationship",
        observation: `On days with heavy academic workload (rated 4 or 5), your recorded energy averaged ${avgEnergyHigh.toFixed(
          1
        )}/5 compared to ${avgEnergyLow.toFixed(1)}/5 on lighter days.`,
        journalContext: journalContext
          ? `On ${highWorkloadJournalDay?.entryDate}, you reflected: "${journalContext}"`
          : null,
        journalDate: highWorkloadJournalDay?.entryDate || null,
        triggerMetric: "workload & energy",
      });
    } else {
      insights.push({
        id: "workload-observation",
        type: "trend_observation",
        title: "Sustained Academic Demand",
        observation: `Most of your recorded days this week featured high academic workload (averaging ${avgWorkload.toFixed(
          1
        )}/5).`,
        journalContext: journalContext
          ? `Your journal from ${highWorkloadJournalDay?.entryDate} noted: "${journalContext}"`
          : null,
        journalDate: highWorkloadJournalDay?.entryDate || null,
        triggerMetric: "workload",
      });
    }
  }

  // --- INSIGHT 3: Study Duration & Mood/Focus ---
  const daysWithStudy = validCheckins.filter((c) => c.studyMinutes > 0);
  if (daysWithStudy.length >= 2) {
    const maxStudyDay = [...daysWithStudy].sort(
      (a, b) => b.studyMinutes - a.studyMinutes
    )[0];
    const journal = journalMap.get(maxStudyDay.entryDate);
    const excerpt = journal?.wentWell || journal?.gratitude || journal?.freeText;

    insights.push({
      id: "study-duration-observation",
      type: "trend_observation",
      title: "Peak Study Engagement",
      observation: `Your longest independent study session was ${
        maxStudyDay.studyMinutes
      } minutes on ${maxStudyDay.entryDate}, with focus rated ${
        maxStudyDay.focus
      }/5 and mood rated ${maxStudyDay.mood}/5.`,
      journalContext: excerpt
        ? `You recorded: "${excerpt}"`
        : null,
      journalDate: maxStudyDay.entryDate,
      triggerMetric: "studyMinutes",
    });
  }

  // --- RECOMMENDATION RULES ---
  // Rule 1: Energy low for multiple recorded days
  const lowEnergyDays = validCheckins.filter((c) => c.energy <= 2);
  if (lowEnergyDays.length >= 2) {
    recommendations.push({
      id: "rec-low-energy",
      category: "energy" as const,
      title: "Review Workload and Rest Intervals",
      description:
        "Consider pausing between study blocks and deliberately planning non-academic recovery time.",
      triggerExplanation: `Triggered by ${lowEnergyDays.length} recorded days with energy rated 2 or lower (dates: ${lowEnergyDays
        .map((d) => d.entryDate)
        .join(", ")}).`,
    });
  }

  // Rule 2: Sleep duration consistently below threshold or user average
  const shortSleepDays = validCheckins.filter((c) => c.sleepHours < 6.5);
  if (avgSleep < 6.5 || shortSleepDays.length >= 2) {
    recommendations.push({
      id: "rec-sleep-routine",
      category: "sleep",
      title: "Establish a Calmer Evening Wind-Down",
      description:
        "Paying attention to evening screen time and maintaining a consistent bedtime may help stabilize your daily baseline.",
      triggerExplanation: `Triggered by an average sleep duration of ${avgSleep} hours, with ${shortSleepDays.length} days below 6.5 hours.`,
    });
  }

  // Rule 3: Focus low
  const lowFocusDays = validCheckins.filter((c) => c.focus <= 2);
  if (avgFocus <= 2.5 || lowFocusDays.length >= 2) {
    recommendations.push({
      id: "rec-focus-reflection",
      category: "focus",
      title: "Identify Recurring Distractions Through Reflection",
      description:
        "Use your journal entries to note specific study environments, times of day, or interruptions that coincided with reduced focus.",
      triggerExplanation: `Triggered by ${lowFocusDays.length} recorded days with focus rated 2 or lower (average focus: ${avgFocus}/5).`,
    });
  }

  // Rule 4: Workload persistently high
  if (highWorkloadDays.length >= 3 || avgWorkload >= 4) {
    recommendations.push({
      id: "rec-high-workload",
      category: "workload",
      title: "Select a Smaller, Single Learning Priority",
      description:
        "When demands are elevated, narrowing your daily intention to one achievable priority helps prevent cognitive overwhelm.",
      triggerExplanation: `Triggered by ${highWorkloadDays.length} days with academic workload rated 4 or 5 (average: ${avgWorkload}/5).`,
    });
  }

  // Extract qualitative journal excerpts for the period
  const journalExcerpts: Array<{
    date: string;
    type: "gratitude" | "wentWell" | "challenge" | "freeText";
    content: string;
  }> = [];

  for (const j of journals) {
    if (j.gratitude && j.gratitude.trim()) {
      journalExcerpts.push({
        date: j.entryDate,
        type: "gratitude",
        content: j.gratitude.trim(),
      });
    }
    if (j.wentWell && j.wentWell.trim()) {
      journalExcerpts.push({
        date: j.entryDate,
        type: "wentWell",
        content: j.wentWell.trim(),
      });
    }
    if (j.challenge && j.challenge.trim()) {
      journalExcerpts.push({
        date: j.entryDate,
        type: "challenge",
        content: j.challenge.trim(),
      });
    }
    if (j.freeText && j.freeText.trim()) {
      journalExcerpts.push({
        date: j.entryDate,
        type: "freeText",
        content: j.freeText.trim(),
      });
    }
  }

  return {
    hasSufficientData: true,
    startDate: analytics.startDate,
    endDate: analytics.endDate,
    analytics,
    insights,
    recommendations,
    journalExcerpts,
  };
}
