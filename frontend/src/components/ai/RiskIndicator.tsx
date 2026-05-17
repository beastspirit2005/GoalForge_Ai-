import { AlertTriangle } from "lucide-react"
import GoalStatusBadge from "@/components/goals/GoalStatusBadge"
import type { GoalRisk } from "@/lib/demo-data"

type Props = {
  risk: GoalRisk
  reason: string
}

export default function RiskIndicator({ risk, reason }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
          Risk signal
        </div>
        <GoalStatusBadge risk={risk} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{reason}</p>
    </div>
  )
}
