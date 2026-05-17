export type UserRole = "employee" | "manager" | "admin"

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  department: string | null
  manager_id: number | null
  is_active: boolean
  profile_picture_url?: string | null
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role?: UserRole
  department?: string
}

export interface LoginPayload {
  email: string
  password: string
}
