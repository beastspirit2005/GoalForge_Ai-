/**
 * Enterprise V2 API Service — all new Enterprise endpoint calls.
 */

import { API_URL } from "@/lib/api"
import { getStoredToken } from "@/services/auth.service"

async function apiFetchRaw<T = unknown>(path: string): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers,
  })
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    throw new Error(`API error ${res.status}: Unauthorized`)
  }
  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }
  return res.json()
}

async function apiPostRaw<T = unknown>(path: string, body?: unknown): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    throw new Error(`API error ${res.status}: Unauthorized`)
  }
  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }
  return res.json()
}

async function apiPutRaw<T = unknown>(path: string, body?: unknown): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    throw new Error(`API error ${res.status}: Unauthorized`)
  }
  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }
  return res.json()
}

async function apiDeleteRaw(path: string): Promise<void> {
  const token = getStoredToken()
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  })
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    throw new Error(`API error ${res.status}: Unauthorized`)
  }
  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }
}

// ── AI Recommendations ──────────────────────────────────────────────
export const getManagerRecommendations = (targetId: number) =>
  apiFetchRaw<any>(`/ai-recommend/manager/${targetId}`)

export const getEmployeeRecommendations = (taskId: number) =>
  apiFetchRaw<any>(`/ai-recommend/employee/${taskId}`)

export const getTeamSuggestion = (targetId: number) =>
  apiFetchRaw<any>(`/ai-recommend/team/${targetId}`)

// ── Workload Intelligence ───────────────────────────────────────────
export const getWorkloadHeatmap = (department?: string) =>
  apiFetchRaw<any>(`/workload/heatmap${department ? `?department=${department}` : ""}`)

export const getRebalanceSuggestions = () =>
  apiFetchRaw<any>(`/workload/rebalance-suggestions`)

export const getPerformanceTrend = (userId: number, period = 90) =>
  apiFetchRaw<any>(`/workload/trend/${userId}?period=${period}`)

export const getProductivityInsights = () =>
  apiFetchRaw<any>(`/workload/productivity-insights`)

// ── Risk Prediction ─────────────────────────────────────────────────
export const getBurnoutRisk = (userId: number) =>
  apiFetchRaw<any>(`/risk/burnout/${userId}`)

export const scanSlaViolations = () =>
  apiPostRaw<any>(`/risk/scan-sla`)

// ── Capacity Planning ───────────────────────────────────────────────
export const getCapacityForecast = (department?: string) =>
  apiFetchRaw<any>(`/capacity/forecast${department ? `?department=${department}` : ""}`)

export const getSuccessionRisk = () =>
  apiFetchRaw<any>(`/capacity/succession-risk`)

// ── Gamification ────────────────────────────────────────────────────
export const getGlobalLeaderboard = () =>
  apiFetchRaw<any>(`/gamification/leaderboard`)

export const getTeamLeaderboard = () =>
  apiFetchRaw<any>(`/gamification/team-leaderboard`)

export const getMyPoints = () =>
  apiFetchRaw<any>(`/gamification/my-points`)

export const getMyTransactions = () =>
  apiFetchRaw<any>(`/gamification/my-transactions`)

// ── Talent Search ───────────────────────────────────────────────────
export const searchTalent = (skills: string, minProficiency = 0, department?: string) => {
  const params = new URLSearchParams({ skills })
  if (minProficiency > 0) params.set("min_proficiency", String(minProficiency))
  if (department) params.set("department", department)
  return apiFetchRaw<any>(`/talent/search?${params}`)
}

// ── Dependencies ────────────────────────────────────────────────────
export const getTaskDependencies = (taskId: number) =>
  apiFetchRaw<any>(`/dependencies/task/${taskId}`)

export const addDependency = (taskId: number, dependsOnId: number) =>
  apiPostRaw<any>(`/dependencies/add?task_id=${taskId}&depends_on_id=${dependsOnId}`)

export const getImpactAnalysis = (taskId: number) =>
  apiFetchRaw<any>(`/dependencies/impact-analysis/${taskId}`)

// ── Skill Intelligence ──────────────────────────────────────────────
export const uploadResume = (file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getStoredToken()
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`

  return fetch(`${API_URL}/skills/upload-resume`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`API error ${res.status}`)
    }
    return res.json()
  })
}

export const getSkillProfile = (userId: number) =>
  apiFetchRaw<any>(`/skills/profile/${userId}`)

export const getLearningRecommendations = (userId: number) =>
  apiFetchRaw<any>(`/skills/learning-recommendations/${userId}`)

// ── Targets & Tasks ─────────────────────────────────────────────────
export const createTarget = (data: any) =>
  apiPostRaw<any>(`/targets`, data)

export const listTargets = () =>
  apiFetchRaw<any[]>(`/targets`)

export const createTask = (data: any) =>
  apiPostRaw<any>(`/tasks`, data)

export const listTasks = (targetId?: number) =>
  apiFetchRaw<any[]>(targetId ? `/tasks?target_id=${targetId}` : `/tasks`)

export const autoAssignTask = (taskId: number, aiProvider = "gemini", aiModel = "gemini-1.5-flash") =>
  apiPostRaw<any>(`/tasks/${taskId}/auto-assign?ai_provider=${aiProvider}&ai_model=${aiModel}`)

export const updateTarget = (targetId: number, data: any) =>
  apiPutRaw<any>(`/targets/${targetId}`, data)

export const deleteTarget = (targetId: number) =>
  apiDeleteRaw(`/targets/${targetId}`)

export const updateTask = (taskId: number, data: any) =>
  apiPutRaw<any>(`/tasks/${taskId}`, data)

export const deleteTask = (taskId: number) =>
  apiDeleteRaw(`/tasks/${taskId}`)
