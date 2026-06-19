"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <div className="lg:col-span-5 flex flex-col md:flex-row lg:flex-row items-center justify-between gap-4 relative py-2">
      
      {/* SVG Face Mesh floating behind left side text */}
      <div className="absolute left-[-20px] top-[10px] w-[350px] h-[350px] pointer-events-none select-none opacity-40 dark:opacity-75 z-0">
        <svg viewBox="0 0 300 300" className="w-full h-full text-indigo-500/20 dark:text-indigo-400/15" fill="none">
          {/* hand-drawn profile/neural mesh paths */}
          <path
            d="M 60,30 C 90,20 120,10 140,25 C 160,40 160,80 180,95 C 200,110 220,120 230,140 C 240,160 210,180 200,195 C 190,210 180,240 150,260 C 120,280 80,270 60,250 C 40,230 45,190 35,170 C 25,150 10,130 15,100 C 20,70 30,40 60,30 Z"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path
            d="M 60,30 L 140,25 M 140,25 L 180,95 M 180,95 L 230,140 M 230,140 L 200,195 M 200,195 L 150,260 M 150,260 L 60,250 M 60,250 L 35,170 M 35,170 L 15,100 M 15,100 L 60,30"
            stroke="currentColor"
            strokeWidth="0.5"
            className="opacity-50"
          />
          {/* Crisscross internal connections */}
          <path
            d="M 60,30 L 180,95 M 140,25 L 200,195 M 180,95 L 150,260 M 230,140 L 60,250 M 200,195 L 35,170 M 150,260 L 15,100 M 60,250 L 140,25 M 35,170 L 180,95 M 15,100 L 200,195"
            stroke="currentColor"
            strokeWidth="0.5"
            className="opacity-40"
          />
          <path
            d="M 80,70 L 120,120 M 120,120 L 160,180 M 160,180 L 120,220 M 120,220 L 70,150 M 70,150 L 80,70 M 80,70 L 160,180 M 120,120 L 120,220"
            stroke="currentColor"
            strokeWidth="0.75"
            className="opacity-60"
          />
          
          {/* Glowing Nodes (pulsing) */}
          <circle cx="60" cy="30" r="3" fill="#a78bfa" className="animate-pulse" />
          <circle cx="140" cy="25" r="3" fill="#818cf8" />
          <circle cx="180" cy="95" r="4" fill="#3b82f6" className="animate-pulse" />
          <circle cx="230" cy="140" r="3" fill="#06b6d4" />
          <circle cx="200" cy="195" r="4" fill="#10b981" className="animate-pulse" />
          <circle cx="150" cy="260" r="3" fill="#f59e0b" />
          <circle cx="60" cy="250" r="3" fill="#ec4899" />
          <circle cx="35" cy="170" r="4" fill="#a78bfa" className="animate-pulse" />
          <circle cx="15" cy="100" r="3" fill="#818cf8" />
          <circle cx="120" cy="120" r="4.5" fill="#c084fc" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="120" cy="120" r="2.5" fill="#a78bfa" />
          <circle cx="160" cy="180" r="2.5" fill="#60a5fa" />
        </svg>
      </div>

      {/* Left Texts & CTAs */}
      <div className="flex-1 space-y-6 z-10 pr-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 px-3.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-[#a78bfa] tracking-wider uppercase shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-violet-400" />
          Workforce Intelligence Platform
        </div>
        
        <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight text-[#0f172a] dark:text-white">
          BUILD. <br />
          <span className="bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent drop-shadow-sm">PREDICT.</span> <br />
          <span className="bg-gradient-to-r from-[#3b82f6] via-[#06b6d4] to-[#10b981] bg-clip-text text-transparent drop-shadow-sm">EXECUTE.</span>
        </h1>

        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-200 tracking-tight leading-snug">
          AI-Powered Workforce Intelligence <br />
          for Modern Organizations
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-semibold max-w-sm">
          GoalForge AI combines predictive analytics, AI milestone generation, burnout detection, and hybrid local/cloud intelligence into a single performance ecosystem.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            asChild
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#4f46e5] hover:from-[#1d4ed8] hover:to-[#4338ca] text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 border-none"
          >
            <Link href="/employee/dashboard" className="flex items-center gap-2">
              Launch Employee Demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            asChild
            className="h-10 px-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-slate-350 font-bold text-xs transition-all"
          >
            <Link href="/manager/dashboard">Manager Console</Link>
          </Button>
        </div>
      </div>

      {/* Connected Circles Stack */}
      <div className="flex flex-col gap-6 relative pl-8 pr-2 py-4 select-none shrink-0 w-full sm:w-auto md:w-auto lg:w-auto">
        
        {/* Backing Wavy SVG Connector Line */}
        <div className="absolute left-[34px] top-0 bottom-0 w-8 pointer-events-none z-0">
          <svg viewBox="0 0 32 400" className="w-full h-full text-indigo-500/25 dark:text-indigo-400/20" fill="none" preserveAspectRatio="none">
            <path
              d="M 16 0 Q 32 100 16 200 T 16 400"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
            />
            {/* Glowing crawling dash path */}
            <path
              d="M 16 0 Q 32 100 16 200 T 16 400"
              stroke="url(#rings-line-glow)"
              strokeWidth="3.5"
              className="opacity-70"
            />
            <defs>
              <linearGradient id="rings-line-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="30%" stopColor="#60a5fa" />
                <stop offset="65%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Ring 1: 87% Completion */}
        <div className="flex items-center gap-3 relative z-10 group cursor-pointer">
          <div className="h-14 w-14 rounded-full bg-white dark:bg-[#0c0e18]/90 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shadow-lg relative transition-all duration-300 group-hover:scale-105 group-hover:border-purple-400/50">
            <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="87 100" strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-white z-10">87%</span>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-none">87%</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Completion</p>
          </div>
        </div>

        {/* Ring 2: 41 Milestones */}
        <div className="flex items-center gap-3 relative z-10 group cursor-pointer">
          <div className="h-14 w-14 rounded-full bg-white dark:bg-[#0c0e18]/90 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shadow-lg relative transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400/50">
            <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="100 100" strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-white z-10">41</span>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-none">41</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Milestones</p>
          </div>
        </div>

        {/* Ring 3: Low Burnout */}
        <div className="flex items-center gap-3 relative z-10 group cursor-pointer">
          <div className="h-14 w-14 rounded-full bg-white dark:bg-[#0c0e18]/90 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shadow-lg relative transition-all duration-300 group-hover:scale-105 group-hover:border-[#10b981]/50">
            <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#10b981" strokeWidth="2.5" strokeDasharray="100 100" strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <span className="text-[9px] font-extrabold text-slate-800 dark:text-white z-10 uppercase tracking-tighter">Low</span>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-none">Low</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Burnout Risk</p>
          </div>
        </div>

        {/* Ring 4: 5 Alerts */}
        <div className="flex items-center gap-3 relative z-10 group cursor-pointer">
          <div className="h-14 w-14 rounded-full bg-white dark:bg-[#0c0e18]/90 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shadow-lg relative transition-all duration-300 group-hover:scale-105 group-hover:border-amber-400/50">
            <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="25 100" strokeDashoffset="0" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-white z-10">5</span>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-none">5</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Risk Alerts</p>
          </div>
        </div>

      </div>

    </div>
  )
}
