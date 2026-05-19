"use client"

import CompletionChart from "@/components/analytics/CompletionChart"
import LineChartCard from "@/components/analytics/LineChartCard"
import PieChartCard from "@/components/analytics/PieChartCard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { adminMetrics } from "@/lib/demo-data"

export default function AdminAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="premium-panel rounded-xl p-6 text-white">
          <h1 className="text-3xl font-semibold tracking-normal">
            Admin analytics
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Organization-wide execution signals for leaders and hackathon judges.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminMetrics.map((metric) => {
            const Icon = metric.icon

            return (
              <Card key={metric.label} className="metric-card rounded-xl">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{metric.value}</p>
                  </div>
                  <div className="rounded-md bg-slate-950 p-3 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="product-surface rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-950">
                Weekly goal momentum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LineChartCard />
            </CardContent>
          </Card>
          <Card className="product-surface rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-950">
                Risk distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChartCard />
            </CardContent>
          </Card>
        </section>

        <Card className="product-surface rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-950">
              Department performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompletionChart />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
