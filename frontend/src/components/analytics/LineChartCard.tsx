import { weeklyMomentum } from "@/lib/demo-data"

export default function LineChartCard() {
  const max = Math.max(...weeklyMomentum.map((item) => item.value))

  return (
    <div className="flex h-52 items-end gap-3">
      {weeklyMomentum.map((item) => (
        <div key={item.week} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end rounded-md bg-slate-100">
            <div
              className="w-full rounded-md bg-emerald-500"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{item.week}</span>
        </div>
      ))}
    </div>
  )
}
