import React from "react";
import { DashboardView } from "@/components/dashboard/DashboardView";
import {
  getDayRecord,
  getRecentCheckins,
  getCheckinsInRange,
  getJournalsInRange,
  getDailyIntention,
} from "@/lib/db/queries";
import { getTodayDateString, getGreeting, getWeekBoundaries } from "@/lib/utils";
import { buildWeeklyAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = getTodayDateString();
  const todayRecord = await getDayRecord(today);
  const recentCheckins = await getRecentCheckins(7);

  const target = new Date(`${today}T00:00:00`);
  target.setDate(target.getDate() + 1);
  const tomorrowDate = `${target.getFullYear()}-${String(
    target.getMonth() + 1
  ).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
  const tomorrowIntention = await getDailyIntention(tomorrowDate);

  const { startDate, endDate } = getWeekBoundaries(today);
  const weekCheckins = await getCheckinsInRange(startDate, endDate);
  const weekJournals = await getJournalsInRange(startDate, endDate);
  const weekAnalytics = buildWeeklyAnalytics(
    weekCheckins,
    weekJournals,
    startDate,
    endDate
  );

  const hasJournalContent = Boolean(
    todayRecord.journal &&
      ((todayRecord.journal.gratitude && todayRecord.journal.gratitude.trim().length > 0) ||
        (todayRecord.journal.wentWell && todayRecord.journal.wentWell.trim().length > 0) ||
        (todayRecord.journal.challenge && todayRecord.journal.challenge.trim().length > 0) ||
        (todayRecord.journal.freeText && todayRecord.journal.freeText.trim().length > 0))
  );

  const dashboardData = {
    greeting: getGreeting(),
    date: today,
    status: {
      hasCheckin: Boolean(todayRecord.checkin),
      hasJournal: hasJournalContent,
    },
    todayRecord,
    tomorrowIntention: tomorrowIntention || null,
    recentMetrics: recentCheckins.reverse(),
    weekOverview: {
      startDate,
      endDate,
      recordedDays: weekAnalytics.totalDaysRecorded,
      totalStudyHours: weekAnalytics.totalStudyHours,
      averages: weekAnalytics.averages,
      dailyMetrics: weekAnalytics.dailyMetrics,
    },
  };

  return <DashboardView data={dashboardData} />;
}
