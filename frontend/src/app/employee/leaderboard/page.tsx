"use client"

import { useState } from "react"
import { Trophy } from "lucide-react"
import DashboardLayout from "@/components/layout/DashboardLayout"

const leaderboardData = [
  { rank: 1, name: "Aarav Mehta", department: "People Ops", score: 92.4, badges: 6, goals: 4, consistency: 95, avatar: "AM" },
  { rank: 2, name: "Neha Rao", department: "Engineering", score: 87.1, badges: 5, goals: 5, consistency: 88, avatar: "NR" },
  { rank: 3, name: "Kabir Singh", department: "Sales", score: 81.6, badges: 4, goals: 3, consistency: 82, avatar: "KS" },
  { rank: 4, name: "Priya Nair", department: "Marketing", score: 79.3, badges: 4, goals: 4, consistency: 79, avatar: "PN" },
  { rank: 5, name: "Rohan Kapoor", department: "Engineering", score: 76.8, badges: 3, goals: 3, consistency: 76, avatar: "RK" },
  { rank: 6, name: "Ananya Sharma", department: "People Ops", score: 74.2, badges: 3, goals: 2, consistency: 73, avatar: "AS" },
  { rank: 7, name: "Vikram Joshi", department: "Sales", score: 71.5, badges: 2, goals: 3, consistency: 70, avatar: "VJ" },
  { rank: 8, name: "Maya Desai", department: "Marketing", score: 68.9, badges: 2, goals: 2, consistency: 67, avatar: "MD" },
]

type Period = "monthly" | "quarterly" | "yearly"

const podiumColors = [
  { bg: "from-amber-400 to-amber-500", shadow: "shadow-amber-500/25", ring: "ring-amber-400/30", label: "#1" },
  { bg: "from-slate-300 to-slate-400", shadow: "shadow-slate-400/20", ring: "ring-slate-300/30", label: "#2" },
  { bg: "from-amber-600 to-amber-700", shadow: "shadow-amber-700/20", ring: "ring-amber-600/30", label: "#3" },
]

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("monthly")
  const [deptFilter, setDeptFilter] = useState<string>("all")

  const departments = ["all", ...new Set(leaderboardData.map((d) => d.department))]
  const filtered = deptFilter === "all" ? leaderboardData : leaderboardData.filter((d) => d.department === deptFilter)
  const top3 = filtered.slice(0, 3)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Recognition based on consistency, execution quality, and productivity
            </p>
          </div>

          <div className="flex gap-2">
            {(["monthly", "quarterly", "yearly"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize transition-all ${
                  period === p
                    ? "border border-[var(--gf-indigo)]/25 bg-[var(--gf-indigo)]/15 text-[var(--gf-indigo)]"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                deptFilter === dept
                  ? "bg-[var(--gf-indigo)]/15 text-[var(--gf-indigo)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dept === "all" ? "All Departments" : dept}
            </button>
          ))}
        </div>

        {top3.length >= 3 && (
          <div className="flex items-end justify-center gap-4 py-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${podiumColors[1].bg} text-lg font-bold text-slate-900 shadow-xl ${podiumColors[1].shadow} ring-2 ${podiumColors[1].ring}`}>
                  {top3[1].avatar}
                </div>
                <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-100 dark:bg-card px-1.5 py-0.5 text-[10px] font-bold text-slate-800 dark:text-foreground ring-1 ring-slate-200 dark:ring-border">
                  {podiumColors[1].label}
                </span>
              </div>
              <p className="mt-3 text-[13px] font-semibold text-foreground">{top3[1].name}</p>
              <p className="text-[10px] text-muted-foreground">{top3[1].department}</p>
              <p className="mt-1 text-lg font-bold text-foreground">{top3[1].score}</p>
              <div className="mt-2 h-20 w-20 rounded-t-xl border border-border border-b-0 bg-gradient-to-b from-muted to-transparent" />
            </div>

            <div className="flex flex-col items-center">
              <div className="relative">
                <div className={`grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br ${podiumColors[0].bg} text-xl font-bold text-amber-950 shadow-2xl ${podiumColors[0].shadow} ring-2 ${podiumColors[0].ring} animate-pulse-glow`}>
                  {top3[0].avatar}
                </div>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-300 animate-float">
                  {podiumColors[0].label}
                </span>
              </div>
              <p className="mt-3 text-[14px] font-bold text-foreground">{top3[0].name}</p>
              <p className="text-[10px] text-muted-foreground">{top3[0].department}</p>
              <p className="mt-1 text-2xl font-bold text-gradient">{top3[0].score}</p>
              <div className="mt-2 h-28 w-24 rounded-t-xl border border-[var(--gf-indigo)]/15 border-b-0 bg-gradient-to-b from-[var(--gf-indigo)]/10 to-transparent" />
            </div>

            <div className="flex flex-col items-center">
              <div className="relative">
                <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${podiumColors[2].bg} text-base font-bold text-white shadow-xl ${podiumColors[2].shadow} ring-2 ${podiumColors[2].ring}`}>
                  {top3[2].avatar}
                </div>
                <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-100 dark:bg-card px-1.5 py-0.5 text-[10px] font-bold text-slate-800 dark:text-foreground ring-1 ring-slate-200 dark:ring-border">
                  {podiumColors[2].label}
                </span>
              </div>
              <p className="mt-3 text-[13px] font-semibold text-foreground">{top3[2].name}</p>
              <p className="text-[10px] text-muted-foreground">{top3[2].department}</p>
              <p className="mt-1 text-lg font-bold text-foreground">{top3[2].score}</p>
              <div className="mt-2 h-14 w-20 rounded-t-xl border border-border border-b-0 bg-gradient-to-b from-muted/80 to-transparent" />
            </div>
          </div>
        )}

        <div className="product-surface overflow-hidden rounded-xl">
          <div className="border-b border-border px-5 py-3">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Full Rankings
            </p>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[12px] font-bold ${
                    entry.rank <= 3
                      ? "bg-gradient-to-br from-amber-400/20 to-amber-500/10 text-amber-500 dark:text-amber-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  #{entry.rank}
                </span>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--gf-cyan)]/20 to-[var(--gf-indigo)]/20 text-[11px] font-bold text-foreground">
                  {entry.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{entry.name}</p>
                  <p className="text-[11px] text-muted-foreground">{entry.department}</p>
                </div>
                <div className="hidden items-center gap-6 text-center sm:flex">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Badges</p>
                    <p className="text-[13px] font-semibold text-foreground">{entry.badges}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Goals</p>
                    <p className="text-[13px] font-semibold text-foreground">{entry.goals}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Consistency</p>
                    <p className="text-[13px] font-semibold text-foreground">{entry.consistency}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{entry.score}</p>
                  <p className="text-[10px] text-muted-foreground">score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
