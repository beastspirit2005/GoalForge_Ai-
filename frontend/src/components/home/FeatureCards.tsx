"use client"

import { Brain, ShieldAlert, Activity, Trophy, Lock, Zap } from "lucide-react"

export default function FeatureCards() {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4f46e5] dark:text-[#a78bfa]">
          Platform Capabilities
        </p>
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          State-of-the-Art Workforce Planning Toolkit
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-stretch">
        
        {/* Feature 1 */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.01] p-4 flex flex-col justify-between hover:border-indigo-500/30 hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
          <span className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
            <Brain className="h-4.5 w-4.5" />
          </span>
          <div className="mt-4">
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">AI Milestone Generation</h4>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed mt-1.5">Convert vague goals into weekly milestones.</p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.01] p-4 flex flex-col justify-between hover:border-emerald-500/30 hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
          <span className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-450 flex items-center justify-center shadow-sm">
            <ShieldAlert className="h-4.5 w-4.5" />
          </span>
          <div className="mt-4">
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Smart Risk Detection</h4>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed mt-1.5">Detect burnout and delays before they impact results.</p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.01] p-4 flex flex-col justify-between hover:border-blue-500/30 hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
          <span className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
            <Activity className="h-4.5 w-4.5" />
          </span>
          <div className="mt-4">
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Performance Intelligence</h4>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed mt-1.5">Track progress with AI-powered insights and predictions.</p>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.01] p-4 flex flex-col justify-between hover:border-violet-500/30 hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
          <span className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-sm">
            <Trophy className="h-4.5 w-4.5" />
          </span>
          <div className="mt-4">
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Employee Recognition</h4>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed mt-1.5">Celebrate achievements and drive team motivation.</p>
          </div>
        </div>

        {/* Feature 5 */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.01] p-4 flex flex-col justify-between hover:border-cyan-500/30 hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
          <span className="h-9 w-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-sm">
            <Lock className="h-4.5 w-4.5" />
          </span>
          <div className="mt-4">
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Enterprise Security</h4>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed mt-1.5">Bank-grade security with audit trails and role control.</p>
          </div>
        </div>

        {/* Feature 6 */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-white/[0.01] p-4 flex flex-col justify-between hover:border-amber-500/30 hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
          <span className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 text-amber-600 dark:text-amber-450 flex items-center justify-center shadow-sm">
            <Zap className="h-4.5 w-4.5" />
          </span>
          <div className="mt-4">
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Hybrid AI Engine</h4>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed mt-1.5">Cloud power. Local privacy. Fallback reliability.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
