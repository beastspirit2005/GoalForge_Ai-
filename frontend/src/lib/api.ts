const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

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

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || "API request failed")
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

export { API_URL }
