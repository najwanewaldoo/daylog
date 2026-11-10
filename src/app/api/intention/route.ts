import { NextRequest, NextResponse } from "next/server";
import { saveDailyIntention, getDailyIntention } from "@/lib/db/queries";
import { intentionSchema } from "@/lib/validation";
import { requireUser, validateSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof Response) return auth;
    const user = auth;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required." },
        { status: 400 }
      );
    }

    const intention = await getDailyIntention(user.id, date);
    return NextResponse.json({ success: true, data: intention });
  } catch (error) {
    console.error("Error fetching daily intention:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily intention." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const originError = validateSameOrigin(request);
    if (originError) return originError;

    const auth = await requireUser();
    if (auth instanceof Response) return auth;
    const user = auth;

    const body = await request.json();
    const parseResult = intentionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const saved = await saveDailyIntention(user.id, parseResult.data);
    return NextResponse.json({
      success: true,
      message: "Daily intention saved successfully.",
      data: saved,
    });
  } catch (error) {
    console.error("Error saving daily intention:", error);
    return NextResponse.json(
      { error: "Failed to save daily intention." },
      { status: 500 }
    );
  }
}
