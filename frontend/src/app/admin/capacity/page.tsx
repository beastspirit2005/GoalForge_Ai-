"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  PieChart,
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  getCapacityForecast,
  getSuccessionRisk,
} from "@/services/enterprise.service";

type CapacityData = {
  employee_count: number;
  capacity_tasks: number;
  demand_tasks: number;
  gap_percentage: number;
  status: string;
  recommendation: string;
};

type KnowledgeRisk = {
  skill_name: string;
  primary_owner_name: string;
  usage_percentage: number;
  risk_level: string;
  total_tasks_with_skill: number;
  backup_candidates: { name: string; proficiency: number }[];
};

export default function CapacityPlanningPage() {
  const [capacity, setCapacity] = useState<CapacityData | null>(null);
  const [risks, setRisks] = useState<KnowledgeRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCapacityForecast(), getSuccessionRisk()])
      .then(([capData, riskData]) => {
        setCapacity(capData);
        setRisks(riskData.risks || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gaugePercent = (capacity: CapacityData) => {
    if (capacity.capacity_tasks === 0) return 0;
    return Math.min(100, Math.round((capacity.demand_tasks / capacity.capacity_tasks) * 100));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Hero ── */}
        <section className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[var(--gf-indigo)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--gf-cyan)]/8 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[var(--gf-cyan)]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-cyan)]">
                Capacity planning
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Capacity Planning
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/40">
              Demand vs capacity forecasting and succession risk detection.
            </p>
          </div>
        </section>

        {/* ── Body ── */}
        {loading ? (
          <div className="glass-card rounded-xl p-12 text-center text-white/30 animate-fade-in-up">
            Loading capacity data…
          </div>
        ) : (
          <>
            {capacity && (
              <div className="stagger-children grid gap-6 md:grid-cols-2 animate-fade-in-up">
                {/* ── Demand vs Capacity gauge ── */}
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white/90 mb-4">Demand vs Capacity</h2>

                  <div className="flex items-center gap-6">
                    {/* Circular Gauge */}
                    <div className="relative h-32 w-32 shrink-0">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="currentColor" strokeWidth="8"
                          className="text-white/[0.06]"
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none" strokeWidth="8"
                          strokeDasharray={`${gaugePercent(capacity) * 2.51} 251`}
                          strokeLinecap="round"
                          className={
                            capacity.status === "balanced"
                              ? "text-emerald-500"
                              : capacity.status === "understaffed"
                              ? "text-red-500"
                              : "text-yellow-500"
                          }
                          stroke="currentColor"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {gaugePercent(capacity)}%
                        </span>
                        <span className="text-[10px] text-white/30">Utilization</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-white/30">Team Size</span>
                        <span className="font-semibold text-white/90">{capacity.employee_count} employees</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-white/30">Capacity</span>
                        <span className="font-semibold text-white/90">{capacity.capacity_tasks} tasks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-white/30">Demand</span>
                        <span className="font-semibold text-white/90">{capacity.demand_tasks} tasks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-white/30">Gap</span>
                        <span
                          className={`font-bold ${
                            capacity.gap_percentage > 0 ? "text-red-400" : "text-emerald-400"
                          }`}
                        >
                          {capacity.gap_percentage > 0 ? "+" : ""}
                          {capacity.gap_percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div
                    className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
                      capacity.status === "balanced"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : capacity.status === "understaffed"
                        ? "bg-red-500/10 border border-red-500/20 text-red-400"
                        : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {capacity.status === "balanced" ? (
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                    ) : capacity.status === "understaffed" ? (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    )}
                    {capacity.recommendation}
                  </div>
                </div>

                {/* ── Succession Risks ── */}
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white/90 mb-4">Succession Risks</h2>

                  {risks.length === 0 ? (
                    <div className="glass-card rounded-xl p-8 text-center">
                      <ShieldCheck className="mx-auto h-10 w-10 text-emerald-400" />
                      <p className="mt-2 font-medium text-white/90">No Critical Risks</p>
                      <p className="mt-1 text-sm text-white/30">
                        Skill coverage is well-distributed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {risks.slice(0, 5).map((risk, idx) => (
                        <div
                          key={idx}
                          className="glass-card-hover flex items-start gap-3 rounded-lg p-3"
                        >
                          {risk.risk_level === "critical" ? (
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="font-medium capitalize text-white/90">
                              {risk.skill_name}
                            </p>
                            <p className="text-xs text-white/30">
                              {risk.primary_owner_name} handles {risk.usage_percentage}% of{" "}
                              {risk.total_tasks_with_skill} tasks
                            </p>
                            {risk.backup_candidates.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {risk.backup_candidates.map((b, i) => (
                                  <span
                                    key={i}
                                    className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50"
                                  >
                                    {b.name} ({b.proficiency}%)
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                              risk.risk_level === "critical"
                                ? "border-red-500/30 bg-red-500/15 text-red-400"
                                : "border-orange-500/30 bg-orange-500/15 text-orange-400"
                            }`}
                          >
                            {risk.risk_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
