"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import RequireRole from "@/components/auth/RequireRole"
import { Activity, Server, Database, ShieldCheck, HeartPulse, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

interface HealthStatus {
  status: string
  db_connection: string
  version: string
  active_sessions?: number
  uptime?: string
  cpu_percent?: number
  memory_percent?: number
}

export default function PlatformHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)

  const fetchHealth = async () => {
    try {
      const data = await apiFetch<HealthStatus>("/admin/health")
      setHealth(data)
    } catch (err) {
      console.error(err)
      setHealth({
        status: "Error",
        db_connection: "Unknown",
        version: "v2.1.0-enterprise",
        active_sessions: 0,
        uptime: "0s",
        cpu_percent: 0,
        memory_percent: 0
      })
    }
  }

  useEffect(() => {
    fetchHealth()
    // Optional: Refresh health every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <RequireRole roles={["super_admin"]}>
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
               <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1">System Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${health?.status === 'Operational' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'}`} />
                      <p className="text-xl font-bold text-white">{health?.status || "Loading..."}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-emerald-400"><Activity className="h-5 w-5" /></div>
               </div>
            </div>

            <div className="glass-card rounded-xl p-5 border-slate-700 border relative overflow-hidden">
               <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Database</p>
                    <p className="text-xl font-bold text-white">{health?.db_connection || "Loading..."}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-slate-300"><Database className="h-5 w-5" /></div>
               </div>
            </div>

            <div className="glass-card rounded-xl p-5 border-slate-700 border relative overflow-hidden">
               <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Uptime</p>
                    <p className="text-xl font-bold text-white">{health?.uptime || "Loading..."}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-slate-300"><Server className="h-5 w-5" /></div>
               </div>
            </div>

            <div className="glass-card rounded-xl p-5 border-slate-700 border relative overflow-hidden">
               <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1">CPU Load</p>
                    <p className="text-xl font-bold text-white">{health?.cpu_percent !== undefined ? `${health.cpu_percent}%` : "Loading..."}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-slate-300"><ShieldCheck className="h-5 w-5" /></div>
               </div>
            </div>
            
            <div className="glass-card rounded-xl p-5 border-slate-700 border relative overflow-hidden">
               <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Memory Usage</p>
                    <p className="text-xl font-bold text-white">{health?.memory_percent !== undefined ? `${health.memory_percent}%` : "Loading..."}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-slate-300"><Server className="h-5 w-5" /></div>
               </div>
            </div>
            
            <div className="glass-card rounded-xl p-5 border-slate-700 border relative overflow-hidden">
               <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Sessions</p>
                    <p className="text-xl font-bold text-white">{health?.active_sessions !== undefined ? health.active_sessions : "Loading..."}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg text-slate-300"><Users className="h-5 w-5" /></div>
               </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RequireRole>
  )
}
