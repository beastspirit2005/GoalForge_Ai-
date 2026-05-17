export const APP_NAME = "GoalForge AI"

export const ROLE_LABELS: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "Admin / HR",
}

export const ROLE_COLORS: Record<string, string> = {
  employee: "bg-sky-100 text-sky-700",
  manager: "bg-emerald-100 text-emerald-700",
  admin: "bg-violet-100 text-violet-700",
}

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  locked: "bg-violet-100 text-violet-700",
  completed: "bg-sky-100 text-sky-700",
}

export const RISK_COLORS: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
}

export const MAX_GOALS = 8
export const MIN_WEIGHTAGE = 10
export const TARGET_WEIGHTAGE = 100
