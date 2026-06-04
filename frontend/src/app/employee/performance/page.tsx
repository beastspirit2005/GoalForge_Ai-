"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Demo performance data (will be replaced with API calls)
const performanceData = {
  monthly: {
    label: "May 2026",
    overall: 78.4,
    milestone_completion: 82,
    consistency: 75,
    productivity: 81,
    update_frequency: 70,
    planned_vs_actual: 76,
    progress_growth: 85,
  },
  quarterly: {
    label: "Q2 2026",
    overall: 74.2,
    milestone_completion: 78,
    consistency: 72,
    productivity: 76,
    update_frequency: 65,
    planned_vs_actual: 73,
    progress_growth: 80,
  },
  yearly: {
    label: "2026",
    overall: 71.8,
    milestone_completion: 74,
    consistency: 70,
    productivity: 73,
    update_frequency: 62,
    planned_vs_actual: 70,
    progress_growth: 78,
  },
}

const badges = [
  { type: "first_goal", title: "First Steps", icon: "🎯", desc: "Created your first goal", earned: true },
  { type: "streak_7", title: "Weekly Warrior", icon: "🔥", desc: "7-day update streak", earned: true },
  { type: "milestone_master", title: "Milestone Master", icon: "🏗️", desc: "Completed 20 milestones", earned: true },
  { type: "ai_adopter", title: "AI Adopter", icon: "🤖", desc: "Used AI features 10+ times", earned: true },
  { type: "goal_crusher", title: "Goal Crusher", icon: "💪", desc: "Completed 5 goals", earned: false },
  { type: "consistency_king", title: "Consistency King", icon: "👑", desc: "95%+ consistency score", earned: false },
  { type: "early_finisher", title: "Early Finisher", icon: "⚡", desc: "Completed ahead of deadline", earned: false },
  { type: "top_performer", title: "Top Performer", icon: "🏆", desc: "Ranked #1 in a period", earned: false },
]

const streaks = [
  { type: "daily_update", label: "Daily Updates", current: 12, best: 18, icon: "🔥", active: true },
  { type: "weekly_milestone", label: "Weekly Milestones", current: 4, best: 6, icon: "⭐", active: true },
  { type: "checkin", label: "Check-in Streak", current: 3, best: 5, icon: "📋", active: true },
]

type Period = "monthly" | "quarterly" | "yearly"

function PerformanceRing({ value, size = 120, strokeWidth = 8, color = "var(--gf-indigo)" }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(1 0 0 / 0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{value.toFixed(1)}</span>
        <span className="text-[10px] text-white/35">score</span>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-white/50">{label}</span>
        <span className="font-medium text-white/70">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full animate-progress-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function PerformancePage() {
  const [period, setPeriod] = useState<Period>("monthly")
  const data = performanceData[period]

  const periodTabs: { key: Period; label: string; award: string }[] = [
    { key: "monthly", label: "Monthly", award: "🏆 Employee of the Month" },
    { key: "quarterly", label: "Quarterly", award: "📈 Top Performer" },
    { key: "yearly", label: "Yearly", award: "👑 Employee of the Year" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--gf-indigo)]" />
              <h1 className="text-2xl font-bold text-white/90">Performance Intelligence</h1>
            </div>
            <p className="mt-1 text-[13px] text-white/35">
              Track your performance across monthly, quarterly, and yearly cycles
            </p>
          </div>
        </div>

        {/* ── Period tabs ── */}
        <div className="flex gap-2">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
                period === tab.key
                  ? "bg-[var(--gf-indigo)]/15 border border-[var(--gf-indigo)]/25 text-[var(--gf-indigo)] shadow-lg shadow-[var(--gf-indigo)]/10"
                  : "border border-white/[0.06] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Score overview ── */}
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Overall score ring */}
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
              {data.label} — Overall Score
            </p>
            <div className="mt-5 flex justify-center">
              <PerformanceRing value={data.overall} size={160} strokeWidth={10} />
            </div>
            <div className="mt-4 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
              <p className="text-[12px] font-medium text-amber-400">
                {periodTabs.find((t) => t.key === period)?.award}
              </p>
              <p className="mt-0.5 text-[11px] text-white/30">Top 10% in your department</p>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/80">Score Breakdown</h3>
            <p className="mt-0.5 text-[11px] text-white/30">Performance across 6 dimensions</p>
            <div className="mt-5 space-y-4">
              <ScoreBar label="Milestone Completion" value={data.milestone_completion} color="oklch(0.72 0.18 265)" />
              <ScoreBar label="Consistency" value={data.consistency} color="oklch(0.75 0.18 160)" />
              <ScoreBar label="Productivity" value={data.productivity} color="oklch(0.80 0.14 200)" />
              <ScoreBar label="Update Frequency" value={data.update_frequency} color="oklch(0.68 0.22 310)" />
              <ScoreBar label="Planned vs Actual" value={data.planned_vs_actual} color="oklch(0.82 0.16 85)" />
              <ScoreBar label="Progress Growth" value={data.progress_growth} color="oklch(0.68 0.20 15)" />
            </div>
          </div>
        </div>

        {/* ── Badges & Streaks ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Badges */}
          <div className="glass-card rounded-xl p-6">
            <div className="mb-5 flex items-center gap-2">
              <Award className="h-5 w-5 text-[var(--gf-amber)]" />
              <h3 className="text-sm font-semibold text-white/80">Badges</h3>
              <span className="ml-auto text-[11px] text-white/30">
                {badges.filter((b) => b.earned).length}/{badges.length} earned
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badges.map((badge) => (
                <div
                  key={badge.type}
                  className={`group flex flex-col items-center rounded-xl border p-3 text-center transition-all duration-300 ${
                    badge.earned
                      ? "border-white/[0.08] bg-white/[0.04] hover:border-white/[0.15] hover:bg-white/[0.07]"
                      : "border-white/[0.04] bg-white/[0.01] opacity-40"
                  }`}
                >
                  <span className={`text-2xl ${badge.earned ? "animate-float" : ""}`}>{badge.icon}</span>
                  <p className="mt-1.5 text-[11px] font-semibold text-white/70">{badge.title}</p>
                  <p className="mt-0.5 text-[9px] text-white/25 line-clamp-2">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Streaks */}
          <div className="glass-card rounded-xl p-6">
            <div className="mb-5 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <h3 className="text-sm font-semibold text-white/80">Active Streaks</h3>
            </div>
            <div className="space-y-4">
              {streaks.map((streak) => (
                <div
                  key={streak.type}
                  className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/[0.12]"
                >
                  <span className="text-3xl animate-streak-fire">{streak.icon}</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-white/80">{streak.label}</p>
                    <p className="text-[11px] text-white/30">Best: {streak.best} days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{streak.current}</p>
                    <p className="text-[10px] text-white/30">days</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
