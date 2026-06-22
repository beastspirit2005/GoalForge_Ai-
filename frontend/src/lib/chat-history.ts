/** Role-scoped chat sessions stored only in the browser (localStorage). */

export type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
  source?: string
}

export type ChatSession = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export type ChatStore = {
  activeSessionId: string
  sessions: ChatSession[]
}

const ROLES = ["employee", "manager", "admin", "super_admin"] as const
export type AppRole = (typeof ROLES)[number]

function storageKey(email: string, role: string): string {
  return `gf_ai_sessions_${email}_${role}`
}

function newId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function createSession(greeting: string): ChatSession {
  const now = Date.now()
  return {
    id: newId(),
    title: "New chat",
    messages: [{ role: "assistant", content: greeting, source: "system" }],
    createdAt: now,
    updatedAt: now,
  }
}

export function loadChatStore(email: string, role: string, greeting: string): ChatStore {
  if (typeof window === "undefined") {
    const session = createSession(greeting)
    return { activeSessionId: session.id, sessions: [session] }
  }

  const raw = localStorage.getItem(storageKey(email, role))
  if (!raw) {
    const session = createSession(greeting)
    return { activeSessionId: session.id, sessions: [session] }
  }

  try {
    const parsed = JSON.parse(raw) as ChatStore
    if (parsed.sessions?.length && parsed.activeSessionId) {
      return parsed
    }
  } catch {
    /* fall through */
  }

  const session = createSession(greeting)
  return { activeSessionId: session.id, sessions: [session] }
}

export function saveChatStore(email: string, role: string, store: ChatStore): void {
  localStorage.setItem(storageKey(email, role), JSON.stringify(store))
}

export function deleteChatStore(email: string, role: string): void {
  localStorage.removeItem(storageKey(email, role))
}

/** List session index keys for all roles (for settings / privacy UI). */
export function listRoleSessionCounts(email: string): Record<AppRole, number> {
  const counts: Record<AppRole, number> = { employee: 0, manager: 0, admin: 0, super_admin: 0 }
  for (const role of ROLES) {
    const store = loadChatStore(email, role, "")
    counts[role] = store.sessions.length
  }
  return counts
}

export function sessionTitleFromMessage(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ")
  if (!clean) return "New chat"
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean
}

export function getActiveSession(store: ChatStore): ChatSession | undefined {
  return store.sessions.find((s) => s.id === store.activeSessionId)
}

export function updateSessionMessages(
  store: ChatStore,
  sessionId: string,
  messages: ChatMessage[],
  title?: string
): ChatStore {
  const now = Date.now()
  const sessions = store.sessions.map((s) =>
    s.id === sessionId
      ? {
          ...s,
          messages,
          title: title ?? s.title,
          updatedAt: now,
        }
      : s
  )
  return { ...store, sessions }
}

export function addSession(store: ChatStore, session: ChatSession): ChatStore {
  return {
    activeSessionId: session.id,
    sessions: [session, ...store.sessions],
  }
}

export function removeSession(store: ChatStore, sessionId: string, greeting: string): ChatStore {
  const remaining = store.sessions.filter((s) => s.id !== sessionId)
  if (remaining.length === 0) {
    const fresh = createSession(greeting)
    return { activeSessionId: fresh.id, sessions: [fresh] }
  }
  const activeSessionId =
    store.activeSessionId === sessionId ? remaining[0].id : store.activeSessionId
  return { activeSessionId, sessions: remaining }
}

export function setActiveSession(store: ChatStore, sessionId: string): ChatStore {
  return { ...store, activeSessionId: sessionId }
}

export { ROLES }
