"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types/user"
import {
  clearToken,
  getCurrentUser,
  getStoredToken,
  loginUser,
  registerUser,
  storeToken,
  requestOtp,
  verifyOtp,
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
    // Try API auth first, fallback to demo
    const token = getStoredToken()
    if (token) {
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
    } else if (isDemoAuthAllowed()) {
      setUser(getDemoSession())
      setReady(true)
    } else {
      setUser(null)
      setReady(true)
    }
  }, [])

  const login = useCallback((role: DemoRole) => {
    const nextUser = setDemoSession(role)
    setUser(nextUser)
    setIsApiMode(false)
    return roleHome(role)
  }, [])

  const loginWithApi = useCallback(async (email: string, password: string) => {
    const res = await loginUser({ email, password })
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
    clearDemoSession()
    clearToken()
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
