import { apiFetch } from "@/lib/api"
import { getStoredToken } from "./auth.service"

export interface CheckinPayload {
  goal_id: number
  quarter: string
  actual_achievement: number
  progress_status: string
  notes?: string
}

export interface Checkin {
  id: number
  goal_id: number
  user_id: number
  quarter: string
  actual_achievement: number
  progress_status: string
  notes: string | null
  manager_comment: string | null
  created_at: string | null
}

function token() {
  return getStoredToken()
}

export async function getCheckins(): Promise<Checkin[]> {
  return apiFetch<Checkin[]>("/checkins/", { token: token() })
}

export async function createCheckin(data: CheckinPayload): Promise<Checkin> {
  return apiFetch<Checkin>("/checkins/", { method: "POST", body: data, token: token() })
}

export async function updateCheckin(
  id: number,
  data: Partial<CheckinPayload & { manager_comment: string }>,
): Promise<Checkin> {
  return apiFetch<Checkin>(`/checkins/${id}`, { method: "PUT", body: data, token: token() })
}
