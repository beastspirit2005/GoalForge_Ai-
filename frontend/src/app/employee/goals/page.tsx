"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AdvancedGoalTable from "@/components/goals/AdvancedGoalTable"
import { Button } from "@/components/ui/button"
import { demoGoals, type Goal } from "@/lib/demo-data"
import { getLocalDemoGoals } from "@/lib/local-demo-goals"
import Link from "next/link"

import { Target, TrendingUp, AlertCircle, Bot } from "lucide-react"

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    const handleUpdate = () => {
      setGoals([...getLocalDemoGoals(), ...demoGoals])
    }
    
    handleUpdate()
    window.addEventListener("local-goals-updated", handleUpdate)
    return () => window.removeEventListener("local-goals-updated", handleUpdate)
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              My goals
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track personal goals, risk, milestones, and AI guidance.
            </p>
          </div>
          <Button asChild className="h-10 text-sm">
            <Link href="/employee/goals/create">Create goal</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#120f1c] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 p-2.5">
                <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Goals</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{goals.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#120f1c] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">On Track</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{goals.filter(g => g.status === 'On Track').length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#120f1c] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-rose-50 dark:bg-rose-500/10 p-2.5">
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">At Risk</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{goals.filter(g => g.risk === 'High' || g.status === 'At Risk').length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#120f1c] p-5 shadow-sm bg-gradient-to-br from-indigo-50/50 to-cyan-50/50 dark:from-indigo-900/10 dark:to-cyan-900/10">
            <div className="flex gap-3">
              <div className="shrink-0 mt-1">
                <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">AI Copilot Briefing</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Focus on closing out your remaining high-priority milestones to ensure the Q2 OKRs are completed successfully. 
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <AdvancedGoalTable goals={goals} />
        </div>
      </div>
    </DashboardLayout>
  )
}
