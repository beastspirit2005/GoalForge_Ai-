"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Flame,
  Shield,
  Target,
  Zap,
} from "lucide-react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Badge } from "@/components/ui/badge"

// Demo prediction data
const goalPredictions = [
  {
    id: 1,
    title: "Launch AI onboarding playbook",
    owner: "Aarav Mehta",
    probability: 85,
    risk: "Low",
    progress: 72,
    days_remaining: 42,
    factors: [
      { name: "Progress Rate", score: 88, weight: "40%" },
      { name: "Milestone Trajectory", score: 82, weight: "20%" },
      { name: "Workload Balance", score: 80, weight: "15%" },
      { name: "Update Recency", score: 100, weight: "15%" },
      { name: "Goal Priority", score: 60, weight: "10%" },
    ],
  },
  {
    id: 2,
    title: "Improve sprint delivery predictability",
    owner: "Neha Rao",
    probability: 58,
    risk: "Medium",
    progress: 46,
    days_remaining: 56,
    factors: [
      { name: "Progress Rate", score: 52, weight: "40%" },
      { name: "Milestone Trajectory", score: 40, weight: "20%" },
      { name: "Workload Balance", score: 55, weight: "15%" },
      { name: "Update Recency", score: 75, weight: "15%" },
      { name: "Goal Priority", score: 80, weight: "10%" },
    ],
  },
  {
    id: 3,
    title: "Grow enterprise pipeline",
    owner: "Kabir Singh",
    probability: 32,
    risk: "High",
    progress: 31,
    days_remaining: 14,
    factors: [
      { name: "Progress Rate", score: 28, weight: "40%" },
      { name: "Milestone Trajectory", score: 25, weight: "20%" },
      { name: "Workload Balance", score: 30, weight: "15%" },
      { name: "Update Recency", score: 45, weight: "15%" },
      { name: "Goal Priority", score: 60, weight: "10%" },
    ],
  },
]

const teamBurnout = [
  { name: "Aarav Mehta", risk: 22, level: "Low", goals: 3, department: "People Ops" },
  { name: "Neha Rao", risk: 48, level: "Medium", goals: 5, department: "Engineering" },
  { name: "Kabir Singh", risk: 71, level: "High", goals: 7, department: "Sales" },
  { name: "Priya Nair", risk: 35, level: "Low", goals: 4, department: "Marketing" },
]

const delayedGoals = [
  { title: "Grow enterprise pipeline", owner: "Kabir Singh", progress: 31, days_remaining: 14, daily_needed: 4.9, severity: "high" },
  { title: "Reduce customer churn", owner: "Vikram Joshi", progress: 22, days_remaining: 21, daily_needed: 3.7, severity: "medium" },
]

