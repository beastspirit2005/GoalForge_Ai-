import { isVercelDeployment } from "./env"

/** Resolve API base URL for browser and SSR (Vercel, Render, local). */
export function getApiUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")
  if (explicit) return explicit

  // Browser: same-origin /api (Vercel monorepo or Next rewrite proxy)
  if (typeof window !== "undefined") {
    return "/api"
  }

  // SSR in Docker / compose: talk to backend on the internal network
  const internal = process.env.API_PROXY_TARGET?.replace(/\/$/, "")
  if (internal) return internal

  // SSR on Vercel: hit the deployed API route on the same host
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`
  }

  return "http://localhost:8000"
}

const API_URL = getApiUrl()

const API_TIMEOUT_MS =
  Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) ||
  (isVercelDeployment() ? 25000 : 10000)

type RequestOptions = {
  method?: string
  body?: unknown
  token?: string
  headers?: Headers | Record<string, string>
}

export async function apiFetch<T = unknown>(
  path: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  try {
    const res = await fetch(`${API_URL}${normalizedPath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: "include",
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token")
          if (window.location.pathname !== "/login") {
            window.location.href = "/login"
          }
        }
      }
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      const detail = err.detail
      const message =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ")
            : "API request failed"
      throw new Error(message || "API request failed")
    }

    if (res.status === 204) return undefined as T

    return res.json()
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "Request timed out. If this is your first visit, the server may still be waking up — try again."
      )
    }
    throw err
  }
}

export { API_URL }
