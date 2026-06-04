import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Review comments
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/40">
            Manager feedback and review notes on employee goals.
          </p>
        </div>

        <div className="space-y-4">
          {comments.map((item) => (
            <Card key={item.date + item.employee} className="glass-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                    {item.employee}
                  </CardTitle>
                  <span className="text-xs text-slate-500 dark:text-white/40">{item.date}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-white/50">{item.goal}</p>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04] p-3 text-sm leading-6 text-slate-700 dark:text-white/80">
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
