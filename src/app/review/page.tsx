import React from "react";
import { WeeklyReviewView } from "@/components/review/WeeklyReviewView";
import {
  getCheckinsInRange,
  getJournalsInRange,
  getWeeklyReflection,
} from "@/lib/db/queries";
import { buildWeeklyAnalytics } from "@/lib/analytics";
import { generateWeeklyReview } from "@/lib/recommendations";
import { getWeekBoundaries } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: { start?: string; end?: string };
}) {
  let startDate = searchParams?.start;
  let endDate = searchParams?.end;

  if (!startDate || !endDate) {
    const defaultBounds = getWeekBoundaries();
    startDate = defaultBounds.startDate;
    endDate = defaultBounds.endDate;
  }

  const checkins = await getCheckinsInRange(startDate, endDate);
  const journals = await getJournalsInRange(startDate, endDate);

  const analytics = buildWeeklyAnalytics(checkins, journals, startDate, endDate);
  const reviewResult = generateWeeklyReview(analytics, checkins, journals);
  const reflectionRecord = await getWeeklyReflection(startDate, endDate);
  reviewResult.savedReflection = reflectionRecord?.reflection || null;

  return <WeeklyReviewView reviewData={reviewResult} />;
}
