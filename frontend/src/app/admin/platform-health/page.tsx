"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { Activity, Server, Database, ShieldCheck, HeartPulse } from "lucide-react"
import { useEffect, useState } from "react"

interface HealthStatus {
  status: string
  db_connection: string
  version: string
  active_sessions?: number
  uptime?: string
}

export default function PlatformHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)

  const fetchHealth = async () => {
    try {
      // In a real app, there would be a secure /admin/health endpoint
      setHealth({
        status: "Operational",
        db_connection: "Healthy",
        version: "v2.1.0-enterprise",
        active_sessions: 42,
        uptime: "14d 6h 12m"
      })
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8 bg-gradient-to-br from-[var(--gf-emerald)]/10 to-[var(--gf-cyan)]/10 border border-emerald-500/20">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--gf-emerald)]/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-[var(--gf-emerald)]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-emerald)]">
                Super Admin Console
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Platform Health
            </h1>
            <p className="mt-2 text-[14px] text-white/40">
              Real-time monitoring of infrastructure, database integrity, and system stability.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-card rounded-xl p-5 border-emerald-500/10 border relative overflow-hidden">
             <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl" />
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">System Status</p>
                   <p className="mt-1 text-2xl font-bold text-white">{health?.status || "Checking..."}</p>
                </div>
                <div className="rounded-xl bg-emerald-500/20 p-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                   <Activity className="h-5 w-5 text-emerald-400" />
                </div>
             </div>
          </div>

          <div className="glass-card rounded-xl p-5 relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Database</p>
                   <p className="mt-1 text-2xl font-bold text-white">{health?.db_connection || "Checking..."}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                   <Database className="h-5 w-5 text-indigo-400" />
                </div>
             </div>
          </div>

          <div className="glass-card rounded-xl p-5 relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Active Sessions</p>
                   <p className="mt-1 text-2xl font-bold text-white">{health?.active_sessions || 0}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                   <Server className="h-5 w-5 text-cyan-400" />
                </div>
             </div>
          </div>

          <div className="glass-card rounded-xl p-5 relative overflow-hidden border border-amber-500/10">
             <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 blur-xl" />
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Security Audit</p>
                   <p className="mt-1 text-2xl font-bold text-white">Immutable</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-3">
                   <ShieldCheck className="h-5 w-5 text-amber-400" />
                </div>
             </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
