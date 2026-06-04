"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import StatsCard from "@/components/dashboard/StatsCard"
import CompletionChart from "@/components/analytics/CompletionChart"
import { adminMetrics } from "@/lib/demo-data"
import { Shield } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--gf-violet)]/8 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--gf-violet)]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-violet)]">
                Admin console
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Organization overview
            </h1>
            <p className="mt-2 text-[14px] text-white/40">
              Org-wide goals, users, execution health, and governance.
            </p>
          </div>
        </div>

        <section className="stagger-children grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminMetrics.map((metric) => (
            <StatsCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              change=""
              icon={metric.icon}
              tone="sky"
            />
          ))}
        </section>

        <div className="glass-card rounded-xl p-5">
          <h2 className="mb-4 text-base font-semibold text-white/80">Department performance</h2>
          <CompletionChart />
        </div>
      </div>
    </DashboardLayout>
  )
}
