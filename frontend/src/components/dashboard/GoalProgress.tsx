import GoalStatusBadge from "@/components/goals/GoalStatusBadge"
import type { Goal } from "@/lib/demo-data"

type Props = {
  goal: Goal
}

const riskBarColors: Record<string, string> = {
  Low: "from-emerald-500 to-emerald-400",
  Medium: "from-amber-500 to-amber-400",
  High: "from-rose-500 to-rose-400",
}

export default function GoalProgress({ goal }: Props) {
  const barColor = riskBarColors[goal.risk] || "from-[var(--gf-indigo)] to-[var(--gf-cyan)]"

  return (
    <div className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/90">{goal.title}</p>
          <p className="mt-1 text-[12px] text-white/35">
            {goal.owner} · {goal.department} · Due {goal.deadline}
          </p>
        </div>
        <GoalStatusBadge status={goal.status} />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${barColor} animate-progress-fill`}
          style={{ width: `${goal.progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px]">
        <span className="text-white/35">{goal.target}</span>
        <span className="font-semibold text-white/70">{goal.progress}%</span>
      </div>
    </div>
  )
}
