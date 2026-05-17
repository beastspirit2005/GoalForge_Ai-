import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const checkins = [
  "Completed AI FAQ prompts",
  "Blocked by sales account research delay",
  "Need manager feedback on sprint dependency board",
]

export default function CheckinsPage() {
  return (
    <DashboardLayout>
      <Card className="rounded-lg border-0 bg-white shadow-sm ring-1 ring-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-950">
            Weekly check-ins
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checkins.map((checkin) => (
            <div key={checkin} className="rounded-md border border-slate-200 p-3 text-sm text-slate-600">
              {checkin}
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
