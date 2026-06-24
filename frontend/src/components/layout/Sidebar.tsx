"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Brain,
  CalendarDays,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Zap,
  Activity,
  Award,
  Shield,
  Settings,
  Flame,
  Search,
  GraduationCap,
  Gamepad2,
  PieChart,
  Cpu,
  ListTodo,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import BrandLogo from "./BrandLogo"

type NavLink = {
  title: string
  href: string
  icon: React.ElementType
  section?: string
}

const links: NavLink[] = [
  // Employee
  { title: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard, section: "Employee" },
  { title: "Assigned Tasks", href: "/employee/tasks", icon: ListTodo, section: "Employee" },
  { title: "My Team", href: "/employee/my-team", icon: Users, section: "Employee" },
  { title: "Goals", href: "/employee/goals", icon: Target, section: "Employee" },
  { title: "Check-ins", href: "/employee/checkins", icon: CalendarDays, section: "Employee" },
  { title: "AI Insights", href: "/employee/ai-insights", icon: Brain, section: "Employee" },
  { title: "Performance", href: "/employee/performance", icon: Activity, section: "Employee" },
  { title: "Skill Profile", href: "/employee/skill-profile", icon: GraduationCap, section: "Employee" },
  { title: "Gamification", href: "/employee/gamification", icon: Gamepad2, section: "Employee" },
  { title: "Leaderboard", href: "/employee/leaderboard", icon: Trophy, section: "Employee" },
  // Manager
  { title: "Manager", href: "/manager/dashboard", icon: Users, section: "Manager" },
  { title: "Tasks", href: "/manager/tasks", icon: ListTodo, section: "Manager" },
  { title: "My Team", href: "/manager/my-team", icon: Users, section: "Manager" },
  { title: "Approvals", href: "/manager/approvals", icon: ClipboardCheck, section: "Manager" },
  { title: "Comments", href: "/manager/comments", icon: MessageSquare, section: "Manager" },
  { title: "Predictions", href: "/manager/predictions", icon: Zap, section: "Manager" },
  { title: "Workload", href: "/manager/workload", icon: Flame, section: "Manager" },
  { title: "Capacity Simulator", href: "/manager/simulator", icon: Cpu, section: "Manager" },
  // Admin
  { title: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, section: "Admin" },
  { title: "Targets", href: "/admin/targets", icon: Target, section: "Admin" },
  { title: "Analytics", href: "/admin/org-analytics", icon: BarChart3, section: "Admin" },
  { title: "Users", href: "/admin/users", icon: Users, section: "Admin" },
  { title: "Managers", href: "/admin/managers", icon: Users, section: "Admin" },
  { title: "Talent Search", href: "/admin/talent-search", icon: Search, section: "Admin" },
  { title: "Capacity", href: "/admin/capacity", icon: PieChart, section: "Admin" },
  { title: "Recognition", href: "/admin/recognition", icon: Award, section: "Admin" },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: FileText, section: "Admin" },
  { title: "Cycles", href: "/admin/cycles", icon: CalendarDays, section: "Admin" },
  { title: "Escalations", href: "/admin/escalations", icon: Shield, section: "Admin" },
  // Super Admin
  { title: "System Settings", href: "/admin/system-settings", icon: Settings, section: "SuperAdmin" },
  { title: "Platform Health", href: "/admin/platform-health", icon: Activity, section: "SuperAdmin" },
  // Account
  { title: "Settings", href: "/settings", icon: Settings, section: "Account" },
]

type SidebarProps = {
  onClose?: () => void
  isMobile?: boolean
}

export default function Sidebar({ onClose, isMobile }: SidebarProps = {}) {
  const pathname = usePathname()
  const { user } = useAuth()

  const role = user ? ("role" in user ? user.role : "") : ""
  
  const visibleLinks = links.filter((link) => {
    if (!role) return false
    if (link.section === "Account") return true
    if (role === "super_admin") return true
    if (role === "admin" && link.section === "Admin") return true
    if (role === "manager" && link.section === "Manager") return true
    if (role === "employee" && link.section === "Employee") return true
    return false
  })

  return (
    <aside className={cn(
      "dashboard-sidebar min-h-screen w-72 shrink-0 border-r border-slate-200 bg-slate-50 p-4 text-slate-900 dark:border-white/[0.06] dark:bg-[oklch(0.11_0.02_270)] dark:text-white",
      !isMobile && "hidden lg:block"
    )}>
      {/* ── Logo area ── */}
      <Link href="/" className="group block">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 group-hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.04] dark:backdrop-blur-lg dark:group-hover:border-white/[0.14] dark:group-hover:bg-white/[0.07]">
          <BrandLogo />
        </div>
      </Link>

      {/* ── Navigation ── */}
      <nav className="mt-6 space-y-0.5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
        {visibleLinks.map((link, index) => {
          const Icon = link.icon
          const active = pathname === link.href || pathname.startsWith(link.href + "/")
          const previousSection = visibleLinks[index - 1]?.section
          const showSection = link.section && link.section !== previousSection

          let displayTitle = link.title;
          if (link.href === "/admin/managers") {
            if (role === "super_admin") displayTitle = "Teams";
            if (role === "admin") displayTitle = "My Team";
          }

          return (
            <div key={link.href}>
              {showSection && (
                <p className="mb-1.5 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-white/25">
                  {link.section}
                </p>
              )}
              <Link
                href={link.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 transition-all duration-200 hover:bg-slate-200/80 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white/80",
                  active &&
                    "border border-[var(--gf-indigo)]/25 bg-gradient-to-r from-[var(--gf-indigo)]/15 to-transparent text-slate-900 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-[var(--gf-indigo)]" : "text-slate-400 group-hover:text-slate-600 dark:text-white/30 dark:group-hover:text-white/60"
                  )}
                />
                <span>{displayTitle}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--gf-indigo)] shadow-[0_0_6px_var(--gf-indigo)]" />
                )}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* ── User card ── */}
      {user ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03] dark:backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[var(--gf-cyan)] to-[var(--gf-indigo)] text-[11px] font-bold text-white shadow-lg">
              {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white/90">{user.name}</p>
              <div className="flex items-center gap-2 text-[11px] capitalize text-slate-500 dark:text-white/35">
                {"role" in user ? (user.role as string).replace("_", " ") : ""}
                {role === "super_admin" && (
                  <span className="rounded-[4px] border border-rose-500/50 bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    SUPER ADMIN
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Link
        href="/login"
        className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/40 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.06] dark:hover:text-white/70"
      >
        <LogIn className="h-4 w-4" />
        Switch role
      </Link>
    </aside>
  )
}
