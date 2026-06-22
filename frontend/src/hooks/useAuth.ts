"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import type { User } from "@/types/user"
import {
  clearToken,
  getCurrentUser,
  loginUser,
  requestOtp,
  verifyOtp,
  logoutUser,
} from "@/services/auth.service"

export function useAuth() {
  const [user, setUser] = useState<(User & { avatar?: string }) | null>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Attempt to load current user via API.
    getCurrentUser()
      .then((u) => {
        setUser(u)
        setReady(true)
      })
      .catch(() => {
        clearToken()
        setUser(null)
        setReady(true)
      })
  }, [])

  const loginWithApi = useCallback(async (email: string, password: string) => {
    await loginUser({ email, password })
    const u = await getCurrentUser(true)
    setUser(u)
    const baseRole = u.role === "super_admin" ? "admin" : u.role
    return `/${baseRole}/dashboard`
  }, [])

  const requestOtpCode = useCallback(async (email: string) => {
    return requestOtp(email)
  }, [])

  const loginWithOtp = useCallback(async (email: string, code: string) => {
    await verifyOtp(email, code)
    const u = await getCurrentUser(true)
    setUser(u)
    const baseRole = u.role === "super_admin" ? "admin" : u.role
    return `/${baseRole}/dashboard`
  }, [])

  const logout = useCallback(() => {
    logoutUser().catch((err: any) => console.error("Logout request failed:", err))
    clearToken()
    setUser(null)
    router.replace("/login")
  }, [router])

  return {
    loginWithApi,
    requestOtpCode,
    loginWithOtp,
    logout,
    ready,
    user,
    isApiMode: true,
  }
}
