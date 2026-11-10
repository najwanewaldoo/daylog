import { NextRequest, NextResponse } from "next/server";
import { saveDailyCheckin, getDailyCheckin } from "@/lib/db/queries";
import { checkinSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required." },
        { status: 400 }
      );
    }

    const checkin = await getDailyCheckin(date);
    return NextResponse.json({ success: true, data: checkin });
  } catch (error) {
    console.error("Error fetching checkin:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-in." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = checkinSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const saved = await saveDailyCheckin(parseResult.data);
    return NextResponse.json({
      success: true,
      message: "Daily check-in saved successfully.",
      data: saved,
    });
  } catch (error) {
    console.error("Error saving daily checkin:", error);
    return NextResponse.json(
      { error: "Failed to save daily check-in." },
      { status: 500 }
    );
  }
}
