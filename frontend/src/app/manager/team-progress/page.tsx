import DashboardLayout from "@/components/layout/DashboardLayout"
import GoalTable from "@/components/goals/GoalTable"
import HeatMap from "@/components/dashboard/HeatMap"
import ProgressChart from "@/components/dashboard/ProgressChart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { demoGoals } from "@/lib/demo-data"

export default function TeamProgressPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Team progress
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Weekly activity and goal completion across your team.
          </p>
        </div>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="product-surface rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-950">
                Progress over time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressChart />
            </CardContent>
          </Card>

          <Card className="product-surface rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-950">
                Activity heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HeatMap />
            </CardContent>
          </Card>
        </section>

        <Card className="product-surface rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-950">
              All team goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GoalTable goals={demoGoals} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
