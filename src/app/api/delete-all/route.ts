import { NextRequest, NextResponse } from "next/server";
import { deleteAllData } from "@/lib/db/queries";
import { requireUser, validateSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const originError = validateSameOrigin(request);
    if (originError) return originError;

    const auth = await requireUser();
    if (auth instanceof Response) return auth;
    const user = auth;

    const body = await request.json();

    if (body.confirmation !== "DELETE_ALL_DATA") {
      return NextResponse.json(
        {
          error:
            "Invalid confirmation phrase. Type DELETE_ALL_DATA to confirm.",
        },
        { status: 400 }
      );
    }

    await deleteAllData(user.id);

    return NextResponse.json({
      success: true,
      message: "All personal data for your account has been completely and permanently deleted.",
    });
  } catch (error) {
    console.error("Data deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete data." },
      { status: 500 }
    );
  }
}
