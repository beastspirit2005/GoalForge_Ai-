"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Clock, Sparkles, TrendingUp } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getStoredToken } from "@/services/auth.service"
import { Goal } from "@/types/goal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SmartPriorities() {
  const [priorities, setPriorities] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPriorities() {
      try {
        const token = getStoredToken()
        const res = await apiFetch<Goal[]>("/goals/prioritized", { token })
        setPriorities(res.slice(0, 3)) // Show top 3
      } catch (err) {
        console.error("Failed to fetch priorities", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPriorities()
  }, [])

  if (loading) {
    return (
      <Card className="border-white/[0.06] bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-white/90">Smart Priorities</CardTitle>
          <CardDescription className="text-white/35">AI-ranked execution targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (priorities.length === 0) {
    return null
  }

  const rankColors = [
    "from-amber-400 to-amber-500 text-amber-950",
    "from-slate-300 to-slate-400 text-slate-900",
    "from-amber-600 to-amber-700 text-amber-100",
  ]

  return (
    <Card className="border-[var(--gf-indigo)]/15 bg-[var(--gf-indigo)]/[0.04] shadow-lg shadow-[var(--gf-indigo)]/[0.06] backdrop-blur-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--gf-indigo)]/15">
            <Sparkles className="h-4 w-4 text-[var(--gf-indigo)]" />
          </div>
          <CardTitle className="text-sm font-semibold text-white/90">Smart Priorities</CardTitle>
        </div>
        <CardDescription className="text-[12px] text-white/35">
          AI ranks your goals by deadline urgency, risk level, and strategic impact.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {priorities.map((goal, i) => (
            <div
              key={goal.id}
              className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${rankColors[i] || rankColors[2]} text-[11px] font-bold shadow-md`}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-[13px] font-medium text-white/85 line-clamp-1 group-hover:text-white">
                  {goal.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {goal.deadline && (
                    <span className="flex items-center gap-1 text-white/35">
                      <Clock className="h-3 w-3" />
                      Due {goal.deadline}
                    </span>
                  )}
                  {goal.risk.toLowerCase() === "high" && (
                    <span className="flex items-center gap-1 text-rose-400">
                      <AlertTriangle className="h-3 w-3" />
                      High Risk
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className="ml-auto border-white/[0.08] bg-white/[0.04] text-[10px] text-white/50"
                  >
                    {goal.progress}%
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
