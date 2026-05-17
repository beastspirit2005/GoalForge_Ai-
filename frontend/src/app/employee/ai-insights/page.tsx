import MilestoneCard from "@/components/ai/MilestoneCard"
import RecommendationBox from "@/components/ai/RecommendationBox"
import RiskIndicator from "@/components/ai/RiskIndicator"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { aiInsights, demoGoals } from "@/lib/demo-data"

export default function AIInsightsPage() {
  const highlightedGoal = demoGoals[2]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="premium-panel rounded-xl p-6 text-white">
          <h1 className="text-3xl font-semibold tracking-normal">
            AI insights
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Explainable recommendations for goals that need attention.
          </p>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {aiInsights.map((insight) => {
            const Icon = insight.icon

            return (
              <Card key={insight.title} className="metric-card rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{insight.body}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="product-surface rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Milestone breakdown: {highlightedGoal.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {highlightedGoal.milestones.map((milestone) => (
                <MilestoneCard key={milestone.title} {...milestone} />
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <RiskIndicator
              risk={highlightedGoal.risk}
              reason="AI detected weak conversion from outreach to discovery calls, plus a compressed deadline."
            />
            <RecommendationBox text={highlightedGoal.recommendation} />
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
