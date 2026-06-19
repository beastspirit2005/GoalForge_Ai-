"use client"

import { useState } from "react"
import { TrendingUp, Calendar, ChevronDown, Globe, Smartphone } from "lucide-react"

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

export default function ExecutionOverviewCard() {
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(4) // Default is August
  const [currentCycle, setCurrentCycle] = useState("Q2 Goal Cycle")
  const [cycleDropdownOpen, setCycleDropdownOpen] = useState(false)

  // Active point details for the chart
  const hoveredPoint = hoveredChartIndex !== null ? chartData[hoveredChartIndex] : chartData[4]

  return (
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
  )
}
