export type GoalStatus = "draft" | "pending" | "approved" | "rejected" | "locked" | "completed"
export type GoalRisk = "Low" | "Medium" | "High"

export interface Milestone {
  id: number
  goal_id: number
  title: string
  due_date: string | null
  is_completed: boolean
  source: "ai" | "manual"
}

export interface Goal {
  id: number
  user_id: number
  title: string
  description: string | null
  target: string | null
  uom: string | null
  weightage: number
  deadline: string | null
  status: GoalStatus
  progress: number
  risk: GoalRisk
  is_shared: boolean
  ai_recommendation: string | null
  created_at: string | null
  updated_at: string | null
  owner_name: string | null
  department: string | null
  milestones: Milestone[]
}

export interface GoalCreatePayload {
  title: string
  description?: string
  target?: string
  uom?: string
  weightage: number
  deadline?: string
}

export interface GoalUpdatePayload {
  title?: string
  description?: string
  target?: string
  uom?: string
  weightage?: number
  deadline?: string
  progress?: number
}

export interface GoalApprovalPayload {
  action: "approve" | "reject"
  comment?: string
  weightage?: number
  target?: string
}
