import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Lock, Unlock } from "lucide-react"

const demoCycles = [
  { id: 1, name: "Q2 2026", start: "Apr 1, 2026", end: "Jun 30, 2026", status: "Active", goals: 24, completion: 78 },
  { id: 2, name: "Q1 2026", start: "Jan 1, 2026", end: "Mar 31, 2026", status: "Closed", goals: 31, completion: 89 },
  { id: 3, name: "Q4 2025", start: "Oct 1, 2025", end: "Dec 31, 2025", status: "Closed", goals: 28, completion: 92 },
]

export default function CyclesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              Goal cycles
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Configure and manage quarterly goal cycles.
            </p>
          </div>
          <Button className="h-10 gap-2 text-sm">
            <CalendarDays className="h-4 w-4" />
            New cycle
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {demoCycles.map((cycle) => (
            <Card key={cycle.id} className={`rounded-xl ${cycle.status === "Active" ? "ring-2 ring-sky-500 ring-offset-2" : ""} product-surface`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-slate-950">
                    {cycle.name}
                  </CardTitle>
                  <Badge className={cycle.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                    {cycle.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Start</p>
                    <p className="font-medium text-slate-950">{cycle.start}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">End</p>
                    <p className="font-medium text-slate-950">{cycle.end}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Goals</p>
                    <p className="font-medium text-slate-950">{cycle.goals}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Completion</p>
                    <p className="font-medium text-slate-950">{cycle.completion}%</p>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-sky-600 transition-all"
                    style={{ width: `${cycle.completion}%` }}
                  />
                </div>

                {cycle.status === "Active" ? (
                  <Button variant="outline" className="w-full gap-2 text-sm">
                    <Lock className="h-4 w-4" />
                    Close cycle
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full gap-2 text-sm" disabled>
                    <Unlock className="h-4 w-4" />
                    Cycle closed
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
