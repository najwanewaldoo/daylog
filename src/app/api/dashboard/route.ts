import { NextRequest, NextResponse } from "next/server";
import {
  getDayRecord,
  getRecentCheckins,
  getCheckinsInRange,
  getJournalsInRange,
  getDailyIntention,
} from "@/lib/db/queries";
import { getTodayDateString, getGreeting, getWeekBoundaries } from "@/lib/utils";
import { buildWeeklyAnalytics } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof Response) return auth;
    const user = auth;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDateString();

    const todayRecord = await getDayRecord(user.id, date);
    const recentCheckins = await getRecentCheckins(user.id, 7);

    // Tomorrow's intention
    const target = new Date(`${date}T00:00:00`);
    target.setDate(target.getDate() + 1);
    const tomorrowDate = `${target.getFullYear()}-${String(
      target.getMonth() + 1
    ).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
    const tomorrowIntention = await getDailyIntention(user.id, tomorrowDate);

    // Weekly metrics
    const { startDate, endDate } = getWeekBoundaries(date);
    const weekCheckins = await getCheckinsInRange(user.id, startDate, endDate);
    const weekJournals = await getJournalsInRange(user.id, startDate, endDate);
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

    const response = {
      greeting: getGreeting(),
      date,
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

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Dashboard data error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
