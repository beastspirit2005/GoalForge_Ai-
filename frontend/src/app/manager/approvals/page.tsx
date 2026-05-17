import ApprovalTable from "@/components/approvals/ApprovalTable"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApprovalsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Approvals
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Simulated manager decisions for the hackathon demo.
          </p>
        </div>
        <Card className="rounded-lg border-0 bg-white shadow-sm ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-950">
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
