import { NextRequest, NextResponse } from "next/server";
import { getMonthOverview } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid or missing month parameter (expected YYYY-MM)." },
        { status: 400 }
      );
    }

    const records = await getMonthOverview(month);
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching history overview:", error);
    return NextResponse.json(
      { error: "Failed to retrieve monthly history." },
      { status: 500 }
    );
  }
}
