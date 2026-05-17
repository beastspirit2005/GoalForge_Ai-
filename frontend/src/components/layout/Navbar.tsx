"use client"

import { Bell, LogOut, Search, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"

type NavbarUser = {
  name: string
  role: string
  avatar?: string
  profile_picture_url?: string | null
}

type NavbarProps = {
  user: NavbarUser
}

const roleLabel: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "Admin",
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <div className="dashboard-navbar sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-white/[0.06] bg-[oklch(0.13_0.015_270)]/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--gf-indigo)]" />
          <h2 className="text-sm font-semibold text-white/90">
            Performance Intelligence
          </h2>
        </div>
        <p className="mt-0.5 text-[12px] text-white/35">
          AI-assisted goals, predictions, and workforce analytics
        </p>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/25" />
          <Input
            className="h-9 w-64 rounded-lg border-white/[0.08] dark:bg-white/[0.04] bg-slate-100 pl-9 text-[13px] text-slate-800 dark:text-white/80 placeholder:text-slate-400 dark:placeholder:text-white/25 focus:border-[var(--gf-indigo)]/30 focus:dark:bg-white/[0.06] focus:bg-slate-200"
            placeholder="Search goals or teams..."
          />
        </div>
        <Button
          size="icon"
          variant="outline"
          aria-label="Notifications"
          onClick={() => alert("No new notifications")}
          className="dark:border-white/[0.08] border-slate-200 dark:bg-white/[0.04] bg-slate-100 dark:text-white/40 text-slate-500 dark:hover:border-white/[0.14] hover:border-slate-300 dark:hover:bg-white/[0.07] hover:bg-slate-200 dark:hover:text-white/70 hover:text-slate-700"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 backdrop-blur-lg">
          <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[var(--gf-cyan)] to-[var(--gf-indigo)] text-[11px] font-bold text-white shadow-lg shadow-[var(--gf-indigo)]/20">
            {user.profile_picture_url || user.avatar ? (
              <img src={user.profile_picture_url || user.avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user.name.split(" ").map(n => n[0]).join("")
            )}
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-4 text-slate-800 dark:text-white/90">
              {user.name}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-white/35">{roleLabel[user.role]}</p>
          </div>
        </div>
        <Button
          size="icon"
          variant="outline"
          aria-label="Logout"
          onClick={handleLogout}
          className="dark:border-white/[0.08] border-slate-200 dark:bg-white/[0.04] bg-slate-100 dark:text-white/40 text-slate-500 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[var(--gf-cyan)] to-[var(--gf-indigo)] text-[11px] font-bold text-white">
          {user.profile_picture_url || user.avatar ? (
            <img src={user.profile_picture_url || user.avatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            user.name.split(" ").map(n => n[0]).join("")
          )}
        </div>
        <Button
          size="icon"
          variant="outline"
          aria-label="Logout"
          onClick={handleLogout}
          className="dark:border-white/[0.08] border-slate-200 dark:bg-white/[0.04] bg-slate-100 dark:text-white/40 text-slate-500 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500 md:hidden"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
