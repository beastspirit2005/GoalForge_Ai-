"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Brain,
  HelpCircle,
} from "lucide-react";

export default function SimulatorPage() {
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [aiProvider, setAiProvider] = useState<"gemini" | "ollama">("gemini");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [ollamaModels, setOllamaModels] = useState<string[]>(["llama3", "gemma2:2b"]);

  useEffect(() => {
    if (aiProvider === "ollama") {
      fetch("http://localhost:11434/api/tags")
        .then(res => res.json())
        .then(data => {
          if (data.models && data.models.length > 0) {
            const models = data.models.map((m: any) => m.name);
            setOllamaModels(models);
            if (!models.includes(aiModel)) setAiModel(models[0]);
          }
        })
        .catch(() => console.warn("Could not fetch Ollama models"));
    }
  }, [aiProvider, aiModel]);

  const runSimulation = () => {
    setLoading(true);
    setSimulationResult(null);
    setTimeout(() => {
      setSimulationResult(
        `Simulation powered by ${
          aiProvider === "ollama" ? aiModel : "Gemini"
        }. Based on current team capacity, historical performance, and skill profiles, there is a 78% probability of completing the Q3 OKRs on time. A capacity bottleneck has been detected in UI Design due to missing required skill profiles.`
      );
      setLoading(false);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Premium Hero ── */}
        <section className="premium-panel relative overflow-hidden rounded-2xl p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[var(--gf-indigo)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--gf-cyan)]/8 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[var(--gf-cyan)]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-cyan)]">
                Resource Planning
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Capacity Simulator
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/40">
              Simulate workload distribution, predict project delivery probability, and identify department bottlenecks.
            </p>
          </div>
        </section>

        {/* ── Main Simulator Content ── */}
        <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up">
          {/* Settings Card */}
          <div className="glass-card rounded-xl p-6 lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--gf-cyan)]" />
              <h2 className="text-lg font-semibold text-white/90">Prediction Settings</h2>
            </div>
            <p className="text-sm text-white/30">
              Select your preferred predictive AI engine and model, then trigger the simulator to run Monte Carlo forecasts over current target dates.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* AI Engine Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                  AI Engine
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["gemini", "ollama"] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setAiProvider(prov)}
                      className={`rounded-xl border py-2.5 text-sm font-semibold capitalize transition-all ${
                        aiProvider === prov
                          ? "border-[var(--gf-indigo)] bg-[var(--gf-indigo)]/10 text-[var(--gf-indigo)] dark:text-indigo-300 shadow-md shadow-[var(--gf-indigo)]/5"
                          : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                      }`}
                    >
                      {prov === "gemini" ? "Google Gemini" : "Local Ollama"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  {aiProvider === "gemini" ? "Gemini Model" : "Ollama Model"}
                </label>
                {aiProvider === "gemini" ? (
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="w-full h-[42px] border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-slate-800 dark:text-white/80 rounded-xl">
                      <SelectValue placeholder="Select Gemini model" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0c0915] text-slate-800 dark:text-white/80">
                      <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                      <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro">gemini-1.5-pro</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="w-full h-[42px] border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-slate-800 dark:text-white/80 rounded-xl">
                      <SelectValue placeholder="Select local model" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0c0915] text-slate-800 dark:text-white/80">
                      {ollamaModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                      {ollamaModels.length === 0 && (
                        <SelectItem value="none" disabled>
                          No local models found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/30">
                <Brain className="h-4 w-4 text-[var(--gf-cyan)]" />
                <span>Uses current user skill matrix & timeline constraints.</span>
              </div>
              <button
                onClick={runSimulation}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-cyan)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--gf-indigo)]/25 transition-all hover:shadow-[var(--gf-indigo)]/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Running Monte Carlo..." : "Run Simulator"}
              </button>
            </div>
          </div>

          {/* Quick Context Panel */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--gf-cyan)]" />
              <h3 className="text-md font-semibold text-white/90">System Health</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                <span className="text-white/30">Total Active Targets</span>
                <span className="font-semibold text-white/80">14 Targets</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                <span className="text-white/30">Department Coverage</span>
                <span className="font-semibold text-white/80">92%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                <span className="text-white/30">Skill Gap Matches</span>
                <span className="font-semibold text-[var(--gf-emerald)]">Optimal</span>
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 text-xs text-white/30 leading-relaxed flex gap-2">
              <HelpCircle className="h-4 w-4 shrink-0 text-white/40 mt-0.5" />
              <span>
                Predictions use historical target success rates, skill gaps from uploaded resumes, and current task velocity metrics.
              </span>
            </div>
          </div>
        </div>

        {/* ── Results Section ── */}
        {simulationResult && (
          <div className="glass-card-hover rounded-xl p-6 border-l-4 border-[var(--gf-indigo)] animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[var(--gf-indigo)]/10 p-3 border border-[var(--gf-indigo)]/20 text-[var(--gf-indigo)]">
                <CheckCircle2 className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-white/90">Simulation Success</h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {simulationResult}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs bg-white/[0.06] text-white/50 px-2.5 py-1 rounded-full border border-white/[0.08] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[var(--gf-cyan)]" />
                    Confidence: High
                  </span>
                  <span className="text-xs bg-white/[0.06] text-white/50 px-2.5 py-1 rounded-full border border-white/[0.08] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[var(--gf-indigo)]" />
                    Iterations: 1,000 runs
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
