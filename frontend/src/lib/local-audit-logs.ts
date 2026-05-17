"use client"

const LOCAL_AUDIT_LOGS_KEY = "goalforge.demo.auditlogs"

export type AuditLog = {
  id: number | string
  user: string
  action: string
  entity: string
  entityId: number | string
  date: string
  detail: string
}

export const initialLogs: AuditLog[] = [
  { id: 1, user: "Priya Nair", action: "goal_approved", entity: "goal", entityId: 101, date: "16 May 2026 09:14", detail: "Approved 'Launch AI onboarding playbook'" },
  { id: 2, user: "Rohan Kapoor", action: "user_updated", entity: "user", entityId: 5, date: "15 May 2026 17:30", detail: "Changed role from employee to manager" },
  { id: 3, user: "Aarav Mehta", action: "goal_created", entity: "goal", entityId: 124, date: "15 May 2026 14:22", detail: "Created 'Grow enterprise pipeline'" },
  { id: 4, user: "Priya Nair", action: "goal_rejected", entity: "goal", entityId: 119, date: "14 May 2026 11:05", detail: "Rejected 'Improve team morale' — needs measurable target" },
  { id: 5, user: "Rohan Kapoor", action: "goal_unlocked", entity: "goal", entityId: 101, date: "13 May 2026 16:42", detail: "Unlocked goal for re-editing" },
  { id: 6, user: "Neha Rao", action: "goal_submitted", entity: "goal", entityId: 117, date: "13 May 2026 10:18", detail: "Submitted 'Improve sprint delivery' for approval" },
  { id: 7, user: "Kabir Singh", action: "goal_updated", entity: "goal", entityId: 124, date: "12 May 2026 09:50", detail: "Updated target from 25 to 35 opportunities" },
]

export function getLocalAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return initialLogs
  try {
    const raw = window.localStorage.getItem(LOCAL_AUDIT_LOGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return initialLogs
}

export function addLocalAuditLog(log: Omit<AuditLog, "id" | "date">) {
  if (typeof window === "undefined") return
  
  const current = getLocalAuditLogs()
  
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).replace(",", "")

  const newLog: AuditLog = {
    ...log,
    id: Date.now(),
    date: dateStr,
  }
  
  window.localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify([newLog, ...current]))
  
  window.dispatchEvent(new Event("audit-logs-updated"))
}
