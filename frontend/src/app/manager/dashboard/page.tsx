"use client"

import { Users, Sparkles, TrendingUp, Shield } from "lucide-react"
import ApprovalTable from "@/components/approvals/ApprovalTable"
import CompletionChart from "@/components/analytics/CompletionChart"
import GoalTable from "@/components/goals/GoalTable"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { demoGoals } from "@/lib/demo-data"

export default function ManagerDashboardPage() {
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
            <GoalTable goals={demoGoals} />
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
      </div>
    </DashboardLayout>
  )
}
