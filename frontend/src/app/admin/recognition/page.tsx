import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Sparkles, Shield, Medal, Star, Flame } from "lucide-react"

const recentAwards = [
  { 
    user: "Aarav Mehta", 
    badge: "Sprint Champion", 
    reason: "Completed all Q2 technical milestones ahead of schedule.", 
    date: "16 May 2026", 
    icon: Trophy, 
    color: "text-amber-500", 
    bg: "bg-amber-500/10" 
  },
  { 
    user: "Priya Nair", 
    badge: "Culture Ambassador", 
    reason: "Organized remote team-building and mentorship sessions.", 
    date: "12 May 2026", 
    icon: Sparkles, 
    color: "text-violet-500", 
    bg: "bg-violet-500/10" 
  },
  { 
    user: "Rohan Kapoor", 
    badge: "Zero-Defect Hero", 
    reason: "Delivered payment microservice with 0 critical bugs.", 
    date: "08 May 2026", 
    icon: Shield, 
    color: "text-emerald-500", 
    bg: "bg-emerald-500/10" 
  },
]

export default function RecognitionPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Recognition & Rewards
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/40">
            Manage employee trophies, monitor performance streaks, and award outstanding execution.
          </p>
        </div>

        {/* Top metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-white/40">Total Trophies</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">128</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/20">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-white/40">Active Streaks</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">45</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg shadow-indigo-500/20">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-white/40">Top Performer</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">Aarav M.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Awards List */}
        <Card className="glass-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Recent Recognitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAwards.map((award, idx) => {
                const Icon = award.icon
                return (
                  <div key={idx} className="flex items-start gap-4 rounded-lg bg-slate-50 dark:bg-white/[0.02] p-4 border border-slate-100 dark:border-white/[0.04] transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.04]">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${award.bg}`}>
                      <Icon className={`h-5 w-5 ${award.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-bold text-slate-900 dark:text-white">{award.user}</p>
                        <span className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-white/30 uppercase">{award.date}</span>
                      </div>
                      <p className="mt-0.5 text-[12px] font-bold text-[var(--gf-indigo)] dark:text-indigo-400">{award.badge}</p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-white/60">{award.reason}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
