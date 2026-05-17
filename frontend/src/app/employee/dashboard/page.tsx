"use client"

import Link from "next/link"
import { ArrowRight, Plus, Sparkles, TrendingUp, Zap } from "lucide-react"
import GoalProgress from "@/components/dashboard/GoalProgress"
import StatsCard from "@/components/dashboard/StatsCard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { SmartPriorities } from "@/components/dashboard/SmartPriorities"
import { Button } from "@/components/ui/button"
import { demoGoals, stats } from "@/lib/demo-data"

export default function EmployeeDashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Employee welcome panel */}
        <section className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
          {/* Background orbs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[var(--gf-indigo)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--gf-cyan)]/8 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--gf-cyan)]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-cyan)]">
                  Employee workspace
                </p>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                Good morning, Aarav
              </h1>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/40">
                Your onboarding goal is healthy. The AI coach recommends closing
                one milestone this week to keep momentum above target.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.05] p-4 text-center backdrop-blur-lg">
                <span className="text-[11px] font-medium text-white/35">This week</span>
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-2xl font-bold text-white">+18%</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-400">Momentum ↑</span>
              </div>

              <Button
                asChild
                className="h-11 gap-2 rounded-xl bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-violet)] text-white shadow-lg shadow-[var(--gf-indigo)]/20 hover:shadow-[var(--gf-indigo)]/30 transition-shadow"
              >
                <Link href="/employee/goals/create">
                  <Plus className="h-4 w-4" />
                  New goal
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* KPI metrics row */}
        <section className="stagger-children grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatsCard key={item.label} {...item} />
          ))}
        </section>

        {/* Primary dashboard widgets */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Active goals */}
          <div className="glass-card rounded-xl p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white/90">Active goals</h2>
                <p className="mt-0.5 text-[12px] text-white/30">{demoGoals.length} goals in progress</p>
              </div>
              <Link
                href="/employee/goals"
                className="flex items-center gap-1 text-[12px] font-medium text-[var(--gf-indigo)] hover:text-[var(--gf-cyan)] transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {demoGoals.map((goal) => (
                <GoalProgress key={goal.id} goal={goal} />
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <SmartPriorities />

            {/* Quick nav */}
            <div className="glass-card rounded-xl p-5">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[var(--gf-amber)]" />
                <h3 className="text-sm font-semibold text-white/80">Quick actions</h3>
              </div>
              <div className="space-y-2">
                {[
                  ["Create goal", "/employee/goals/create"],
                  ["Review AI insights", "/employee/ai-insights"],
                  ["My performance", "/employee/performance"],
                  ["Leaderboard", "/employee/leaderboard"],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[13px] font-medium text-white/50 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/80"
                  >
                    {label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
