import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { demoGoals } from "@/lib/demo-data"

const comments = [
  {
    employee: "Kabir Singh",
    goal: "Grow enterprise pipeline",
    comment: "Discovery call conversion is low. Let's review the ICP list together.",
    date: "14 May 2026",
  },
  {
    employee: "Neha Rao",
    goal: "Improve sprint delivery",
    comment: "Good progress on the dependency board. Schedule calibration sessions next.",
    date: "12 May 2026",
  },
  {
    employee: "Aarav Mehta",
    goal: "Launch AI onboarding",
    comment: "Pilot with new hires is on track. Share results by end of week.",
    date: "10 May 2026",
  },
]

export default function CommentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Review comments
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manager feedback and review notes on employee goals.
          </p>
        </div>

        <div className="space-y-4">
          {comments.map((item) => (
            <Card key={item.date + item.employee} className="product-surface rounded-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-950">
                    {item.employee}
                  </CardTitle>
                  <span className="text-xs text-slate-500">{item.date}</span>
                </div>
                <p className="text-sm text-slate-500">{item.goal}</p>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-sky-50 p-3 text-sm leading-6 text-slate-700">
                  &ldquo;{item.comment}&rdquo;
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
