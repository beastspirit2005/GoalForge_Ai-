"use client"

import { Sparkle, Bot, Cpu, Shield, ShieldCheck } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/65 dark:border-white/10 pt-6 pb-6 space-y-4 font-bold text-[9.5px]">
      
      {/* Powered-by Flow Logos */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-slate-400 dark:text-slate-500">
        <span className="uppercase text-[8.5px] font-extrabold tracking-wider">Powered by</span>
        <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 px-2.5 py-1 rounded-lg">
          <Sparkle className="h-3 w-3 text-purple-500" />
          Google Gemini
        </span>
        <span className="opacity-30">➔</span>
        <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 px-2.5 py-1 rounded-lg">
          <Bot className="h-3 w-3 text-indigo-500" />
          GoalForge AI Buddy
        </span>
        <span className="opacity-30">➔</span>
        <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 px-2.5 py-1 rounded-lg">
          <Cpu className="h-3 w-3 text-emerald-500" />
          Ollama Local
        </span>
        <span className="opacity-30">➔</span>
        <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 px-2.5 py-1 rounded-lg">
          <Shield className="h-3 w-3 text-amber-500" />
          Fallback Engine
        </span>
      </div>

      {/* Bottom copyright details */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-slate-400 dark:text-slate-500">
        
        {/* Secure indicator */}
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-[#34d399] uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" />
          Secure. Reliable. Intelligent.
        </div>

        {/* Developer credit */}
        <div className="text-center text-[11px]">
          Built by <span className="text-[13px] font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Harshit Sharma</span>
        </div>

        {/* Copyright */}
        <div className="uppercase tracking-wider">
          © {new Date().getFullYear()} GoalForge AI. All rights reserved.
        </div>

      </div>

    </footer>
  )
}
