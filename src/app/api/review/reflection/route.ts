import { NextRequest, NextResponse } from "next/server";
import { getWeeklyReflection, saveWeeklyReflection } from "@/lib/db/queries";
import { weeklyReflectionSchema } from "@/lib/validation";
import { requireUser, validateSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof Response) return auth;
    const user = auth;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start and end dates are required." },
        { status: 400 }
      );
    }

    const reflectionRecord = await getWeeklyReflection(user.id, startDate, endDate);
    return NextResponse.json({
      success: true,
      data: reflectionRecord ? reflectionRecord.reflection : "",
    });
  } catch (error) {
    console.error("Error fetching weekly reflection:", error);
    return NextResponse.json(
      { error: "Failed to retrieve weekly reflection." },
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
    const parseResult = weeklyReflectionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const saved = await saveWeeklyReflection(
      user.id,
      parseResult.data.startDate,
      parseResult.data.endDate,
      parseResult.data.reflection
    );

    return NextResponse.json({
      success: true,
      message: "Weekly reflection saved successfully.",
      data: saved,
    });
  } catch (error) {
    console.error("Error saving weekly reflection:", error);
    return NextResponse.json(
      { error: "Failed to save weekly reflection." },
      { status: 500 }
    );
  }
}