function PredictionGauge({ value, size = 100 }: { value: number; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = Math.PI * radius // Half circle
  const offset = circumference - (value / 100) * circumference

  const color =
    value >= 75
      ? "oklch(0.75 0.18 160)"
      : value >= 50
      ? "oklch(0.82 0.16 85)"
      : "oklch(0.68 0.20 15)"

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 10} className="overflow-visible">
        <path
          d={`M 6 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none"
          stroke="oklch(1 0 0 / 0.06)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M 6 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span className="text-xl font-bold text-white">{value}%</span>
      </div>
    </div>
  )
}

function BurnoutMeter({ risk, level }: { risk: number; level: string }) {
  const color =
    level === "Low"
      ? "bg-emerald-500"
      : level === "Medium"
      ? "bg-amber-500"
      : "bg-rose-500"
  const glow =
    level === "Low"
      ? "shadow-emerald-500/30"
      : level === "Medium"
      ? "shadow-amber-500/30"
      : "shadow-rose-500/30"

  return (
    <div className="space-y-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-2 rounded-full ${color} shadow-lg ${glow} transition-all duration-1000`}
          style={{ width: `${risk}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px]">
        <span className="text-white/25">0</span>
        <span className="text-white/25">100</span>
      </div>
    </div>
  )
}

export default function PredictionsPage() {
  const [selectedGoal, setSelectedGoal] = useState(goalPredictions[0])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[var(--gf-violet)]" />
            <h1 className="text-2xl font-bold text-white/90">Predictive Analytics</h1>
          </div>
          <p className="mt-1 text-[13px] text-white/35">
            Smart heuristic predictions for completion probability, burnout risk, and delayed goals
          </p>
        </div>

        {/* ── Goal predictions ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="glass-card rounded-xl p-5">
            <div className="mb-5 flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--gf-indigo)]" />
              <h3 className="text-sm font-semibold text-white/80">Completion Probability</h3>
            </div>
            <div className="space-y-3">
              {goalPredictions.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal)}
                  className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                    selectedGoal.id === goal.id
                      ? "border-[var(--gf-indigo)]/20 bg-[var(--gf-indigo)]/5"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-white/85 truncate">{goal.title}</p>
                      <p className="text-[11px] text-white/30">{goal.owner} · {goal.days_remaining} days left</p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          goal.risk === "Low"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : goal.risk === "Medium"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {goal.risk}
                      </Badge>
                      <span
                        className={`text-lg font-bold ${
                          goal.probability >= 75
                            ? "text-emerald-400"
                            : goal.probability >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {goal.probability}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        goal.probability >= 75
                          ? "bg-emerald-500"
                          : goal.probability >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${goal.probability}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Factor breakdown */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white/80">Risk Factor Breakdown</h3>
            <p className="mt-0.5 text-[11px] text-white/30">{selectedGoal.title}</p>

            <div className="mt-5 flex justify-center">
              <PredictionGauge value={selectedGoal.probability} size={140} />
            </div>

            <div className="mt-6 space-y-3">
              {selectedGoal.factors.map((factor) => (
                <div key={factor.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/45">{factor.name}</span>
                    <span className="text-white/60">{factor.score}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-1 rounded-full transition-all duration-700 ${
                        factor.score >= 70
                          ? "bg-emerald-500"
                          : factor.score >= 40
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Burnout & Delayed ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Burnout risk */}
          <div className="glass-card rounded-xl p-5">
            <div className="mb-5 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-white/80">Team Burnout Risk</h3>
            </div>
            <div className="space-y-4">
              {teamBurnout.map((member) => (
                <div key={member.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-white/80">{member.name}</p>
                      <p className="text-[11px] text-white/30">{member.department} · {member.goals} goals</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        member.level === "Low"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : member.level === "Medium"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                          : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {member.risk}% risk
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <BurnoutMeter risk={member.risk} level={member.level} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delayed goals */}
          <div className="glass-card rounded-xl p-5">
            <div className="mb-5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white/80">Predicted Delays</h3>
            </div>
            <div className="space-y-3">
              {delayedGoals.map((goal, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    goal.severity === "high"
                      ? "border-rose-500/15 bg-rose-500/5"
                      : "border-amber-500/15 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-white/85">{goal.title}</p>
                      <p className="text-[11px] text-white/30">{goal.owner}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase ${
                        goal.severity === "high"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {goal.severity}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center text-[11px]">
                    <div>
                      <p className="text-white/25">Progress</p>
                      <p className="font-semibold text-white/70">{goal.progress}%</p>
                    </div>
                    <div>
                      <p className="text-white/25">Days Left</p>
                      <p className="font-semibold text-white/70">{goal.days_remaining}</p>
                    </div>
                    <div>
                      <p className="text-white/25">Rate Needed</p>
                      <p className="font-semibold text-rose-400">{goal.daily_needed}%/day</p>
                    </div>
                  </div>
                </div>
              ))}

              {delayedGoals.length === 0 && (
                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-6 text-center">
                  <Shield className="mx-auto h-8 w-8 text-emerald-400/40" />
                  <p className="mt-2 text-[13px] text-emerald-400/60">No delayed goals detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
