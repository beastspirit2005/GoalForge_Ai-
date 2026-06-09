"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Brain,
  ShieldAlert,
  Sparkles,
  Trophy,
  Activity,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronRight,
  Check,
  Globe,
  Smartphone,
  Server,
  Cpu,
  ShieldCheck,
  Zap,
  Lock,
  Bot,
  Sparkle,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import BrandLogo from "@/components/layout/BrandLogo"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

// Type definition for chart points
interface ChartPoint {
  month: string
  val: number
  x: number
  y: number
  progress: string
}

// Chart data mapping
const chartData: ChartPoint[] = [
  { month: "Apr", val: 20, x: 40, y: 130, progress: "20%" },
  { month: "May", val: 45, x: 100, y: 105, progress: "45%" },
  { month: "Jun", val: 52, x: 160, y: 98, progress: "52%" },
  { month: "Jul", val: 68, x: 220, y: 82, progress: "68%" },
  { month: "Aug", val: 78, x: 280, y: 72, progress: "78%" },
  { month: "Sep", val: 92, x: 340, y: 58, progress: "92%" },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(4) // Default is August
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  })
  const [currentCycle, setCurrentCycle] = useState("Q2 Goal Cycle")
  const [cycleDropdownOpen, setCycleDropdownOpen] = useState(false)
  const [enginesStatus, setEnginesStatus] = useState({
    gemini: "Connected",
    ollama: "Connected",
    fallback: "Ready",
  })

  // Prevent hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading GoalForge AI...</p>
        </div>
      </div>
    )
  }

  // Handle Action Checkbox toggle
  const toggleAction = (id: number) => {
    setCompletedActions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Active point details for the chart
  const hoveredPoint = hoveredChartIndex !== null ? chartData[hoveredChartIndex] : chartData[4]

  return (
    <main className="min-h-screen bg-[#fafafc] dark:bg-[#07080f] text-slate-800 dark:text-slate-100 selection:bg-indigo-500/10 selection:text-indigo-900 transition-colors duration-300 relative overflow-x-hidden">
      
      {/* ── High-Fidelity Background Ambient Lights ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-[-200px] left-[5%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-indigo-500/10 to-violet-500/5 blur-[150px]" />
        <div className="absolute top-[20%] right-[-100px] h-[700px] w-[700px] rounded-full bg-gradient-to-br from-blue-500/8 to-cyan-500/5 blur-[160px]" />
        <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-purple-500/5 to-pink-500/5 blur-[140px]" />
        
        {/* Subtle dark pattern grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col min-h-screen justify-between gap-8">
        
        {/* ── Nav Header ── */}
        <nav className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 pb-4">
          <div className="group">
            <BrandLogo size="md" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              className="h-9 rounded-xl border border-slate-200 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold px-4 transition-all"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs font-bold px-4 transition-all shadow-md shadow-indigo-600/20 active:scale-95 border-none"
            >
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </nav>

        {/* ── Main Dashboard Layout Grid ── */}
        <div className="grid gap-6 lg:grid-cols-12 items-stretch py-2">
          
          {/* ── Left Column: Headline, Description & Connected Rings ── */}
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

          {/* ── Center Column: Execution Overview Card ── */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex-1 rounded-2xl border border-slate-200/70 dark:border-[#1d1f3b] bg-white/95 dark:bg-[#0c0d16]/95 backdrop-blur-xl p-5 shadow-xl shadow-slate-200/20 dark:shadow-none space-y-4 flex flex-col justify-between relative overflow-hidden group">
              {/* Subtle design highlight gradient border */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Execution Overview
                  </p>
                </div>
                
                {/* Custom dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setCycleDropdownOpen(!cycleDropdownOpen)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-350 shadow-sm hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all"
                  >
                    <Calendar className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                    {currentCycle}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                  
                  {cycleDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121324] p-1.5 shadow-xl z-20 text-[10px]">
                      {["Q1 Goal Cycle", "Q2 Goal Cycle", "Q3 Goal Cycle"].map((cycle) => (
                        <button
                          key={cycle}
                          onClick={() => {
                            setCurrentCycle(cycle)
                            setCycleDropdownOpen(false)
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                            currentCycle === cycle
                              ? "bg-indigo-600 text-white"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                          }`}
                        >
                          {cycle}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Row Grid (2x2 Layout) */}
              <div className="grid grid-cols-2 gap-2 text-left">
                
                {/* Stat 1 */}
                <div className="rounded-xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/50 dark:bg-white/[0.01] p-2.5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Goal Completion</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-xl font-black text-slate-800 dark:text-white">78%</p>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-500">
                      <TrendingUp className="h-2.5 w-2.5" />
                      12%
                    </span>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="rounded-xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/50 dark:bg-white/[0.01] p-2.5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">AI Milestones</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-xl font-black text-slate-800 dark:text-white">41</p>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-500">
                      <TrendingUp className="h-2.5 w-2.5" />
                      8
                    </span>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="rounded-xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/50 dark:bg-white/[0.01] p-2.5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Risk Alerts</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-xl font-black text-slate-800 dark:text-white">5</p>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-rose-500">
                      <TrendingUp className="h-2.5 w-2.5" />
                      2
                    </span>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="rounded-xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/50 dark:bg-white/[0.01] p-2.5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Team Engagement</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-xl font-black text-slate-800 dark:text-white">92%</p>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-500">
                      <TrendingUp className="h-2.5 w-2.5" />
                      15%
                    </span>
                  </div>
                </div>

              </div>

              {/* Sub-grid: Chart & Risk Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                
                {/* Interactive SVG Trend Line Chart */}
                <div className="space-y-1 relative">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Goal Completion Trend</p>
                  
                  {/* SVG Chart */}
                  <div className="relative border border-slate-100 dark:border-white/[0.03] bg-slate-50/20 dark:bg-white/[0.01] rounded-xl p-2 h-36">
                    <svg viewBox="0 0 380 160" className="w-full h-full text-slate-300 dark:text-slate-800" fill="none">
                      {/* Grid Lines */}
                      <line x1="40" y1="120" x2="340" y2="120" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="opacity-40" />
                      <line x1="40" y1="90" x2="340" y2="90" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="opacity-40" />
                      <line x1="40" y1="60" x2="340" y2="60" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="opacity-40" />
                      <line x1="40" y1="30" x2="340" y2="30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="opacity-40" />
                      
                      {/* Interactive Guideline */}
                      <line
                        x1={hoveredPoint.x}
                        y1="20"
                        x2={hoveredPoint.x}
                        y2="140"
                        stroke="#a855f7"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        className="transition-all duration-300 opacity-60"
                      />

                      {/* Area Under Curve Gradient */}
                      <path
                        d="M 40,130 C 70,125 70,115 100,105 C 130,100 130,95 160,98 C 190,92 190,88 220,82 C 250,75 250,60 280,72 C 310,65 310,48 340,58 L 340,140 L 40,140 Z"
                        fill="url(#chart-area-grad)"
                      />

                      {/* Trend Line (glowing purple) */}
                      <path
                        d="M 40,130 C 70,125 70,115 100,105 C 130,100 130,95 160,98 C 190,92 190,88 220,82 C 250,75 250,60 280,72 C 310,65 310,48 340,58"
                        stroke="#a855f7"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      />

                      {/* Data point dots */}
                      {chartData.map((pt, idx) => (
                        <circle
                          key={pt.month}
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredChartIndex === idx ? 6 : 4}
                          fill={hoveredChartIndex === idx ? "#a855f7" : "#818cf8"}
                          stroke="white"
                          strokeWidth={hoveredChartIndex === idx ? 2.5 : 1.5}
                          className="cursor-pointer transition-all duration-200"
                          onMouseEnter={() => setHoveredChartIndex(idx)}
                        />
                      ))}

                      {/* X-Axis Tick Labels */}
                      {chartData.map((pt) => (
                        <text
                          key={pt.month}
                          x={pt.x}
                          y="155"
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-slate-400 dark:fill-slate-500"
                        >
                          {pt.month}
                        </text>
                      ))}

                      {/* Definitions */}
                      <defs>
                        <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Interactive HTML Tooltip overlay */}
                    <div
                      className="absolute bg-[#111222] text-[10px] font-black text-white px-2 py-1 rounded-xl shadow-lg border border-purple-500/30 transition-all duration-300 pointer-events-none whitespace-nowrap"
                      style={{
                        left: `${(hoveredPoint.x / 380) * 100}%`,
                        top: `${(hoveredPoint.y / 160) * 100 - 18}%`,
                        transform: "translate(-50%, -100%)",
                      }}
                    >
                      {hoveredPoint.month}: {hoveredPoint.progress}
                    </div>
                  </div>
                </div>

                {/* Risk Distribution Donut Chart */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Risk Distribution</p>
                  
                  <div className="border border-slate-100 dark:border-white/[0.03] bg-slate-50/20 dark:bg-white/[0.01] rounded-xl p-2 flex items-center justify-between gap-2 h-36">
                    {/* SVG Donut Chart */}
                    <div className="relative flex items-center justify-center shrink-0 w-24 h-24">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {/* Background ring */}
                        <circle cx="50" cy="50" r="36" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800/40" strokeWidth="12" />
                        
                        {/* Low Risk Segment (68%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="12"
                          strokeDasharray="153.8 226.2"
                          strokeDashoffset="0"
                          className="transition-all duration-500"
                        />
                        {/* Medium Risk Segment (22%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke="#fbbf24"
                          strokeWidth="12"
                          strokeDasharray="49.7 226.2"
                          strokeDashoffset="-153.8"
                          className="transition-all duration-500"
                        />
                        {/* High Risk Segment (10%) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke="#ef4444"
                          strokeWidth="12"
                          strokeDasharray="22.6 226.2"
                          strokeDashoffset="-203.5"
                          className="transition-all duration-500"
                        />
                      </svg>
                      {/* Inside text label */}
                      <div className="absolute text-center select-none">
                        <p className="text-[14px] font-black text-slate-800 dark:text-white leading-none">Aug</p>
                        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">78%</p>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="flex-1 space-y-1.5 text-[9px] font-bold text-slate-600 dark:text-slate-350 pr-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                          Low Risk
                        </span>
                        <span>68%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
                          Medium Risk
                        </span>
                        <span>22%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                          High Risk
                        </span>
                        <span>10%</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Bottom List: Top At-Risk Goals */}
              <div className="space-y-2 pt-1.5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Top At-Risk Goals</p>
                
                <div className="space-y-2">
                  
                  {/* Goal item 1 */}
                  <div className="rounded-xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/50 dark:bg-white/[0.01] p-3 flex flex-col gap-2 hover:border-slate-200 dark:hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                          <Globe className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Website Redesign</p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">Due in 5 days</p>
                        </div>
                      </div>
                      
                      <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[9px] font-black text-rose-500">
                        High Risk
                      </span>
                    </div>
                    {/* Progress slider bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-200/50 dark:bg-white/5 overflow-hidden">
                        <div className="h-full w-[42%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
                      </div>
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400">42%</span>
                    </div>
                  </div>

                  {/* Goal item 2 */}
                  <div className="rounded-xl border border-slate-100 dark:border-white/[0.03] bg-slate-50/50 dark:bg-white/[0.01] p-3 flex flex-col gap-2 hover:border-slate-200 dark:hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                          <Smartphone className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">Mobile App Launch</p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">Due in 12 days</p>
                        </div>
                      </div>
                      
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[9px] font-black text-amber-500">
                        Medium Risk
                      </span>
                    </div>
                    {/* Progress slider bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-200/50 dark:bg-white/5 overflow-hidden">
                        <div className="h-full w-[65%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
                      </div>
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400">65%</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* ── Right Column: AI Buddy Chat Card ── */}
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

              {/* Speach bubble */}
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

        </div>

        {/* ── Hybrid Engine Flow Section ── */}
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
                <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Advanced reasoning & deep insights</p>
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
                <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">Intelligent orchestration & response generation</p>
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

        {/* ── Platform Capabilities Section (6 Feature Cards) ── */}
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

        {/* ── Footer ── */}
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

            {/* Build specs */}
            <div className="text-center">
              Built with <span className="text-slate-600 dark:text-slate-350">FastAPI + Python</span> • <span className="text-slate-600 dark:text-slate-350">PostgreSQL</span> • <span className="text-slate-600 dark:text-slate-350">Redis</span> • <span className="text-slate-600 dark:text-slate-350">Next.js</span> • <span className="text-slate-600 dark:text-slate-350">Tailwind CSS</span>
            </div>

            {/* Copyright */}
            <div className="uppercase tracking-wider">
              © {new Date().getFullYear()} GoalForge AI. All rights reserved.
            </div>

          </div>

        </footer>

      </div>
    </main>
  )
}
