import { apiFetch } from "@/lib/api"
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "@/types/user"

let _user: User | null = null

export function setLoginTimestamp(): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("gf_login_timestamp", Date.now().toString())
  }
}

export function clearLoginTimestamp(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("gf_login_timestamp")
  }
}

export async function loginUser(data: LoginPayload): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: data,
  })
  setLoginTimestamp()
  return res
}

export async function registerUser(data: RegisterPayload): Promise<User> {
  return apiFetch<User>("/auth/register", {
    method: "POST",
    body: data,
  })
}

export async function getCurrentUser(forceRefresh = false): Promise<User> {
  if (_user && !forceRefresh) {
    return _user
  }
  _user = await apiFetch<User>("/auth/me")
  return _user
}

export async function requestOtp(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/request-otp", {
    method: "POST",
    body: { email },
  })
}

export async function verifyOtp(email: string, otpCode: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/verify-otp", {
    method: "POST",
    body: { email, otp_code: otpCode },
  })
  setLoginTimestamp()
  return res
}

export async function logoutUser(): Promise<{ message: string }> {
  _user = null
  clearLoginTimestamp()
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
  })
}

export async function apiFetchWithCriticalOtp<T>(
  url: string,
  otpCode: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {})
  headers.set("X-Critical-OTP", otpCode)
  return apiFetch<T>(url, {
    ...options,
    headers,
  })
}

// Dummy exports to satisfy legacy imports after migrating to httpOnly cookies
export function getStoredToken(): string {
  return ""
}

export function clearToken(): void {
  // Legacy
}
