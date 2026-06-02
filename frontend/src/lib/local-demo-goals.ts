"use client"

import { managerQueue, type Goal, type GoalRisk, type GoalStatus } from "@/lib/demo-data"
import type { GeneratePlanResponse } from "@/services/ai.service"
import { addLocalNotification } from "@/lib/local-notifications"
import { addLocalAuditLog } from "@/lib/local-audit-logs"

const LOCAL_GOALS_KEY = "goalforge.demo.goals"

type LocalGoalInput = {
  title: string
  description: string
  target: string
  deadline: string
  plan: GeneratePlanResponse
  ownerName?: string
  ownerDept?: string
  managerName?: string
}

function formatDateLabel(date: string) {
  if (!date) {
    return "No deadline"
  }

  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function statusFromRisk(risk: GoalRisk): GoalStatus {
  if (risk === "High") return "At Risk"
  if (risk === "Medium") return "Needs Review"
  return "On Track"
}

export function getLocalDemoGoals(): Goal[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_GOALS_KEY)
    return raw ? (JSON.parse(raw) as Goal[]) : []
  } catch {
    window.localStorage.removeItem(LOCAL_GOALS_KEY)
    return []
  }
}

export function addLocalDemoGoal(input: LocalGoalInput) {
  const current = getLocalDemoGoals()
  const id = `GF-D${Date.now().toString().slice(-5)}`

  const nextGoal: Goal = {
    id,
    title: input.title,
    owner: input.ownerName || "Aarav Mehta",
    department: input.ownerDept || "People Ops",
    progress: 0,
    deadline: formatDateLabel(input.deadline),
    status: "Pending Approval",
    risk: input.plan.risk,
    target: input.target,
    recommendation: input.plan.recommendation,
    milestones: input.plan.milestones.map((title, index) => ({
      title,
      due: index === input.plan.milestones.length - 1 ? "Final week" : `Week ${index + 1}`,
      done: false,
    })),
    createdAt: new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
  }

  window.localStorage.setItem(LOCAL_GOALS_KEY, JSON.stringify([nextGoal, ...current]))

  addLocalAuditLog({
    user: input.ownerName || "Aarav Mehta",
    action: "goal_created",
    entity: "goal",
    entityId: id,
    detail: `Created '${input.title}'`,
  })

  // Add to manager approval queue too
  try {
    const queueKey = "goalforge.demo.queue"
    const rawQueue = window.localStorage.getItem(queueKey)
    const currentQueue = rawQueue ? JSON.parse(rawQueue) : managerQueue
    const newQueueItem = {
      goalId: id,
      employee: input.ownerName || "Aarav Mehta",
      request: `Approve new goal: ${input.title}`,
      impact: `${input.plan.risk} Risk. Target: ${input.target}`,
      status: "Pending"
    }
    window.localStorage.setItem(queueKey, JSON.stringify([newQueueItem, ...currentQueue]))
    
    addLocalNotification({
      title: "Goal Created - Attention Required",
      message: `${input.ownerName || "Aarav Mehta"} has created a new goal: "${input.title}"`,
      type: "warning",
      recipientRole: "manager"
    })
  } catch (e) {
    console.error("Failed to add to manager queue", e)
  }

  return nextGoal
}
