"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Activity,
  Users,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Scale,
  ArrowRight,
  Map,
  Sparkles,
} from "lucide-react";
import {
  getWorkloadHeatmap,
  getRebalanceSuggestions,
} from "@/services/enterprise.service";

type HeatmapEntry = {
  user_id: number;
  name: string;
  department: string;
  active_tasks: number;
  active_goals: number;
  total_active: number;
  status: string;
  emoji: string;
  label: string;
};

type Suggestion = {
  task_id: number;
  task_title: string;
  from_user_name: string;
  from_workload: number;
  to_user_name: string;
  to_workload: number;
  reason: string;
};

export default function WorkloadHeatmapPage() {
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, overloaded: 0, moderate: 0, available: 0 });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"heatmap" | "rebalance">("heatmap");

  useEffect(() => {
    Promise.all([getWorkloadHeatmap(), getRebalanceSuggestions()])
      .then(([heatData, rebalData]) => {
        setHeatmap(heatData.heatmap || []);
        setStats({
          total: heatData.total_employees || 0,
          overloaded: heatData.overloaded || 0,
          moderate: heatData.moderate || 0,
          available: heatData.available || 0,
        });
        setSuggestions(rebalData.suggestions || []);
      })
      .catch(() => {
        /* fallback: show empty state */
      })
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (status: string) => {
    if (status === "overloaded") return "bg-red-500/15 text-red-400 border-red-500/30";
    if (status === "moderate") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  };

  const barWidth = (total: number) => Math.min(100, (total / 8) * 100);

  const barColor = (status: string) => {
    if (status === "overloaded") return "bg-gradient-to-r from-red-500 to-orange-500";
    if (status === "moderate") return "bg-gradient-to-r from-yellow-500 to-amber-400";
    return "bg-gradient-to-r from-emerald-500 to-teal-400";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero */}
        <section className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--gf-cyan)]/8 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-[var(--gf-indigo)]/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--gf-cyan)]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-cyan)]">
                Workload intelligence
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Workload Intelligence
            </h1>
            <p className="mt-2 text-[14px] text-white/40">
              Real-time workload heatmaps and AI-powered rebalancing.
            </p>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="stagger-children grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Team",
              value: stats.total,
              icon: Users,
              iconColor: "text-[var(--gf-cyan)]",
            },
            {
              label: "Overloaded",
              value: stats.overloaded,
              icon: Flame,
              iconColor: "text-[var(--gf-rose)]",
            },
            {
              label: "Moderate",
              value: stats.moderate,
              icon: AlertTriangle,
              iconColor: "text-[var(--gf-amber)]",
            },
            {
              label: "Available",
              value: stats.available,
              icon: CheckCircle2,
              iconColor: "text-[var(--gf-emerald)]",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="metric-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  <span className="text-3xl font-bold text-white/90">{card.value}</span>
                </div>
                <p className="mt-1 text-sm text-white/30">{card.label}</p>
              </div>
            );
          })}
        </section>

        {/* Tabs */}
        <div className="animate-fade-in-up flex gap-1 rounded-lg glass-card p-1 w-fit">
          {(["heatmap", "rebalance"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                tab === t
                  ? "bg-[var(--gf-indigo)] text-white shadow-lg shadow-[var(--gf-indigo)]/25"
                  : "text-white/30 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              {t === "heatmap" ? (
                <>
                  <Map className="h-3.5 w-3.5" /> Heatmap
                </>
              ) : (
                <>
                  <Scale className="h-3.5 w-3.5" /> Rebalance Suggestions
                </>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="glass-card rounded-xl text-center p-12 text-white/30">
            Loading workload data...
          </div>
        ) : tab === "heatmap" ? (
          /* Heatmap Grid */
          <div className="animate-fade-in-up space-y-3">
            {heatmap.length === 0 ? (
              <div className="glass-card rounded-xl text-center p-12">
                <Map className="mx-auto h-8 w-8 text-white/20 mb-3" />
                <p className="text-lg font-medium text-white/90">No team members found</p>
                <p className="text-white/30 mt-1">
                  Workload data will appear here once team members are active.
                </p>
              </div>
            ) : (
              heatmap.map((emp) => (
                <div
                  key={emp.user_id}
                  className="glass-card-hover flex items-center gap-4 rounded-xl p-4 transition-all"
                >
                  {/* Avatar */}
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--gf-cyan)] to-[var(--gf-indigo)] text-xs font-bold text-white">
                    {emp.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate text-white/90">{emp.name}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(emp.status)}`}
                      >
                        {emp.emoji} {emp.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">
                      {emp.department} · {emp.active_tasks} tasks · {emp.active_goals} goals
                    </p>
                  </div>

                  {/* Bar */}
                  <div className="w-32 shrink-0">
                    <div className="h-2 w-full rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(emp.status)}`}
                        style={{ width: `${barWidth(emp.total_active)}%` }}
                      />
                    </div>
                    <p className="text-right text-[10px] text-white/30 mt-1">
                      {emp.total_active} active
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Rebalance Suggestions */
          <div className="animate-fade-in-up space-y-3">
            {suggestions.length === 0 ? (
              <div className="glass-card rounded-xl text-center p-12">
                <Sparkles className="mx-auto h-8 w-8 text-[var(--gf-amber)] mb-3" />
                <p className="text-lg font-medium text-white/90">Workload is balanced</p>
                <p className="text-white/30 mt-1">No rebalancing needed at this time.</p>
              </div>
            ) : (
              suggestions.map((s, idx) => (
                <div
                  key={idx}
                  className="glass-card-hover rounded-xl p-5 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--gf-violet)]/10">
                      <Scale className="h-4 w-4 text-[var(--gf-violet)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white/90">{s.task_title}</p>
                      <p className="text-sm text-white/30 mt-1">{s.reason}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400">
                          From: {s.from_user_name} ({s.from_workload} items)
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-white/30" />
                        <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400">
                          To: {s.to_user_name} ({s.to_workload} items)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
