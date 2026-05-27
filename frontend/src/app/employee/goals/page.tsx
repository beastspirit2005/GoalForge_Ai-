"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AdvancedGoalTable from "@/components/goals/AdvancedGoalTable"
import { Button } from "@/components/ui/button"
import { demoGoals, type Goal } from "@/lib/demo-data"
import { getLocalDemoGoals } from "@/lib/local-demo-goals"
import Link from "next/link"

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    const handleUpdate = () => {
      setGoals([...getLocalDemoGoals(), ...demoGoals])
    }
    
    handleUpdate()
    window.addEventListener("local-goals-updated", handleUpdate)
    return () => window.removeEventListener("local-goals-updated", handleUpdate)
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              My goals
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track personal goals, risk, milestones, and AI guidance.
            </p>
          </div>
          <Button asChild className="h-10 text-sm">
            <Link href="/employee/goals/create">Create goal</Link>
          </Button>
        </div>
        <div className="mt-8">
          <AdvancedGoalTable goals={goals} />
        </div>
      </div>
    </DashboardLayout>
  )
}
