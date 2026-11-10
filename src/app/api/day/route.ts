import { NextRequest, NextResponse } from "next/server";
import { getDayRecord } from "@/lib/db/queries";
import { dateStringRegex } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date || !dateStringRegex.test(date)) {
      return NextResponse.json(
        { error: "A valid date parameter (YYYY-MM-DD) is required." },
        { status: 400 }
      );
    }

    const record = await getDayRecord(date);
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("Error fetching day record:", error);
    return NextResponse.json(
      { error: "Failed to retrieve daily record." },
      { status: 500 }
    );
  }
}
