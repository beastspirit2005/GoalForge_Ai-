import { departmentProgress } from "@/lib/demo-data"

const barColors = [
  "from-[var(--gf-indigo)] to-[var(--gf-cyan)]",
  "from-amber-500 to-amber-400",
  "from-emerald-500 to-emerald-400",
  "from-[var(--gf-violet)] to-[var(--gf-indigo)]",
]

export default function CompletionChart() {
  return (
    <div className="space-y-4">
      {departmentProgress.map((item, i) => (
        <div key={item.name}>
          <div className="mb-2 flex items-center justify-between text-[12px]">
            <span className="font-medium text-white/60">{item.name}</span>
            <span className="text-white/30">
              {item.progress}% · {item.goals} goals
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-1.5 rounded-full bg-gradient-to-r ${barColors[i % barColors.length]} animate-progress-fill`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
