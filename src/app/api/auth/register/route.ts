import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth/password";
import {
  createUser,
  findUserByEmail,
  createSession,
  setSessionCookie,
} from "@/lib/auth/session";
import { validateSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const originError = validateSameOrigin(request);
    if (originError) return originError;

    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // Check duplicate email
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);

    // Auto-login: create session and set session cookie
    const { token } = await createSession(user.id);
    setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: { id: user.id, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account." },
      { status: 500 }
    );
  }
}
