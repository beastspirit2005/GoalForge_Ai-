import { Badge } from "@/components/ui/badge"
import type { GoalRisk, GoalStatus } from "@/lib/demo-data"

type Props = {
  status?: GoalStatus
  risk?: GoalRisk
}

const statusClass: Record<GoalStatus, string> = {
  "On Track": "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  "Needs Review": "border-amber-500/20 bg-amber-500/10 text-amber-400",
  "At Risk": "border-rose-500/20 bg-rose-500/10 text-rose-400",
  Completed: "border-white/10 bg-white/5 text-white/60",
}

const riskClass: Record<GoalRisk, string> = {
  Low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  Medium: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  High: "border-rose-500/20 bg-rose-500/10 text-rose-400",
}

const statusDot: Record<GoalStatus, string> = {
  "On Track": "bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400/0.6)]",
  "Needs Review": "bg-amber-400 shadow-[0_0_6px_theme(colors.amber.400/0.6)]",
  "At Risk": "bg-rose-400 shadow-[0_0_6px_theme(colors.rose.400/0.6)]",
  Completed: "bg-white/40",
}

export default function GoalStatusBadge({ status, risk }: Props) {
  const label = status ?? `${risk} Risk`
  const className = status ? statusClass[status] : riskClass[risk ?? "Low"]
  const dot = status ? statusDot[status] : null

  return (
    <Badge className={`gap-1.5 border text-[11px] font-medium ${className}`} variant="outline">
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label}
    </Badge>
  )
}
