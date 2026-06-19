"use client"

import { ChevronDown, Sparkle, Bot, Cpu, Shield } from "lucide-react"

export default function HybridEngineFlow() {
  return (
    <div className="rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] p-6 text-center shadow-lg relative overflow-hidden group">
      
      {/* Animated light line backing the flow */}
      <div className="absolute top-[50%] left-10 right-10 h-0.5 pointer-events-none z-0 hidden md:block">
        <svg className="w-full h-full text-indigo-500/15 dark:text-indigo-400/10" fill="none">
          <line x1="0" y1="0" x2="100%" y2="0" stroke="currentColor" strokeWidth="2.5" strokeDasharray="8 8" />
          <line x1="0" y1="0" x2="100%" y2="0" stroke="#a855f7" strokeWidth="3" strokeDasharray="8 8" className="animate-shimmer opacity-60" style={{ animationDuration: '4s' }} />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-stretch justify-around gap-6">
        
        {/* Step 1: Gemini Cloud */}
        <div className="flex-1 bg-white/80 dark:bg-[#0c0e18]/80 border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 flex items-center gap-3 text-left shadow-md hover:border-purple-500/30 hover:scale-[1.01] transition-all duration-300">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-inner">
            <Sparkle className="h-5 w-5 fill-purple-500/10" />
          </span>
          <div>
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Gemini Cloud</h4>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Advanced reasoning &amp; deep insights</p>
          </div>
        </div>

        {/* Connecting chevron (visible on small/medium) */}
        <div className="flex md:hidden items-center justify-center text-slate-300 dark:text-slate-700">
          <ChevronDown className="h-5 w-5" />
        </div>

        {/* Step 2: AI Buddy */}
        <div className="flex-1 bg-white/80 dark:bg-[#0c0e18]/80 border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 flex items-center gap-3 text-left shadow-md hover:border-indigo-500/30 hover:scale-[1.01] transition-all duration-300">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
            <Bot className="h-5 w-5 fill-indigo-500/10" />
          </span>
          <div>
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">AI Buddy</h4>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Intelligent orchestration &amp; response generation</p>
          </div>
        </div>

        {/* Connecting chevron */}
        <div className="flex md:hidden items-center justify-center text-slate-300 dark:text-slate-700">
          <ChevronDown className="h-5 w-5" />
        </div>

        {/* Step 3: Ollama Local */}
        <div className="flex-1 bg-white/80 dark:bg-[#0c0e18]/80 border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 flex items-center gap-3 text-left shadow-md hover:border-emerald-500/30 hover:scale-[1.01] transition-all duration-300">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
            <Cpu className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Ollama Local</h4>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Private. Fast. On your machine.</p>
          </div>
        </div>

        {/* Connecting chevron */}
        <div className="flex md:hidden items-center justify-center text-slate-300 dark:text-slate-700">
          <ChevronDown className="h-5 w-5" />
        </div>

        {/* Step 4: Fallback Engine */}
        <div className="flex-1 bg-white/80 dark:bg-[#0c0e18]/80 border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 flex items-center gap-3 text-left shadow-md hover:border-amber-500/30 hover:scale-[1.01] transition-all duration-300">
          <span className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <Shield className="h-5 w-5 fill-amber-500/10" />
          </span>
          <div>
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Fallback Engine</h4>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Always available. Always reliable.</p>
          </div>
        </div>

      </div>

      <p className="mt-5 text-[10.5px] font-extrabold text-[#4f46e5] dark:text-[#a78bfa] tracking-wider uppercase">
        Always-on intelligence. Your data, your control.
      </p>
    </div>
  )
}
