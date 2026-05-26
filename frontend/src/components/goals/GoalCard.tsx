"use client"

import { useState, useEffect } from "react"
import { CalendarDays, UserRound, AlertTriangle, ShieldAlert } from "lucide-react"
import GoalStatusBadge from "@/components/goals/GoalStatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Goal } from "@/lib/demo-data"
import { addLocalAuditLog } from "@/lib/local-audit-logs"
import { addLocalNotification } from "@/lib/local-notifications"

type Props = {
  goal: Goal
}

const initialEscalations = [
  {
    id: 1,
    employee: "Kabir Singh",
    goal: "Grow enterprise pipeline",
    department: "Sales",
    risk: "High" as const,
    status: "Open" as const,
    progress: 40,
    owner: "Priya Nair",
    updated: "17 May 2026, 10:20",
    note: "Progress is below target with deadline pressure increasing.",
  },
  {
    id: 2,
    employee: "Neha Rao",
    goal: "Improve sprint delivery predictability",
    department: "Engineering",
    risk: "Medium" as const,
    status: "Acknowledged" as const,
    progress: 58,
    owner: "Priya Nair",
    updated: "16 May 2026, 16:45",
    note: "Dependency board needs manager follow-up before the next check-in.",
  },
  {
    id: 3,
    employee: "Aarav Mehta",
    goal: "Launch onboarding analytics",
    department: "People Ops",
    risk: "High" as const,
    status: "Open" as const,
    progress: 36,
    owner: "Rohan Kapoor",
    updated: "16 May 2026, 09:15",
    note: "Milestone completion is slipping after two missed weekly updates.",
  },
]

