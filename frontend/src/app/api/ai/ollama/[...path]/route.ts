import { NextRequest, NextResponse } from "next/server";

const OLLAMA_HOST = (process.env.OLLAMA_HOST || "http://host.docker.internal:11434").replace(/\/$/, "");

export async function GET(req: NextRequest, context: any) {
  try {
    // Resolve dynamic path segments (supports Next.js 13-15 params)
    const resolvedParams = await (context.params || {});
    const pathSegments = resolvedParams.path || [];
    const path = pathSegments.join("/");
    
    const url = new URL(req.url);
    const searchParams = url.searchParams.toString();
    const targetUrl = `${OLLAMA_HOST}/${path}${searchParams ? `?${searchParams}` : ""}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Ollama returned status ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: any) {
  try {
    const resolvedParams = await (context.params || {});
    const pathSegments = resolvedParams.path || [];
    const path = pathSegments.join("/");
    
    const body = await req.json().catch(() => ({}));
    const targetUrl = `${OLLAMA_HOST}/${path}`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Ollama returned status ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
