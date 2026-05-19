"use client"

export type NotificationType = "info" | "success" | "warning" | "error"

export type Notification = {
  id: string
  title: string
  message: string
  date: string
  read: boolean
  type: NotificationType
  recipientRole: "employee" | "manager" | "admin"
}

const NOTIFICATIONS_KEY = "goalforge.demo.notifications"

export function getLocalNotifications(): Notification[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLocalNotifications(notifications: Notification[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  window.dispatchEvent(new Event("notifications-updated"))
}

export function addLocalNotification(
  notification: Omit<Notification, "id" | "date" | "read">
) {
  if (typeof window === "undefined") return

  const current = getLocalNotifications()
  
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(",", " at")

  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: dateStr,
    read: false
  }

  saveLocalNotifications([newNotification, ...current])
}

export function markAllAsRead(role: "employee" | "manager" | "admin") {
  const current = getLocalNotifications()
  const updated = current.map(n => {
    if (n.recipientRole === role) {
      return { ...n, read: true }
    }
    return n
  })
  saveLocalNotifications(updated)
}

export function markAsRead(id: string) {
  const current = getLocalNotifications()
  const updated = current.map(n => {
    if (n.id === id) {
      return { ...n, read: true }
    }
    return n
  })
  saveLocalNotifications(updated)
}
