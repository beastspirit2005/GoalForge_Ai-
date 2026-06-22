"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import { useAuth } from "@/hooks/useAuth"
import { logoutUser } from "@/services/auth.service"
import { isRoleAllowed, roleHome } from "@/lib/mock-auth"
import { X } from "lucide-react"
import { AiBuddyChat } from "../copilot/AiBuddyChat"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu on window resize if it becomes desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Session Security: Idle & Absolute Timeout
  useEffect(() => {
    if (!ready || !user) return

    let idleTimeout: NodeJS.Timeout
    let absoluteTimeout: NodeJS.Timeout

    const handleTimeout = async () => {
      try {
        await logoutUser()
      } catch { }
      router.replace("/login")
    }

    const resetIdleTimer = () => {
      clearTimeout(idleTimeout)
      idleTimeout = setTimeout(handleTimeout, 30 * 60 * 1000) // 30 minutes
    }

    const checkAbsoluteTimeout = () => {
      const loginTime = sessionStorage.getItem("gf_login_timestamp")
      if (loginTime && Date.now() - parseInt(loginTime, 10) > 8 * 60 * 60 * 1000) {
        handleTimeout()
      } else {
        absoluteTimeout = setTimeout(checkAbsoluteTimeout, 60 * 1000) // Check every minute
      }
    }

    resetIdleTimer()
    checkAbsoluteTimeout()

    const events = ["mousedown", "keydown", "touchstart", "mousemove"]
    events.forEach((evt) => window.addEventListener(evt, resetIdleTimer))

    return () => {
      clearTimeout(idleTimeout)
      clearTimeout(absoluteTimeout)
      events.forEach((evt) => window.removeEventListener(evt, resetIdleTimer))
    }
  }, [ready, user, router])

  if (!ready || !user || !isRoleAllowed(pathname, user.role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-white/10">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-md bg-sky-300" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          
          {/* Sliding Sidebar */}
          <div className="fixed inset-y-0 left-0 flex w-72 bg-[oklch(0.11_0.02_270)] shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
            <div className="absolute -right-12 top-4">
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <Navbar 
          user={{
            name: user.name,
            role: ("role" in user ? user.role : "employee") as "employee" | "manager" | "admin",
            avatar: ('avatar' in user && typeof (user as any).avatar === 'string') ? (user as any).avatar : undefined,
            profile_picture_url: ('profile_picture_url' in user && user.profile_picture_url) ? user.profile_picture_url : undefined,
          }} 
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        <AiBuddyChat />
      </div>
    </div>
  )
}
