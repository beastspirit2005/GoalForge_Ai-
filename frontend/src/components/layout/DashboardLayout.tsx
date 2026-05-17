"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import { useAuth } from "@/hooks/useAuth"
import { isRoleAllowed, roleHome } from "@/lib/mock-auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, user } = useAuth()

  useEffect(() => {
    if (!ready) {
      return
    }

    if (!user) {
      router.replace("/login")
      return
    }

    if (!isRoleAllowed(pathname, user.role)) {
      router.replace(roleHome(user.role))
    }
  }, [pathname, ready, router, user])

  if (!ready || !user || !isRoleAllowed(pathname, user.role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <div className="rounded-lg border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-md bg-sky-300" />
          <p className="mt-4 text-sm text-slate-300">Checking demo session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen text-slate-950">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Navbar user={{
          name: user.name,
          role: "role" in user ? user.role : "",
          avatar: "avatar" in user ? (user as Record<string, string>).avatar : undefined,
          profile_picture_url: "profile_picture_url" in user ? user.profile_picture_url : undefined,
        }} />

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
