"use client"

import { managerQueue, type Goal, type GoalRisk, type GoalStatus } from "@/lib/demo-data"
import type { GeneratePlanResponse } from "@/services/ai.service"

const LOCAL_GOALS_KEY = "goalforge.demo.goals"

type LocalGoalInput = {
  title: string
  description: string
  target: string
  deadline: string
  plan: GeneratePlanResponse
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
    owner: "Aarav Mehta",
    department: "People Ops",
    progress: 0,
    deadline: formatDateLabel(input.deadline),
    status: statusFromRisk(input.plan.risk),
    risk: input.plan.risk,
    target: input.target,
    recommendation: input.plan.recommendation,
    milestones: input.plan.milestones.map((title, index) => ({
      title,
      due: index === input.plan.milestones.length - 1 ? "Final week" : `Week ${index + 1}`,
      done: false,
    })),
  }

  window.localStorage.setItem(LOCAL_GOALS_KEY, JSON.stringify([nextGoal, ...current]))

  // Add to manager approval queue too
  try {
    const queueKey = "goalforge.demo.queue"
    const rawQueue = window.localStorage.getItem(queueKey)
    const currentQueue = rawQueue ? JSON.parse(rawQueue) : managerQueue
    const newQueueItem = {
      employee: "Aarav Mehta",
      request: `Approve new goal: ${input.title}`,
      impact: `${input.plan.risk} Risk. Target: ${input.target}`,
      status: "Pending"
    }
    window.localStorage.setItem(queueKey, JSON.stringify([newQueueItem, ...currentQueue]))
  } catch (e) {
    console.error("Failed to add to manager queue", e)
  }

  return nextGoal
}
