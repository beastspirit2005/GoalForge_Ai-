import { apiFetch } from "@/lib/api"
import { getStoredToken } from "./auth.service"
import type { AnalyticsOverview, AuditLogEntry, DepartmentStat, MomentumPoint, RiskBucket } from "@/types/analytics"

function token() {
  return getStoredToken()
}

export async function getOverview(): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>("/analytics/overview", { token: token() })
}

export async function getDepartments(): Promise<DepartmentStat[]> {
  return apiFetch<DepartmentStat[]>("/analytics/departments", { token: token() })
}

export async function getMomentum(): Promise<MomentumPoint[]> {
  return apiFetch<MomentumPoint[]>("/analytics/momentum", { token: token() })
}

export async function getRiskDistribution(): Promise<RiskBucket[]> {
  return apiFetch<RiskBucket[]>("/analytics/risk-distribution", { token: token() })
}

// ── Admin ──────────────────────────────────────────────────
export async function getAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
  return apiFetch<AuditLogEntry[]>(`/admin/audit-logs?limit=${limit}`, { token: token() })
}

export async function getUsers() {
  return apiFetch("/admin/users", { token: token() })
}

export async function updateUser(id: number, data: Record<string, unknown>) {
  return apiFetch(`/admin/users/${id}`, { method: "PUT", body: data, token: token() })
}
