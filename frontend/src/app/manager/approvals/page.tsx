import ApprovalTable from "@/components/approvals/ApprovalTable"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApprovalsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Approvals
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/40">
            Review and manage goal modifications from your team.
          </p>
        </div>
        <Card className="glass-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Pending requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
