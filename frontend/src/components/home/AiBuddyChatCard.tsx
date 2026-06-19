"use client"

import { useState } from "react"
import { Check, ChevronRight, Server, Cpu, ShieldCheck, Brain } from "lucide-react"

export default function AiBuddyChatCard() {
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  })
  const [enginesStatus, setEnginesStatus] = useState({
    gemini: "Connected",
    ollama: "Connected",
    fallback: "Ready",
  })

  // Handle Action Checkbox toggle
  const toggleAction = (id: number) => {
    setCompletedActions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="lg:col-span-3 flex flex-col">
      <div className="flex-1 rounded-2xl border border-slate-200/70 dark:border-[#1d1f3b] bg-white/95 dark:bg-[#0c0d16]/95 backdrop-blur-xl p-5 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-4 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600" />
        
        {/* Bot Header info */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative h-10 w-10 shrink-0">
              {/* Glowing outer rings */}
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 opacity-60 blur-sm animate-pulse" />
              {/* Cute Roboface Box */}
              <div className="relative h-full w-full rounded-xl bg-slate-950 flex items-center justify-center border border-white/10">
                <svg viewBox="0 0 40 40" className="w-6 h-6 text-cyan-400" fill="none">
                  <rect x="8" y="14" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                  <line x1="12" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="24" y1="21" x2="28" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 16,26 Q 20,29 24,26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="20" cy="9" r="1.5" fill="currentColor" />
                  <line x1="20" y1="10" x2="20" y2="14" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              {/* Online status indicator */}
              <span className="absolute bottom-[-1px] right-[-1px] h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#0c0d16] animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white leading-none">AI Buddy</h3>
              <p className="text-[9px] font-bold text-emerald-500 tracking-wide mt-1 inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
              </p>
            </div>
          </div>
        </div>

        {/* Speech bubble */}
        <div className="relative bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] p-3.5 rounded-2xl text-[10.5px] leading-relaxed text-slate-600 dark:text-slate-300 font-semibold shadow-sm">
          {/* bubble tip shape */}
          <div className="absolute top-[-5px] left-5 w-2.5 h-2.5 bg-slate-50 dark:bg-[#0c0d16] border-t border-l border-slate-100 dark:border-white/[0.04] transform rotate-45" />
          Good morning, Alex! 👋 Here&apos;s your performance snapshot for today.
        </div>

        {/* Recommended Actions */}
        <div className="space-y-2">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Recommended Actions
          </p>
          
          <div className="space-y-1.5">
            {[
              { id: 1, text: "Update Sprint Goal", color: "text-[#10b981] border-[#10b981]/20 bg-[#10b981]/5" },
              { id: 2, text: "Complete Check-In", color: "text-blue-500 border-blue-500/20 bg-blue-500/5" },
              { id: 3, text: "Review Milestone #4", color: "text-purple-500 border-purple-500/20 bg-purple-500/5" },
            ].map((action) => (
              <div
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className="rounded-xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03] p-2.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-all group hover:scale-[1.01]"
              >
                <div className="flex items-center gap-2">
                  {/* Interactive Checkbox */}
                  <div
                    className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all ${
                      completedActions[action.id]
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 dark:border-white/10 hover:border-slate-400"
                    }`}
                  >
                    {completedActions[action.id] && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-[10px] font-bold transition-all ${
                      completedActions[action.id]
                        ? "text-slate-400 line-through decoration-slate-400 dark:text-slate-500"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {action.text}
                  </span>
                </div>
                
                <ChevronRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Hybrid engine status checks */}
        <div className="space-y-2 pt-1">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Hybrid Engine Status
          </p>

          <div className="space-y-1.5 text-[9px] font-bold">
            {/* Status 1 */}
            <div
              onClick={() =>
                setEnginesStatus((prev) => ({
                  ...prev,
                  gemini: prev.gemini === "Connected" ? "Offline" : "Connected",
                }))
              }
              className="flex items-center justify-between border border-slate-100 dark:border-white/[0.02] bg-slate-50/50 dark:bg-white/[0.01] rounded-xl px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors"
            >
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                <Server className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                Gemini Cloud
              </span>
              <span
                className={`inline-flex items-center gap-1 ${
                  enginesStatus.gemini === "Connected" ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    enginesStatus.gemini === "Connected" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                />
                {enginesStatus.gemini}
              </span>
            </div>

            {/* Status 2 */}
            <div
              onClick={() =>
                setEnginesStatus((prev) => ({
                  ...prev,
                  ollama: prev.ollama === "Connected" ? "Offline" : "Connected",
                }))
              }
              className="flex items-center justify-between border border-slate-100 dark:border-white/[0.02] bg-slate-50/50 dark:bg-white/[0.01] rounded-xl px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors"
            >
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                <Cpu className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                Ollama Local
              </span>
              <span
                className={`inline-flex items-center gap-1 ${
                  enginesStatus.ollama === "Connected" ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    enginesStatus.ollama === "Connected" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                />
                {enginesStatus.ollama}
              </span>
            </div>

            {/* Status 3 */}
            <div
              onClick={() =>
                setEnginesStatus((prev) => ({
                  ...prev,
                  fallback: prev.fallback === "Ready" ? "Offline" : "Ready",
                }))
              }
              className="flex items-center justify-between border border-slate-100 dark:border-white/[0.02] bg-slate-50/50 dark:bg-white/[0.01] rounded-xl px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors"
            >
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                Fallback Engine
              </span>
              <span
                className={`inline-flex items-center gap-1 ${
                  enginesStatus.fallback === "Ready" ? "text-cyan-500" : "text-rose-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    enginesStatus.fallback === "Ready" ? "bg-cyan-400 animate-pulse" : "bg-rose-500"
                  }`}
                />
                {enginesStatus.fallback}
              </span>
            </div>
          </div>
        </div>

        {/* AI Insights Feature Display */}
        <div className="w-full rounded-xl border border-dashed border-indigo-500/20 bg-indigo-500/[0.02] p-2.5 text-center">
          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
            <Brain className="h-3.5 w-3.5" />
            AI Insights Feature
          </span>
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-normal mt-1 max-w-[240px] mx-auto">
            Evaluate goal completion probability indexes and burnout indicators dynamically as you log milestones.
          </p>
        </div>

      </div>
    </div>
  )
}
