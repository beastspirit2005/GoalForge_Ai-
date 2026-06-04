"use client"

import { useCallback, useEffect, useState } from "react"

import type { User } from "@/types/user"
import {
  clearToken,
  getCurrentUser,
  loginUser,
  requestOtp,
  verifyOtp,
  logoutUser,
} from "@/services/auth.service"

// Also keep the demo-mode auth for fallback
import { isDemoAuthAllowed } from "@/lib/env"
import {
  clearDemoSession,
  getDemoSession,
  roleHome,
  setDemoSession,
  type DemoRole,
  type DemoUser,
} from "@/lib/mock-auth"

export function useAuth() {
  const [user, setUser] = useState<(User & { avatar?: string }) | DemoUser | null>(null)
  const [ready, setReady] = useState(false)
  const [isApiMode, setIsApiMode] = useState(false)

  useEffect(() => {
    // Attempt to load current user via API. Since cookies are handled automatically by the browser,
    // we fetch /me directly.
    getCurrentUser()
      .then((u) => {
        setUser(u)
        setIsApiMode(true)
        setReady(true)
      })
      .catch(() => {
        clearToken()
        if (isDemoAuthAllowed()) {
          setUser(getDemoSession())
        } else {
          setUser(null)
        }
        setReady(true)
      })
  }, [])

  const login = useCallback((role: DemoRole) => {
    const nextUser = setDemoSession(role)
    setUser(nextUser)
    setIsApiMode(false)
    return roleHome(role)
  }, [])

  const loginWithApi = useCallback(async (email: string, password: string) => {
    await loginUser({ email, password })
    const u = await getCurrentUser()
    setUser(u)
    setIsApiMode(true)
    return `/${u.role}/dashboard`
  }, [])

  const requestOtpCode = useCallback(async (email: string) => {
    return requestOtp(email)
  }, [])

  const loginWithOtp = useCallback(async (email: string, code: string) => {
    await verifyOtp(email, code)
    const u = await getCurrentUser()
    setUser(u)
    setIsApiMode(true)
    return `/${u.role}/dashboard`
  }, [])

  const logout = useCallback(() => {
    logoutUser().catch((err: any) => console.error("Logout request failed:", err))
    clearDemoSession()
    setUser(null)
    setIsApiMode(false)
  }, [])

  return {
    login,
    loginWithApi,
    requestOtpCode,
    loginWithOtp,
    logout,
    ready,
    user,
    isApiMode,
  }
}