export default function GoalCard({ goal }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState("")
  const [localEscalations, setLocalEscalations] = useState<any[]>([])

  useEffect(() => {
    const loadGoalEscalations = () => {
      try {
        const stored = window.localStorage.getItem("goalforge.demo.escalations")
        const currentEsc = stored ? JSON.parse(stored) : initialEscalations
        const matched = currentEsc.filter((esc: any) => {
          if (esc.goalId && esc.goalId === goal.id) {
            return true
          }
          return esc.goal === goal.title && esc.employee === goal.owner
        })
        setLocalEscalations(matched)
      } catch (e) {
        console.error("Failed to load goal escalations in GoalCard", e)
      }
    }
    
    loadGoalEscalations()
    window.addEventListener("escalations-updated", loadGoalEscalations)
    return () => window.removeEventListener("escalations-updated", loadGoalEscalations)
  }, [goal.title, goal.id, goal.owner])

  const canEscalate = goal.status === "Rejected" || goal.status === "Approved after Editing"

  const handleEscalate = () => {
    if (!reason.trim()) return

    try {
      // Find the manager's name from the local users store, or default to Priya Nair (demo data manager)
      let managerName = "Priya Nair"
      try {
        const storedUsers = window.localStorage.getItem("goalforge.admin.users")
        const currentUser = window.localStorage.getItem("goalforge.auth.token") 
          ? JSON.parse(window.localStorage.getItem("goalforge.auth.user") || "{}") 
          : null
          
        if (storedUsers && currentUser?.manager_id) {
          const usersList = JSON.parse(storedUsers)
          const manager = usersList.find((u: any) => u.id === currentUser.manager_id)
          if (manager) {
            managerName = manager.name
          }
        }
      } catch (e) {
        console.error("Could not resolve manager name", e)
      }
      // 1. Get and update goals
      const storedGoals = window.localStorage.getItem("goalforge.demo.goals")
      if (storedGoals) {
        const goals = JSON.parse(storedGoals)
        const updatedGoals = goals.map((g: any) => {
          if (g.id === goal.id) {
            return { ...g, status: "Escalated" }
          }
          return g
        })
        window.localStorage.setItem("goalforge.demo.goals", JSON.stringify(updatedGoals))
      }

      // 2. Get and update escalations
      const storedEsc = window.localStorage.getItem("goalforge.demo.escalations")
      const currentEsc = storedEsc ? JSON.parse(storedEsc) : initialEscalations
      const newEsc = {
        id: Date.now(),
        goalId: goal.id,
        employee: goal.owner || "Aarav Mehta",
        goal: goal.title,
        department: goal.department || "People Ops",
        risk: goal.risk || "High",
        status: "Open",
        progress: goal.progress || 0,
        owner: managerName,
        updated: new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        note: reason
      }
      window.localStorage.setItem("goalforge.demo.escalations", JSON.stringify([newEsc, ...currentEsc]))

      // 3. Trigger Notifications
      const escalationTime = newEsc.updated
      addLocalNotification({
        title: "Goal Escalated",
        message: `You escalated the goal "${goal.title}" to Admin on ${escalationTime}.`,
        type: "info",
        recipientRole: "employee"
      })

      addLocalNotification({
        title: "Goal Escalated - Action Required",
        message: `${goal.owner || "Aarav Mehta"} has escalated the goal "${goal.title}" on ${escalationTime}.`,
        type: "warning",
        recipientRole: "admin"
      })

      // 4. Log to audit trail
      addLocalAuditLog({
        user: goal.owner || "Aarav Mehta",
        action: "escalation_created",
        entity: "escalation",
        entityId: goal.id,
        detail: `Escalated goal "${goal.title}" to Admin. Reason: ${reason}`
      })

      // 5. Dispatch update events
      window.dispatchEvent(new Event("local-goals-updated"))
      window.dispatchEvent(new Event("escalations-updated"))

      // 5. Clean up
      setReason("")
      setShowModal(false)
    } catch (e) {
      console.error("Escalation failed", e)
    }
  }

  return (
    <Card className="metric-card rounded-lg relative flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
            {goal.title}
          </CardTitle>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {goal.status && <GoalStatusBadge status={goal.status} />}
            <GoalStatusBadge risk={goal.risk} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{goal.target}</p>
          <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-sky-600"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              {goal.owner}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Due {goal.deadline}
            </span>
          </div>

          {localEscalations.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-white/[0.06] pt-3">
              {localEscalations.map((esc) => (
                <div key={esc.id} className="rounded-lg bg-slate-50 dark:bg-white/[0.01] p-3 border border-slate-100 dark:border-white/[0.04] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Escalation Status:</span>
                    {esc.status === "Resolved" ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-bold uppercase text-[9px] border border-emerald-500/20">
                        Resolved
                      </span>
                    ) : esc.status === "Acknowledged" ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 font-bold uppercase text-[9px] border border-amber-500/20">
                        Acknowledged
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold uppercase text-[9px] border border-rose-500/20">
                        Open
                      </span>
                    )}
                  </div>
                  {esc.note && (
                    <p className="mt-1.5 text-slate-500 dark:text-slate-400 italic">
                      &ldquo;{esc.note}&rdquo;
                    </p>
                  )}
                  {esc.adminRemarks && (
                    <div className="mt-2 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">Admin Remarks:</span> {esc.adminRemarks}
                    </div>
                  )}
                  {esc.resolutionNote && (
                    <div className="mt-2 bg-emerald-500/5 dark:bg-emerald-500/10 p-2.5 rounded border border-emerald-500/10 text-slate-700 dark:text-slate-200">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">Admin Solution:</p>
                      <p className="leading-relaxed">{esc.resolutionNote}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {canEscalate && (
          <div className="mt-5 border-t border-slate-100 dark:border-white/[0.06] pt-4 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-rose-500 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 gap-1.5"
              onClick={() => setShowModal(true)}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Escalate to Admin
            </Button>
          </div>
        )}
      </CardContent>

      {/* Escalation Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Escalate Goal to Admin</h3>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Explain why this goal decision (e.g. rejection or manager modifications) requires administrative review.
            </p>
            <div className="mt-4">
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                placeholder="Reason for escalation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setShowModal(false)
                  setReason("")
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!reason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 border-0"
                onClick={handleEscalate}
              >
                Submit Escalation
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
