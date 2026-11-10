import { NextRequest, NextResponse } from "next/server";
import { saveJournalEntry, getJournalEntry } from "@/lib/db/queries";
import { journalSchema } from "@/lib/validation";

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

    const entry = await getJournalEntry(date);
    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entry." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = journalSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const saved = await saveJournalEntry(parseResult.data);
    return NextResponse.json({
      success: true,
      message: "Journal entry saved successfully.",
      data: saved,
    });
  } catch (error) {
    console.error("Error saving journal entry:", error);
    return NextResponse.json(
      { error: "Failed to save journal entry." },
      { status: 500 }
    );
  }
}
