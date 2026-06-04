"use client"

import { Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { aiInsights, demoGoals } from "@/lib/demo-data"
import RiskIndicator from "./RiskIndicator"
import RecommendationBox from "./RecommendationBox"

export default function AIInsights() {
  const riskGoals = demoGoals.filter((g) => g.risk !== "Low")

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {aiInsights.map((insight) => {
          const Icon = insight.icon
          return (
            <Card key={insight.title} className="metric-card rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{insight.body}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {riskGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-sky-600" />
            AI Risk Alerts
          </h3>
          {riskGoals.map((goal) => (
            <div key={goal.id} className="grid gap-3 lg:grid-cols-2">
              <RiskIndicator
                risk={goal.risk}
                reason={`${goal.title} is at ${goal.progress}% with deadline ${goal.deadline}`}
              />
              <RecommendationBox text={goal.recommendation} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
