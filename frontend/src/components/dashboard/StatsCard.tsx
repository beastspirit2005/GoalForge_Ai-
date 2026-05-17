"use client"

import { useEffect, useRef, useState } from "react"

type StatsCardProps = {
  label: string
  value: string
  change: string
  icon: React.ElementType
  tone?: string
}

export default function StatsCard({ label, value, change, icon: Icon, tone }: StatsCardProps) {
  const [displayed, setDisplayed] = useState("0")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Extract numeric part for animation
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""))
    const suffix = value.replace(/[0-9.]/g, "")
    if (isNaN(numeric)) {
      setDisplayed(value)
      return
    }

    let start = 0
    const duration = 1200
    const stepTime = 16
    const steps = duration / stepTime
    const increment = numeric / steps

    const timer = setInterval(() => {
      start += increment
      if (start >= numeric) {
        start = numeric
        clearInterval(timer)
      }
      setDisplayed(
        (Number.isInteger(numeric) ? Math.floor(start).toString() : start.toFixed(1)) + suffix
      )
    }, stepTime)

    return () => clearInterval(timer)
  }, [value])

  // Determine accent color from tone or default
  const accentColors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    sky: {
      border: "border-sky-500/20",
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      glow: "shadow-sky-500/10",
    },
    emerald: {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/10",
    },
    violet: {
      border: "border-violet-500/20",
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      glow: "shadow-violet-500/10",
    },
    amber: {
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      glow: "shadow-amber-500/10",
    },
  }

  // Detect tone from the tone string
  const detected = tone
    ? Object.keys(accentColors).find((k) => tone.includes(k)) || "sky"
    : "sky"
  const accent = accentColors[detected]

  return (
    <div
      ref={ref}
      className="group glass-card-hover rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-wider text-white/35">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white animate-counter-up">
            {displayed}
          </p>
          <p className={`mt-1.5 text-[12px] font-medium ${accent.text}`}>
            {change}
          </p>
        </div>
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accent.border} ${accent.bg} shadow-lg ${accent.glow} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className={`h-5 w-5 ${accent.text}`} />
        </div>
      </div>
    </div>
  )
}
