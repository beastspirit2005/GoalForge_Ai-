"use client"

import React, { useState, useEffect } from "react"
import { CalendarDays, UserRound, AlertTriangle, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react"
import GoalStatusBadge from "@/components/goals/GoalStatusBadge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { Goal } from "@/lib/demo-data"
import { addLocalAuditLog } from "@/lib/local-audit-logs"
import { addLocalNotification } from "@/lib/local-notifications"

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

type Props = {
  goals: Goal[]
  isManagerView?: boolean
}

export default function AdvancedGoalTable({ goals, isManagerView = false }: Props) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [showModal, setShowModal] = useState(false)
  const [escalatingGoalId, setEscalatingGoalId] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [allEscalations, setAllEscalations] = useState<any[]>([])

  useEffect(() => {
    const loadEscalations = () => {
      try {
        const stored = window.localStorage.getItem("goalforge.demo.escalations")
        if (stored) {
          setAllEscalations(JSON.parse(stored))
        } else {
          setAllEscalations(initialEscalations)
        }
      } catch (e) {
        console.error("Failed to load escalations", e)
      }
    }
    
    loadEscalations()
    window.addEventListener("escalations-updated", loadEscalations)
    return () => window.removeEventListener("escalations-updated", loadEscalations)
  }, [])

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleEscalateClick = (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEscalatingGoalId(goalId)
    setShowModal(true)
  }

  const submitEscalation = () => {
    if (!reason.trim() || !escalatingGoalId) return

    const goal = goals.find(g => g.id === escalatingGoalId)
    if (!goal) return

    try {
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

      // Update goals
      const storedGoals = window.localStorage.getItem("goalforge.demo.goals")
      if (storedGoals) {
        const currentGoals = JSON.parse(storedGoals)
        const updatedGoals = currentGoals.map((g: any) => {
          if (g.id === goal.id) {
            return { ...g, status: "Escalated" }
          }
          return g
        })
        window.localStorage.setItem("goalforge.demo.goals", JSON.stringify(updatedGoals))
      }

      // Update escalations
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

      // Notifications
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

      // Audit Log
      addLocalAuditLog({
        user: goal.owner || "Aarav Mehta",
        action: "escalation_created",
        entity: "escalation",
        entityId: goal.id,
        detail: `Escalated goal "${goal.title}" to Admin. Reason: ${reason}`
      })

      window.dispatchEvent(new Event("local-goals-updated"))
      window.dispatchEvent(new Event("escalations-updated"))

      setReason("")
      setShowModal(false)
      setEscalatingGoalId(null)
    } catch (e) {
      console.error("Escalation failed", e)
    }
  }

  const getGoalEscalations = (goal: Goal) => {
    return allEscalations.filter((esc: any) => {
      if (esc.goalId && esc.goalId === goal.id) return true
      return esc.goal === goal.title && esc.employee === goal.owner
    })
  }

  return (
    <div className="w-full">
      <div className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-950/40 overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow className="border-slate-200 dark:border-white/[0.06]">
              <TableHead className="w-8"></TableHead>
              <TableHead className="text-slate-500 dark:text-white/40 font-medium">Goal</TableHead>
              <TableHead className="text-slate-500 dark:text-white/40 font-medium">Owner</TableHead>
              <TableHead className="text-slate-500 dark:text-white/40 font-medium w-32">Progress</TableHead>
              <TableHead className="text-slate-500 dark:text-white/40 font-medium">Risk</TableHead>
              <TableHead className="text-slate-500 dark:text-white/40 font-medium">Status</TableHead>
              <TableHead className="text-slate-500 dark:text-white/40 font-medium hidden md:table-cell">Created At</TableHead>
              <TableHead className="text-slate-500 dark:text-white/40 font-medium">Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goals.map((goal) => {
              const isExpanded = expandedRows[goal.id]
              const escalations = getGoalEscalations(goal)
              const canEscalate = !isManagerView && (goal.status === "Rejected" || goal.status === "Approved after Editing")
              const hasEscalations = escalations.length > 0

              return (
                <React.Fragment key={goal.id}>
                  <TableRow 
                    className={`cursor-pointer border-slate-200 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-slate-50/50 dark:bg-white/[0.01]' : ''}`}
                    onClick={() => toggleRow(goal.id)}
                  >
                    <TableCell className="p-3">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white/90">
                      <div className="flex items-center gap-2">
                        {goal.title}
                        {hasEscalations && (
                          <span className="flex h-2 w-2 rounded-full bg-rose-500" title="Has escalations"></span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-white/60">{goal.owner}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-white/70 w-8">{goal.progress}%</span>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 hidden sm:block">
                          <div
                            className="h-2 rounded-full bg-sky-500 dark:bg-sky-400"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <GoalStatusBadge risk={goal.risk} />
                    </TableCell>
                    <TableCell>
                      <GoalStatusBadge status={goal.status} />
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-white/50 text-sm hidden md:table-cell">
                      {goal.createdAt || "N/A"}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-white/50 text-sm whitespace-nowrap">
                      {goal.deadline}
                    </TableCell>
                  </TableRow>
                  
                  {isExpanded && (
                    <TableRow className="border-slate-200 dark:border-white/[0.06] bg-slate-50/30 dark:bg-slate-900/20 hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                      <TableCell colSpan={8} className="p-0 border-b-0">
                        <div className="px-4 md:px-10 py-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
                          {/* Left Column: Details */}
                          <div className="space-y-4 flex-1">
                            <div>
                              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Target</h4>
                              <p className="text-sm text-slate-800 dark:text-slate-200">{goal.target}</p>
                            </div>
                            
                            {goal.recommendation && (
                              <div className="rounded-md bg-indigo-50 dark:bg-indigo-500/10 p-3 border border-indigo-100 dark:border-indigo-500/20">
                                <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">AI Recommendation</h4>
                                <p className="text-sm text-indigo-900 dark:text-indigo-200">{goal.recommendation}</p>
                              </div>
                            )}

                            {goal.milestones && goal.milestones.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Milestones</h4>
                                <div className="space-y-2">
                                  {goal.milestones.map((m, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${m.done ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                        {m.done && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                      </div>
                                      <span className={m.done ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}>{m.title}</span>
                                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{m.due}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Escalations & Actions */}
                          <div className="space-y-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/[0.06] lg:pl-8 lg:w-1/3 lg:min-w-[280px]">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                              Escalation History
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">{escalations.length}</span>
                            </h4>
                            
                            {escalations.length > 0 ? (
                              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {escalations.map((esc) => (
                                  <div key={esc.id} className="rounded-lg bg-white dark:bg-slate-950 p-3 border border-slate-200 dark:border-white/[0.06] shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] text-slate-400 font-mono">{esc.updated}</span>
                                      {esc.status === "Resolved" ? (
                                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold uppercase text-[9px] border border-emerald-200 dark:border-emerald-500/20">
                                          Resolved
                                        </span>
                                      ) : esc.status === "Acknowledged" ? (
                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 font-bold uppercase text-[9px] border border-amber-200 dark:border-amber-500/20">
                                          Acknowledged
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 font-bold uppercase text-[9px] border border-rose-200 dark:border-rose-500/20">
                                          Open
                                        </span>
                                      )}
                                    </div>
                                    {esc.note && (
                                      <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-2">
                                        &quot;{esc.note}&quot;
                                      </p>
                                    )}
                                    {esc.adminRemarks && (
                                      <div className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 p-2 rounded mt-2">
                                        <span className="font-semibold text-sky-600 dark:text-sky-400">Admin Remark:</span> {esc.adminRemarks}
                                      </div>
                                    )}
                                    {esc.resolutionNote && (
                                      <div className="mt-2 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded border border-emerald-100 dark:border-emerald-500/10 text-xs">
                                        <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">Resolution:</p>
                                        <p className="text-emerald-800 dark:text-emerald-300">{esc.resolutionNote}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No escalations for this goal.</p>
                            )}

                            {canEscalate && (
                              <div className="pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:text-rose-400 dark:border-rose-500/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 dark:hover:border-rose-500/30 gap-1.5"
                                  onClick={(e) => handleEscalateClick(goal.id, e)}
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Escalate to Admin
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Escalation Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Escalate Goal to Admin</h3>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Explain why this goal decision requires administrative review.
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
                  setEscalatingGoalId(null)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!reason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 border-0"
                onClick={submitEscalation}
              >
                Submit Escalation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
