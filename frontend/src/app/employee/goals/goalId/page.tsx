import DashboardLayout from "@/components/layout/DashboardLayout"
import MilestoneCard from "@/components/ai/MilestoneCard"
import RecommendationBox from "@/components/ai/RecommendationBox"
import GoalStatusBadge from "@/components/goals/GoalStatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { demoGoals } from "@/lib/demo-data"
import {
  Brain,
  CalendarDays,
  Clock3,
  Flame,
  Send,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react"
import Link from "next/link"

const riskColor = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-rose-100 text-rose-700",
}

export default function GoalDetailPage() {
  const goal = demoGoals[0]
  const completedMilestones = goal.milestones.filter((m) => m.done).length
  const totalMilestones = goal.milestones.length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero header */}
        <div className="premium-panel rounded-xl p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white/10 text-white">
                  {goal.id}
                </Badge>
                <GoalStatusBadge status={goal.status} />
                <GoalStatusBadge risk={goal.risk} />
              </div>
              <h1 className="text-3xl font-semibold tracking-normal">
                {goal.title}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/70">
                {goal.target}
              </p>
            </div>
            <div className="grid shrink-0 gap-2 rounded-lg border border-white/10 bg-white/[0.06] p-4 text-sm">
              <span className="text-slate-400">Progress</span>
              <span className="text-4xl font-semibold">{goal.progress}%</span>
              <div className="mt-1 h-2 w-40 rounded-full bg-white/20">
                <div
                  className="h-2 rounded-full bg-white transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metadata cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="metric-card rounded-xl">
            <CardContent className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-sky-100 text-sky-700">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Owner</p>
                <p className="text-sm font-semibold text-slate-950">
                  {goal.owner}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="metric-card rounded-xl">
            <CardContent className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-violet-100 text-violet-700">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Department</p>
                <p className="text-sm font-semibold text-slate-950">
                  {goal.department}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="metric-card rounded-xl">
            <CardContent className="flex items-center gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-amber-100 text-amber-700">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Deadline</p>
                <p className="text-sm font-semibold text-slate-950">
                  {goal.deadline}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="metric-card rounded-xl">
            <CardContent className="flex items-center gap-4">
              <div
                className={`grid h-10 w-10 place-items-center rounded-md ${riskColor[goal.risk]}`}
              >
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Risk Level</p>
                <p className="text-sm font-semibold text-slate-950">
                  {goal.risk} risk
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main content grid */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* Milestones */}
          <Card className="product-surface rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <Brain className="h-5 w-5 text-sky-600" />
                  AI-generated milestones
                </CardTitle>
                <Badge className="border-0 bg-sky-100 text-sky-700">
                  {completedMilestones}/{totalMilestones} done
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {goal.milestones.map((milestone) => (
                <MilestoneCard key={milestone.title} {...milestone} />
              ))}
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-sky-600 transition-all"
                  style={{
                    width: `${(completedMilestones / totalMilestones) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {completedMilestones} of {totalMilestones} milestones completed
                ({Math.round((completedMilestones / totalMilestones) * 100)}
                %)
              </p>
            </CardContent>
          </Card>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* AI Recommendation */}
            <RecommendationBox text={goal.recommendation} />

            {/* Quick actions */}
            <Card className="product-surface rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-950">
                  Quick actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button className="h-10 w-full gap-2 bg-slate-950 text-sm hover:bg-slate-800">
                  <TrendingUp className="h-4 w-4" />
                  Log check-in
                </Button>
                <Button
                  variant="outline"
                  className="h-10 w-full gap-2 text-sm"
                >
                  <Send className="h-4 w-4" />
                  Submit for approval
                </Button>
                <Button
                  variant="outline"
                  className="h-10 w-full gap-2 text-sm"
                  asChild
                >
                  <Link href="/employee/goals/create">
                    <Brain className="h-4 w-4" />
                    Regenerate AI plan
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Check-in history */}
            <Card className="product-surface rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                  Check-in history
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-950">
                      Q2 2026
                    </span>
                    <Badge className="border-0 bg-emerald-100 text-emerald-700">
                      On Track
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Completed AI FAQ prompts. Piloting next week.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">14 May 2026</p>
                </div>
                <p className="text-xs text-center text-slate-400">
                  1 check-in recorded
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
