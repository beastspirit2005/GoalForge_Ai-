import Link from "next/link"
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  Zap,
  Activity,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    title: "AI Milestone Planning",
    body: "Convert vague goals into weekly milestones, owner actions, and clear success metrics.",
    icon: Brain,
  },
  {
    title: "Risk Prediction",
    body: "Spot slow-moving goals before deadline week with smart heuristic-based health alerts.",
    icon: ShieldAlert,
  },
  {
    title: "Performance Intelligence",
    body: "Monthly, quarterly, and yearly performance tracking with clear AI-generated insights.",
    icon: Activity,
  },
  {
    title: "Employee Recognition",
    body: "Celebrate consistent execution with leaderboard achievements, streaks, and trophies.",
    icon: Trophy,
  },
  {
    title: "Predictive Analytics",
    body: "Analyze completion probability, team burnout risk, and delayed goal detection.",
    icon: BarChart3,
  },
  {
    title: "AI Performance Copilot",
    body: "A built-in performance assistant for goal coaching, prioritization, and summaries.",
    icon: Sparkles,
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500/30">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-950/15 blur-[150px]" />
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-950/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-12 flex flex-col min-h-screen justify-between">
        {/* Navigation */}
        <nav className="flex items-center justify-between border-b border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                GoalForge <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">AI</span>
              </h1>
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            className="h-8.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:text-white text-xs font-semibold px-4 transition-all"
          >
            <Link href="/login">Sign In</Link>
          </Button>
        </nav>

        {/* Hero Area */}
        <div className="grid gap-12 py-16 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/10 bg-indigo-500/5 px-3 py-1 text-[11px] font-semibold text-indigo-400 tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Workforce Intelligence
            </div>
            <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Turn Goals into <br />
              <span className="bg-gradient-to-r from-indigo-400 via-indigo-200 to-violet-400 bg-clip-text text-transparent">Consistent Execution.</span>
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400">
              GoalForge AI helps teams achieve objectives through clean, automated milestone generation, heuristic risk predictions, and a dedicated performance copilot.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                asChild
                className="h-10.5 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/15"
              >
                <Link href="/employee/dashboard" className="flex items-center gap-1.5">
                  Launch Employee Demo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                asChild
                className="h-10.5 px-5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:text-white text-slate-400 font-semibold text-xs transition-all"
              >
                <Link href="/manager/dashboard">Manager Console</Link>
              </Button>
            </div>
          </div>

          {/* Clean Dashboard Status Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Execution Health
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-200">Q2 Goal Cycle</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-lg border border-slate-900 bg-slate-950/60 p-3">
                <p className="text-lg font-extrabold text-white">78%</p>
                <p className="text-[9px] font-medium text-slate-500 mt-0.5">Completion</p>
              </div>
              <div className="rounded-lg border border-slate-900 bg-slate-950/60 p-3">
                <p className="text-lg font-extrabold text-white">41</p>
                <p className="text-[9px] font-medium text-slate-500 mt-0.5">AI Milestones</p>
              </div>
              <div className="rounded-lg border border-slate-900 bg-slate-950/60 p-3">
                <p className="text-lg font-extrabold text-white">5</p>
                <p className="text-[9px] font-medium text-slate-500 mt-0.5">Risk Alerts</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="rounded-lg border border-slate-900 bg-slate-950/60 p-2.5">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-semibold text-slate-400">Engineering delivery</span>
                  <span className="text-slate-500">69%</span>
                </div>
                <div className="h-1 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full w-[69%] rounded-full bg-indigo-500" />
                </div>
              </div>
              <div className="rounded-lg border border-slate-900 bg-slate-950/60 p-2.5">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-semibold text-slate-400">People Ops onboarding</span>
                  <span className="text-slate-500">81%</span>
                </div>
                <div className="h-1 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full w-[81%] rounded-full bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities Section */}
        <div className="border-t border-slate-900 pt-12 pb-16">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              Platform Features
            </p>
            <h3 className="text-xl font-bold text-white">
              Minimal, focused execution toolkits
            </h3>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-900/60 bg-slate-950/20 p-5 hover:border-slate-800 hover:bg-slate-950/40 transition-all duration-300 group"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600/5 border border-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600/10 group-hover:text-indigo-300 transition-colors">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-4 text-xs font-bold text-slate-200">{feature.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400/80">{feature.body}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-900 py-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-600 gap-3">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-500/80" />
            FastAPI + Gemini AI Backend
          </span>
          <span>Dual Employee & Manager Dashboards</span>
          <span>© {new Date().getFullYear()} GoalForge. All rights reserved.</span>
        </footer>
      </div>
    </main>
  )
}
