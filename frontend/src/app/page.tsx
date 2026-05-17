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
    title: "AI milestone planning",
    body: "Convert vague goals into weekly milestones, owner actions, and success metrics.",
    icon: Brain,
    gradient: "from-[var(--gf-indigo)] to-[var(--gf-violet)]",
  },
  {
    title: "Risk prediction",
    body: "Spot slow-moving goals before deadline week with smart heuristic-based predictions.",
    icon: ShieldAlert,
    gradient: "from-[var(--gf-rose)] to-[var(--gf-amber)]",
  },
  {
    title: "Performance intelligence",
    body: "Monthly, quarterly, and yearly performance tracking with AI-generated narratives.",
    icon: Activity,
    gradient: "from-[var(--gf-emerald)] to-[var(--gf-cyan)]",
  },
  {
    title: "Employee recognition",
    body: "Leaderboards, badges, streaks, and trophies that celebrate consistent execution.",
    icon: Trophy,
    gradient: "from-[var(--gf-amber)] to-[var(--gf-rose)]",
  },
  {
    title: "Predictive analytics",
    body: "Completion probability, burnout risk, and delayed goal detection using smart heuristics.",
    icon: BarChart3,
    gradient: "from-[var(--gf-cyan)] to-[var(--gf-indigo)]",
  },
  {
    title: "AI performance copilot",
    body: "Built-in AI assistant for goal coaching, prioritization, and team summaries.",
    icon: Sparkles,
    gradient: "from-[var(--gf-violet)] to-[var(--gf-indigo)]",
  },
]

export default function Home() {
  return (
    <main className="fixed-dark min-h-screen overflow-hidden bg-[oklch(0.11_0.015_270)] text-white">
      {/* Blurred background aesthetic elements */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-[var(--gf-indigo)]/8 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[var(--gf-violet)]/6 blur-[100px]" />
        <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-[var(--gf-cyan)]/5 blur-[100px]" />
      </div>

      <section className="relative grid min-h-screen content-between px-6 py-6 sm:px-10 lg:px-16">
        {/* Header navigation bar */}
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--gf-indigo)] to-[var(--gf-violet)] shadow-lg shadow-[var(--gf-indigo)]/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">GoalForge AI</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                Workforce Intelligence
              </p>
            </div>
          </div>
          <Button
            asChild
            className="h-9 gap-2 rounded-lg bg-white/[0.08] text-[13px] text-white/80 backdrop-blur-lg hover:bg-white/[0.14]"
          >
            <Link href="/login">Open platform</Link>
          </Button>
        </nav>

        {/* Hero section */}
        <div className="grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--gf-indigo)]/20 bg-[var(--gf-indigo)]/8 px-4 py-1.5 text-[13px] text-[var(--gf-indigo)] shadow-lg shadow-[var(--gf-indigo)]/10">
              <CheckCircle2 className="h-4 w-4" />
              AI-Powered Workforce Performance Intelligence
            </div>
            <h2 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-gradient">Turn goals</span> into action
              before teams drift off track.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/40">
              GoalForge AI actively helps employees achieve goals through adaptive AI
              milestone planning, predictive intelligence, performance coaching, and
              continuous recognition systems.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 gap-2 rounded-xl bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-violet)] text-white shadow-lg shadow-[var(--gf-indigo)]/25 transition-all hover:shadow-[var(--gf-indigo)]/35"
              >
                <Link href="/employee/dashboard">
                  Start employee demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="h-12 rounded-xl border border-white/10 bg-white/[0.05] text-white/70 backdrop-blur-lg hover:bg-white/[0.08]"
              >
                <Link href="/manager/dashboard">View manager console</Link>
              </Button>
            </div>
          </div>

          {/* Live data preview widget */}
          <div className="glass-panel p-5 shadow-2xl">
            <div className="rounded-xl border border-white/[0.06] bg-[var(--gf-surface)] p-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                    Execution health
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white/90">Q2 Goal Cycle</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[12px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400/0.6)]" />
                  Live
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-gradient-to-br from-[var(--gf-indigo)]/20 to-[var(--gf-indigo)]/5 p-4">
                  <p className="text-2xl font-bold text-white">78%</p>
                  <p className="mt-1 text-[10px] text-white/35">completion</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[var(--gf-cyan)]/20 to-[var(--gf-cyan)]/5 p-4">
                  <p className="text-2xl font-bold text-white">41</p>
                  <p className="mt-1 text-[10px] text-white/35">AI plans</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[var(--gf-amber)]/20 to-[var(--gf-amber)]/5 p-4">
                  <p className="text-2xl font-bold text-white">5</p>
                  <p className="mt-1 text-[10px] text-white/35">risk alerts</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-white/70">Engineering delivery</span>
                    <span className="text-white/35">69%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-1.5 w-[69%] rounded-full bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-cyan)]" />
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-white/70">People Ops onboarding</span>
                    <span className="text-white/35">81%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-1.5 w-[81%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature pills */}
            <div className="mt-4 grid gap-2">
              {features.slice(0, 3).map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${feature.gradient} shadow-md`}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </span>
                      <p className="text-[13px] font-semibold text-white/85">{feature.title}</p>
                    </div>
                    <p className="mt-2 text-[12px] leading-5 text-white/35">{feature.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Platform capabilities grid */}
        <div className="mb-12">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gf-indigo)]">
              Platform capabilities
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white/90">
              Everything you need for workforce excellence
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="glass-card-hover rounded-xl p-5"
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </span>
                  <p className="mt-4 text-[14px] font-semibold text-white/85">{feature.title}</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-white/35">{feature.body}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer info links */}
        <div className="grid gap-3 border-t border-white/[0.06] pt-5 text-[12px] text-white/30 md:grid-cols-3">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--gf-indigo)]" />
            FastAPI + Gemini AI backend
          </span>
          <span>Employee, manager, and admin role flows</span>
          <span>Production-grade performance intelligence</span>
        </div>
      </section>
    </main>
  )
}
