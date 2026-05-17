import GoalForm from "@/components/goals/GoalForm"
import DashboardLayout from "@/components/layout/DashboardLayout"

export default function CreateGoalPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Create goal
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Use AI to turn a broad outcome into milestones and next actions.
          </p>
        </div>
        <GoalForm />
      </div>
    </DashboardLayout>
  )
}
