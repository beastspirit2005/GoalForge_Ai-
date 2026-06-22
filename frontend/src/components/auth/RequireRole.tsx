"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

interface RequireRoleProps {
  children: React.ReactNode
  roles: string[]
  fallbackRedirect?: string
}

export default function RequireRole({ children, roles, fallbackRedirect = "/login" }: RequireRoleProps) {
  const { user, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready) {
      if (!user) {
        router.replace("/login")
      } else if (!roles.includes(user.role)) {
        // Redirect to their respective dashboard if they don't have the required role
        const baseRole = user.role === "super_admin" ? "admin" : user.role
        router.replace(`/${baseRole}/dashboard`)
      }
    }
  }, [user, ready, roles, router])

  // Show a blank screen while verifying auth or redirecting
  if (!ready || !user || !roles.includes(user.role)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#090d16]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
