import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles custom API key storage using secure cookies.
 * 
 * POST: Saves the custom key in an httpOnly, SameSite=Strict cookie.
 *       Because JS scripts have no access to httpOnly cookies, this mitigates XSS theft risks.
 * DELETE: Clears the secure cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey } = body;
    
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "Invalid Gemini API key format." }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("custom_gemini_key", apiKey.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days retention
    });

    return NextResponse.json({
      success: true,
      message: "API key successfully secured in an httpOnly cookie.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("custom_gemini_key");
    
    return NextResponse.json({
      success: true,
      message: "API key cookie cleared successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
