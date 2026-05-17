"use client"



import type { User } from "@/types/user"
import { getStoredToken, clearToken } from "@/services/auth.service"

// Simple auth store using module-level state
// For a production app, use zustand or jotai

let _token: string | null = null
let _user: User | null = null

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  if (!_token) _token = getStoredToken()
  return _token
}

export function setAuthUser(user: User, token: string): void {
  _user = user
  _token = token
}

export function getAuthUser(): User | null {
  return _user
}

export function clearAuth(): void {
  _user = null
  _token = null
  clearToken()
}
