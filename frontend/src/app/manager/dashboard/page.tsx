"use client"

import { useEffect, useState } from "react"
import { Users, Sparkles, TrendingUp, Shield } from "lucide-react"
import ApprovalTable from "@/components/approvals/ApprovalTable"
import CompletionChart from "@/components/analytics/CompletionChart"
import GoalTable from "@/components/goals/GoalTable"
import AdvancedGoalTable from "@/components/goals/AdvancedGoalTable"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { demoGoals, type Goal } from "@/lib/demo-data"
import { getLocalDemoGoals } from "@/lib/local-demo-goals"

export default function ManagerDashboardPage() {
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
        <div className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--gf-cyan)]/8 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--gf-cyan)]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-cyan)]">
                Manager console
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Team overview
            </h1>
            <p className="mt-2 text-[14px] text-white/40">
              Review team progress, unblock risky goals, and approve changes.
            </p>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="glass-card rounded-xl p-5">
            <h2 className="mb-4 text-base font-semibold text-white/80">Team goals</h2>
            <GoalTable goals={goals} />
          </div>

          <div className="glass-card rounded-xl p-5">
            <h2 className="mb-4 text-base font-semibold text-white/80">Department progress</h2>
            <CompletionChart />
          </div>
        </section>

        <div className="glass-card rounded-xl p-5">
          <h2 className="mb-4 text-base font-semibold text-white/80">Approval queue</h2>
          <ApprovalTable />
        </div>

        <div className="glass-card rounded-xl p-5 mt-6">
          <div className="flex items-center gap-2 mb-4 text-base font-semibold text-white/80">
            <Shield className="h-5 w-5 text-sky-400" />
            <h2>Goal Governance & Escalations</h2>
          </div>
          <p className="text-sm text-white/50 mb-6">
            Track goals you've approved, rejected, or edited, along with employee escalations and admin resolutions.
          </p>
          <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-white/[0.04]">
            <AdvancedGoalTable 
              goals={goals.filter(g => g.status === "Approved" || g.status === "Rejected" || g.status === "Approved after Editing" || g.status === "Escalated" || g.status === "Needs Review" || g.status === "At Risk")} 
              isManagerView={true} 
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
