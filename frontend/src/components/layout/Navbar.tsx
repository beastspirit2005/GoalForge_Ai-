"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, LogOut, Search, Sparkles, User, Briefcase, Mail, CheckCircle2, TrendingUp, X } from "lucide-react"
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

// Seeded users from database/seed.sql
const demoUsers = [
  { name: "Aarav Mehta", email: "employee@goalforge.ai", role: "employee", department: "People Ops", avatarColor: "from-blue-500 to-indigo-500", goalsCount: 1, avgProgress: 72 },
  { name: "Priya Nair", email: "manager@goalforge.ai", role: "manager", department: "Engineering", avatarColor: "from-purple-500 to-pink-500", goalsCount: 1, avgProgress: 46 },
  { name: "Rohan Kapoor", email: "admin@goalforge.ai", role: "admin", department: "HR", avatarColor: "from-amber-500 to-orange-500", goalsCount: 1, avgProgress: 31 },
  { name: "Neha Rao", email: "neha@goalforge.ai", role: "employee", department: "Engineering", avatarColor: "from-emerald-500 to-teal-500", goalsCount: 0, avgProgress: 0 },
  { name: "Kabir Singh", email: "kabir@goalforge.ai", role: "employee", department: "Sales", avatarColor: "from-rose-500 to-red-500", goalsCount: 0, avgProgress: 0 }
]

// Seeded goals from database/seed.sql
const demoGoalsList = [
  { id: 1, title: "Launch AI onboarding playbook", user: "Aarav Mehta", progress: 72, risk: "Low", status: "approved" },
  { id: 2, title: "Improve sprint delivery predictability", user: "Neha Rao", progress: 46, risk: "Medium", status: "approved" },
  { id: 3, title: "Grow enterprise pipeline", user: "Kabir Singh", progress: 31, risk: "High", status: "pending" }
]

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<typeof demoUsers[0] | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Filter matching users
  const matchingUsers = demoUsers.filter(u =>
    searchQuery.trim() !== "" &&
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Filter matching goals
  const matchingGoals = demoGoalsList.filter(g =>
    searchQuery.trim() !== "" &&
    (g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     g.user.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const hasResults = matchingUsers.length > 0 || matchingGoals.length > 0

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
        {/* Search Bar Container */}
        <div className="relative" ref={searchRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/25" />
          <Input
            className="h-9 w-64 rounded-lg border-white/[0.08] dark:bg-white/[0.04] bg-slate-100 pl-9 text-[13px] text-slate-800 dark:text-white/80 placeholder:text-slate-400 dark:placeholder:text-white/25 focus:border-[var(--gf-indigo)]/30 focus:dark:bg-white/[0.06] focus:bg-slate-200"
            placeholder="Search goals or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
          />

          {/* Search Dropdown Panel */}
          {isFocused && searchQuery.trim() !== "" && (
            <div className="absolute right-0 top-11 z-30 w-80 overflow-hidden rounded-xl border border-white/[0.08] bg-[oklch(0.14_0.015_270)]/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-2 duration-150">
              {hasResults ? (
                <div className="space-y-4 max-h-[320px] overflow-y-auto p-1">
                  {/* People Section */}
                  {matchingUsers.length > 0 && (
                    <div>
                      <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 border-b border-white/[0.04]">
                        People
                      </p>
                      <div className="mt-1.5 space-y-1">
                        {matchingUsers.map(userItem => (
                          <button
                            key={userItem.email}
                            onClick={() => {
                              setSelectedPerson(userItem)
                              setIsFocused(false)
                              setSearchQuery("")
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
                          >
                            <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${userItem.avatarColor} text-[10px] font-bold text-white`}>
                              {userItem.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-white/90 truncate">{userItem.name}</p>
                              <p className="text-[10px] text-white/35 truncate">{userItem.department} • {roleLabel[userItem.role]}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Goals Section */}
                  {matchingGoals.length > 0 && (
                    <div>
                      <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 border-b border-white/[0.04]">
                        Goals
                      </p>
                      <div className="mt-1.5 space-y-1">
                        {matchingGoals.map(goalItem => (
                          <button
                            key={goalItem.id}
                            onClick={() => {
                              router.push("/employee/goals")
                              setIsFocused(false)
                              setSearchQuery("")
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
                          >
                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-white/90 truncate">{goalItem.title}</p>
                              <p className="text-[10px] text-white/35 truncate">Progress: {goalItem.progress}% • Owner: {goalItem.user}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-white/30">
                  No matching people or goals found.
                </div>
              )}
            </div>
          )}
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

      {/* ── User Profile Detail Modal (Custom Premium Modal) ── */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[oklch(0.12_0.015_270)] p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setSelectedPerson(null)}
              className="absolute right-4 top-4 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Profile Content */}
            <div className="flex flex-col items-center text-center mt-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
              <div className={`grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br ${selectedPerson.avatarColor} text-2xl font-bold text-white shadow-xl shadow-indigo-500/10`}>
                {selectedPerson.name.split(" ").map(n => n[0]).join("")}
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{selectedPerson.name}</h3>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--gf-indigo)]/10 border border-[var(--gf-indigo)]/20 px-3 py-0.5 text-xs font-semibold text-[var(--gf-indigo)] capitalize">
                {roleLabel[selectedPerson.role]}
              </span>

              {/* Metadata Info Panel */}
              <div className="mt-6 w-full space-y-3 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 text-[13px] text-white/60">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-white/30" /> Department
                  </span>
                  <span className="font-semibold text-white/80">{selectedPerson.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-white/30" /> Email
                  </span>
                  <span className="font-semibold text-white/80">{selectedPerson.email}</span>
                </div>
              </div>

              {/* Stats Matrix Grid */}
              <div className="mt-4 grid w-full grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-white/35 font-semibold">Active Goals</span>
                  <p className="mt-1 text-2xl font-bold text-white">{selectedPerson.goalsCount}</p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-white/35 font-semibold">Avg Progress</span>
                  <p className="mt-1 text-2xl font-bold text-emerald-400">{selectedPerson.avgProgress}%</p>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="mt-6 w-full">
                <Button
                  onClick={() => setSelectedPerson(null)}
                  className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.05] text-xs text-white/80 hover:bg-white/[0.08] transition-colors"
                >
                  Close Profile card
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
