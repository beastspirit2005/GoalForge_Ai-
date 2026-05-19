"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Plus, Sparkles, TrendingUp, Zap } from "lucide-react"
import GoalProgress from "@/components/dashboard/GoalProgress"
import StatsCard from "@/components/dashboard/StatsCard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { SmartPriorities } from "@/components/dashboard/SmartPriorities"
import { Button } from "@/components/ui/button"
import { demoGoals, stats } from "@/lib/demo-data"
import { useAuth } from "@/hooks/useAuth"

export default function EmployeeDashboardPage() {
  const { user } = useAuth()
  const displayName = user?.name || "Employee"
  const [greeting, setGreeting] = useState("Good morning")
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("Good morning")
    } else if (hour < 17) {
      setGreeting("Good afternoon")
    } else {
      setGreeting("Good evening")
    }

    // Only show onboarding if not dismissed
    const dismissed = localStorage.getItem("gf_onboarding_dismissed")
    if (!dismissed) {
      setShowOnboarding(true)
    }
  }, [])

  const dismissOnboarding = () => {
    localStorage.setItem("gf_onboarding_dismissed", "true")
    setShowOnboarding(false)
  }

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
                {greeting}, {displayName}
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

        {/* Quick-Start Interactive Onboarding Card */}
        {showOnboarding && (
          <section className="glass-card animate-scale-in relative overflow-hidden rounded-2xl p-6 shadow-xl border border-white/[0.08]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--gf-cyan)]/5 blur-2xl" />
            
            <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gf-indigo)] to-[var(--gf-cyan)] text-white shadow-lg shadow-[var(--gf-indigo)]/20">
                  <Zap className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white/95">Welcome to GoalForge AI! — Quick-Start Guide</h2>
                  <p className="text-[12px] text-white/45 mt-0.5">Let&apos;s walk through how your performance scores, check-ins, and AI insights work together.</p>
                </div>
              </div>
              
              <button 
                onClick={dismissOnboarding}
                className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.18] bg-white/[0.02] hover:bg-white/[0.06] text-white/50 hover:text-white/90 transition-all cursor-pointer"
              >
                Dismiss Guide
              </button>
            </div>

            {/* Stepper Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "1. Define Smart Goals",
                  desc: "Type a simple aspiration. The AI Goal Refiner will instantly shape it into a measurable objective.",
                  badge: "Refiner AI",
                },
                {
                  title: "2. Build Milestones",
                  desc: "Split your goals into actionable weekly checkbox tasks to build systematic progress.",
                  badge: "Actionable Steps",
                },
                {
                  title: "3. Weekly Check-Ins",
                  desc: "Log your progress and get manager reviews to drive your dashboard momentum.",
                  badge: "Consistency",
                },
                {
                  title: "4. AI Insights & Scores",
                  desc: "Unlock risk predictions, coaching feedback, and automatic calculated performance scores.",
                  badge: "Analytics AI",
                }
              ].map((step, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                    activeStep === idx 
                      ? "border-[var(--gf-indigo)] bg-[var(--gf-indigo)]/5 shadow-lg shadow-[var(--gf-indigo)]/5"
                      : "border-white/[0.05] bg-white/[0.01] hover:border-white/[0.12] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      activeStep === idx 
                        ? "bg-[var(--gf-indigo)]/25 text-indigo-200" 
                        : "bg-white/[0.05] text-white/35"
                    }`}>
                      {step.badge}
                    </span>
                    {activeStep === idx && (
                      <div className="h-2 w-2 rounded-full bg-[var(--gf-cyan)] animate-pulse" />
                    )}
                  </div>
                  
                  <h3 className={`mt-3 text-[13px] font-bold transition-colors ${
                    activeStep === idx ? "text-white" : "text-white/70"
                  }`}>
                    {step.title}
                  </h3>
                  
                  <p className={`mt-1.5 text-[11px] leading-relaxed transition-colors ${
                    activeStep === idx ? "text-white/60" : "text-white/30"
                  }`}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Stepper Detail Tooltip Bar */}
            <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 text-[12px] text-white/60 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-[var(--gf-cyan)] animate-pulse" />
                <span>
                  {activeStep === 0 && "💡 AI Pro-Tip: When creating a goal, tap the Refinement AI button to auto-inject professional metrics and success bounds!"}
                  {activeStep === 1 && "💡 AI Pro-Tip: The AI forecast engine requires at least 3 milestones per goal to calculate dynamic risk scores correctly."}
                  {activeStep === 2 && "💡 AI Pro-Tip: Keeping check-ins frequent raises consistency scores; skipping weeks triggers high-risk alerts."}
                  {activeStep === 3 && "💡 AI Pro-Tip: Quarterly performance metrics evaluate overall goal completion rate, velocity, and consistency."}
                </span>
              </div>
              
              <Link 
                href={activeStep === 0 || activeStep === 1 ? "/employee/goals/create" : activeStep === 2 ? "/employee/checkins" : "/employee/ai-insights"}
                className="flex items-center gap-1 font-semibold text-[var(--gf-cyan)] hover:text-white transition-colors"
              >
                {activeStep === 0 || activeStep === 1 ? "Start Now" : activeStep === 2 ? "Go to Check-Ins" : "View Insights"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        )}

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
                
                {/* Dynamically show option to restore onboarding guide if dismissed */}
                {!showOnboarding && (
                  <button
                    onClick={() => {
                      localStorage.removeItem("gf_onboarding_dismissed")
                      setShowOnboarding(true)
                    }}
                    className="w-full text-left group flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[13px] font-medium text-white/50 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/80 cursor-pointer"
                  >
                    <span>Show Quick-Start Guide</span>
                    <Sparkles className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:opacity-100 text-[var(--gf-cyan)]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
