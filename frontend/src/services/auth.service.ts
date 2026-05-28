import { apiFetch } from "@/lib/api"
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "@/types/user"

const TOKEN_KEY = "goalforge.token"

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {}
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export async function loginUser(data: LoginPayload): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: data,
  })
  storeToken(res.access_token)
  return res
}

export async function registerUser(data: RegisterPayload): Promise<User> {
  return apiFetch<User>("/auth/register", {
    method: "POST",
    body: data,
  })
}

export async function getCurrentUser(): Promise<User> {
  const token = getStoredToken()
  return apiFetch<User>("/auth/me", { token })
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
  storeToken(res.access_token)
  return res
}
