import { CalendarDays, UserRound } from "lucide-react"
import GoalStatusBadge from "@/components/goals/GoalStatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Goal } from "@/lib/demo-data"

type Props = {
  goal: Goal
}

export default function GoalCard({ goal }: Props) {
  return (
    <Card className="metric-card rounded-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold text-slate-950">
            {goal.title}
          </CardTitle>
          <GoalStatusBadge risk={goal.risk} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">{goal.target}</p>
        <div className="mt-4 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-sky-600"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            {goal.owner}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Due {goal.deadline}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
