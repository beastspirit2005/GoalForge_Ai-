export type DemoRole = "employee" | "manager" | "admin" | "super_admin"

export type DemoUser = {
  name: string
  email: string
  role: DemoRole
  avatar: string
  department?: string
  profile_picture_url?: string | null
}

const SESSION_KEY = "goalforge.demo.session"

export const demoUsers: Record<DemoRole, DemoUser> = {
  employee: {
    name: "Aarav Mehta",
    email: "employee@example.com",
    role: "employee",
    avatar: "AM",
    department: "People Ops",
    profile_picture_url: null,
  },
  manager: {
    name: "Priya Nair",
    email: "manager@example.com",
    role: "manager",
    avatar: "PN",
    department: "Engineering",
    profile_picture_url: null,
  },
  admin: {
    name: "Rohan Kapoor",
    email: "admin@example.com",
    role: "admin",
    avatar: "RK",
    department: "HR",
    profile_picture_url: null,
  },
  super_admin: {
    name: "System Admin",
    email: "superadmin@example.com",
    role: "super_admin",
    avatar: "SA",
    department: "IT",
    profile_picture_url: null,
  },
}

export function getDemoSession() {
  if (typeof window === "undefined") {
    return null
  }

  const rawSession = window.localStorage.getItem(SESSION_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as DemoUser
  } catch {
    window.localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function setDemoSession(role: DemoRole) {
  const user = demoUsers[role]
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function updateDemoSession(updates: Partial<Pick<DemoUser, "name" | "department" | "profile_picture_url">>) {
  const current = getDemoSession()

  if (!current) {
    return null
  }

  const nextUser: DemoUser = {
    ...current,
    ...updates,
    avatar: updates.name
      ? updates.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
      : current.avatar,
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
  return nextUser
}

export function clearDemoSession() {
  window.localStorage.removeItem(SESSION_KEY)
}

export function roleHome(role: DemoRole) {
  if (role === "manager") {
    return "/manager/dashboard"
  }

  if (role === "admin" || role === "super_admin") {
    return "/admin/org-analytics"
  }

  return "/employee/dashboard"
}

export function isRoleAllowed(pathname: string, role: DemoRole) {
  if (role === "super_admin") return true;

  if (pathname === "/employee/settings" || pathname.startsWith("/employee/settings/")) {
    return role === "employee" || role === "manager" || role === "admin"
  }

  if (pathname.startsWith("/employee")) {
    return role === "employee"
  }

  if (pathname.startsWith("/manager")) {
    return role === "manager"
  }

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/system-settings" || pathname === "/admin/platform-health") {
      return false // super_admin already returned true on line 114
    }
    return role === "admin"
  }

  return true
}
