export interface DepartmentStat {
  name: string
  progress: number
  goals: number
}

export interface MomentumPoint {
  week: string
  value: number
}

export interface RiskBucket {
  risk: string
  count: number
}

export interface AnalyticsOverview {
  total_users: number
  total_goals: number
  avg_progress: number
  overdue_checkins: number
}

export interface AuditLogEntry {
  id: number
  user_id: number
  action: string
  entity_type: string
  entity_id: number
  old_value: string | null
  new_value: string | null
  created_at: string | null
  user_name?: string
}
