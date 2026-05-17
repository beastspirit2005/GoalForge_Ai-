"use client"

import { departmentProgress } from "@/lib/demo-data"

const colors = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
]

const intensities = [
  "bg-slate-100",
  "bg-sky-100",
  "bg-sky-200",
  "bg-sky-300",
  "bg-sky-400",
  "bg-sky-500",
]

function getIntensity(value: number): string {
  if (value >= 80) return intensities[5]
  if (value >= 60) return intensities[4]
  if (value >= 40) return intensities[3]
  if (value >= 20) return intensities[2]
  if (value > 0) return intensities[1]
  return intensities[0]
}

export default function HeatMap() {
  // Generate 4 weeks × departments grid
  const weeks = ["W1", "W2", "W3", "W4"]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="w-24" />
        {weeks.map((w) => (
          <span key={w} className="flex-1 text-center font-medium">
            {w}
          </span>
        ))}
      </div>
      {departmentProgress.map((dept, di) => (
        <div key={dept.name} className="flex items-center gap-2">
          <span className="w-24 truncate text-xs font-medium text-slate-700">
            {dept.name}
          </span>
          {weeks.map((w, wi) => {
            const simulated = Math.max(
              10,
              dept.progress - (3 - wi) * 15 + Math.floor(Math.random() * 10),
            )
            const value = Math.min(100, Math.max(0, simulated))
            return (
              <div
                key={w}
                className={`flex-1 rounded-md ${getIntensity(value)} flex h-10 items-center justify-center text-xs font-medium ${value >= 60 ? "text-white" : "text-slate-700"}`}
                title={`${dept.name} ${w}: ${value}%`}
              >
                {value}%
              </div>
            )
          })}
        </div>
      ))}
      <div className="flex items-center gap-1 pt-2">
        <span className="text-xs text-slate-500">Less</span>
        {intensities.map((c, i) => (
          <div key={i} className={`h-3 w-6 rounded-sm ${c}`} />
        ))}
        <span className="text-xs text-slate-500">More</span>
      </div>
    </div>
  )
}
