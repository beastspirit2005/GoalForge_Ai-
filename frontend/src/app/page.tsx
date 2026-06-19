"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import BrandLogo from "@/components/layout/BrandLogo"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

import HeroSection from "@/components/home/HeroSection"
import ExecutionOverviewCard from "@/components/home/ExecutionOverviewCard"
import AiBuddyChatCard from "@/components/home/AiBuddyChatCard"
import HybridEngineFlow from "@/components/home/HybridEngineFlow"
import FeatureCards from "@/components/home/FeatureCards"
import Footer from "@/components/home/Footer"

export default function Home() {
  const [mounted, setMounted] = useState(false)

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
          
          <HeroSection />
          
          <div className="lg:col-span-4 flex flex-col">
            <ExecutionOverviewCard />
          </div>

          <div className="lg:col-span-3 flex flex-col">
            <AiBuddyChatCard />
          </div>

        </div>

        <HybridEngineFlow />
        
        <FeatureCards />
        
        <Footer />
        
      </div>
    </main>
  )
}
