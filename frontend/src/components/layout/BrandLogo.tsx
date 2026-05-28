"use client"

import { Sparkles } from "lucide-react"

type BrandLogoProps = {
  size?: "sm" | "md" | "lg"
  hideSubtitle?: boolean
}

export default function BrandLogo({ size = "md", hideSubtitle = false }: BrandLogoProps) {
  const isSm = size === "sm"
  const isLg = size === "lg"

  return (
    <div className="flex items-center gap-3">
      {/* Futuristic Glowing Icon Badge */}
      <div className="relative flex items-center justify-center shrink-0">
        {/* Layer 1: Radial Glow Background */}
        <div className="absolute -inset-1.5 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-md transition-all duration-500 group-hover:opacity-100 group-hover:blur-lg" />
        
        {/* Layer 2: Glowing rotating border accent */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-pink-500 opacity-40 transition-all duration-700 ease-in-out group-hover:rotate-180" />

        {/* Layer 3: Glassmorphic Main Container */}
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-slate-950/90 shadow-inner transition-transform duration-300 group-hover:scale-105 dark:border-white/10 dark:bg-slate-900/90">
          
          {/* Layer 4: Overlapping Geometric Forge Elements */}
          <div className="relative h-6 w-6 flex items-center justify-center">
            {/* Spinning background rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-indigo-400/30 animate-spin" style={{ animationDuration: '10s' }} />
            
            {/* Sparkles of intelligence */}
            <Sparkles className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-fuchsia-300 animate-pulse drop-shadow-[0_0_4px_rgba(240,70,250,0.8)]" />
            
            {/* Custom SVG Geometric Forge Polygon */}
            <svg
              className="h-5.5 w-5.5 text-white drop-shadow-[0_0_6px_rgba(99,102,241,0.8)] animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Futuristic hexagonal forge shape */}
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
              <circle cx="12" cy="12" r="3" className="fill-fuchsia-400/80 stroke-fuchsia-400" />
              <line x1="12" y1="2" x2="12" y2="9" />
              <line x1="12" y1="15" x2="12" y2="22" />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand Text Columns */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-base font-black tracking-tight text-transparent dark:from-white dark:via-slate-200 dark:to-indigo-100">
            GoalForge
          </span>
          <span className="rounded-md bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm shadow-indigo-500/25">
            AI
          </span>
        </div>
        {!hideSubtitle && (
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400/90 dark:text-white/40">
            Performance Intelligence
          </p>
        )}
      </div>
    </div>
  )
}
