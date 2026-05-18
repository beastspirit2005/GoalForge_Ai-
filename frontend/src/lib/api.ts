const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // Client-side: use relative path so requests flow through the Next.js port 3000 proxy, bypassing the firewall.
    return "/api"
  }
  // Server-side (SSR / Server Components): call the local backend directly on port 8001.
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"
}

const API_URL = getApiUrl()

type RequestOptions = {
  method?: string
  body?: unknown
  token?: string | null
}

export async function apiFetch<T = unknown>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 2000)

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || "API request failed")
    }

    if (res.status === 204) return undefined as T

    return res.json()
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === "AbortError") {
      throw new Error("Network request timed out")
    }
    throw err
  }
}

export { API_URL }
