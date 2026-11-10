import { NextRequest, NextResponse } from "next/server";
import {
  getCheckinsInRange,
  getJournalsInRange,
  getWeeklyReflection,
} from "@/lib/db/queries";
import { buildWeeklyAnalytics } from "@/lib/analytics";
import { generateWeeklyReview } from "@/lib/recommendations";
import { getWeekBoundaries } from "@/lib/utils";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof Response) return auth;
    const user = auth;

    const { searchParams } = new URL(request.url);
    let startDate = searchParams.get("start");
    let endDate = searchParams.get("end");

    if (!startDate || !endDate) {
      const defaultBounds = getWeekBoundaries();
      startDate = defaultBounds.startDate;
      endDate = defaultBounds.endDate;
    }

    const checkins = await getCheckinsInRange(user.id, startDate, endDate);
    const journals = await getJournalsInRange(user.id, startDate, endDate);

    const analytics = buildWeeklyAnalytics(checkins, journals, startDate, endDate);
    const reviewResult = generateWeeklyReview(analytics, checkins, journals);
    const reflectionRecord = await getWeeklyReflection(user.id, startDate, endDate);
    reviewResult.savedReflection = reflectionRecord?.reflection || null;

    return NextResponse.json({ success: true, data: reviewResult });
  } catch (error) {
    console.error("Error generating review:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly review." },
      { status: 500 }
    );
  }
}
