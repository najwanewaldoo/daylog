import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, DUMMY_HASH } from "@/lib/auth/password";
import {
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
    const parseResult = loginSchema.safeParse(body);

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
    const user = await findUserByEmail(email);

    // Always run scrypt verification to prevent timing leaks
    const hashToVerify = user ? user.passwordHash : DUMMY_HASH;
    const passwordValid = await verifyPassword(password, hashToVerify);

    if (!user || !passwordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session and set cookie
    const { token } = await createSession(user.id);
    setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Logged in successfully.",
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during sign in." },
      { status: 500 }
    );
  }
}
