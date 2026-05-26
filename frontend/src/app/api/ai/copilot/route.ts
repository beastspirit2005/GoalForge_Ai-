import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8001";

/**
 * Next.js Server API Proxy for AI Copilot.
 * 
 * Intercepts AI chat queries, reads the secure httpOnly "custom_gemini_key" cookie
 * on the server, injects it securely into the request body, and forwards it to the Python backend.
 * Bypasses all client-side script API key exposures.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const body = await req.json().catch(() => ({}));
    const { query, context, provider, model } = body;

    const cookieStore = await cookies();
    const customKey = cookieStore.get("custom_gemini_key")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    // Build the secure payload. Key is dynamically injected only when using Gemini provider
    const payload = {
      query,
      context,
      provider,
      model,
      api_key: provider === "gemini" ? customKey || undefined : undefined,
    };

    const res = await fetch(`${BACKEND_URL}/ai/copilot`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Backend copilot query failed.");
      let message = "Backend copilot query failed.";
      try {
        const errJson = JSON.parse(errText);
        message = errJson.detail || message;
      } catch {
        if (errText) message = errText;
      }
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
