const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    
    // If the browser loaded the page from a remote host (e.g., mobile phone connecting to desktop Wi-Fi IP)
    // and the hardcoded env url points to localhost, dynamically map it to the desktop's local IP address instead.
    if (envUrl && envUrl.includes("localhost") && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${window.location.protocol}//${hostname}:8001`
    }
    
    if (!envUrl) {
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        return "/api"
      }
      return "http://localhost:8001"
    }
  }
  
  return envUrl || "http://localhost:8001"
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
