import { apiFetch } from "@/lib/api"
import { getStoredToken } from "./auth.service"
import type { Goal, GoalApprovalPayload, GoalCreatePayload, GoalUpdatePayload } from "@/types/goal"

function token() {
  return getStoredToken()
}

export async function getGoals(): Promise<Goal[]> {
  return apiFetch<Goal[]>("/goals/", { token: token() })
}

export async function getGoalById(id: number): Promise<Goal> {
  return apiFetch<Goal>(`/goals/${id}`, { token: token() })
}

export async function createGoal(data: GoalCreatePayload): Promise<Goal> {
  return apiFetch<Goal>("/goals/", { method: "POST", body: data, token: token() })
}

export async function updateGoal(id: number, data: GoalUpdatePayload): Promise<Goal> {
  return apiFetch<Goal>(`/goals/${id}`, { method: "PUT", body: data, token: token() })
}

export async function deleteGoal(id: number): Promise<void> {
  return apiFetch(`/goals/${id}`, { method: "DELETE", token: token() })
}

export async function submitGoal(id: number): Promise<Goal> {
  return apiFetch<Goal>(`/goals/${id}/submit`, { method: "POST", token: token() })
}

export async function generateGoalPlan(id: number): Promise<unknown> {
  return apiFetch(`/goals/${id}/generate-plan`, { method: "POST", token: token() })
}

export async function getGoalMilestones(goalId: number) {
  return apiFetch(`/goals/${goalId}/milestones`, { token: token() })
}

export async function toggleMilestone(milestoneId: number) {
  return apiFetch(`/goals/milestones/${milestoneId}/toggle`, { method: "PATCH", token: token() })
}

// ── Manager endpoints ──────────────────────────────────────
export async function getTeamGoals(): Promise<Goal[]> {
  return apiFetch<Goal[]>("/manager/team", { token: token() })
}

export async function approveGoal(id: number, data: GoalApprovalPayload) {
  return apiFetch(`/manager/goals/${id}/approve`, { method: "POST", body: data, token: token() })
}

export async function lockGoal(id: number) {
  return apiFetch(`/manager/goals/${id}/lock`, { method: "POST", token: token() })
}

// ── Admin endpoints ────────────────────────────────────────
export async function getAllGoals(): Promise<Goal[]> {
  return apiFetch<Goal[]>("/admin/goals", { token: token() })
}

export async function unlockGoal(id: number) {
  return apiFetch(`/admin/goals/${id}/unlock`, { method: "POST", token: token() })
}
