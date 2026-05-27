"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  Bot,
  X,
  Send,
  User,
  Sparkles,
  Settings,
  Sliders,
  Cpu,
  AlertTriangle,
  MessageSquarePlus,
  Trash2,
  ShieldAlert,
  Key,
  PanelLeftClose,
  PanelLeft,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { getStoredToken } from "@/services/auth.service"
import { useAuth } from "@/hooks/useAuth"
import { GEMINI_KEY_CHANGED_EVENT, type GeminiKeyMode } from "@/lib/gemini-storage"
import {
  type ChatMessage,
  type ChatSession,
  type ChatStore,
  type AppRole,
  ROLES,
  loadChatStore,
  saveChatStore,
  deleteChatStore,
  createSession,
  getActiveSession,
  updateSessionMessages,
  addSession,
  removeSession,
  setActiveSession,
  sessionTitleFromMessage,
} from "@/lib/chat-history"

const getGreeting = (role: string) => {
  if (role === "admin") {
    return "Hi Admin! I'm your Executive AI Buddy. I can help you monitor goal progress, active performance cycles, system-wide escalations, and leaderboard stats. Ask me anything to assist you with your administrative work today!"
  }
  if (role === "manager") {
    return "Hi Manager! I'm your Team Performance Copilot. I can help you monitor team goals, track progress, review pending approvals, and resolve high-risk items. How can I help you support your team today?"
  }
  return "Hi! I'm Ai Buddy, your enterprise performance coach. How can I help you with your goals today?"
}

const roleLabels: Record<AppRole, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "Admin",
}

const getClientFallbackAdvice = (query: string): { response: string; source: string } => {
  const lowered = query.toLowerCase()
  let response = ""
  if (lowered.includes("risk") || lowered.includes("block")) {
    response = 
      "**Offline Fallback Advice (Risk & Blockers)**:\n\n" +
      "- **Review High-Risk Work**: Identify goals with progress significantly behind schedule.\n" +
      "- **Isolate Blockers**: Determine if the issue is resource constraints, technical hurdles, or third-party dependencies.\n" +
      "- **Define a Next Action**: Outline one single, measurable task to execute by the end of this week to reduce risk.\n" +
      "- **Update Manager & Log Check-ins**: Clear communications in check-ins prevent deadline surprises."
  } else if (lowered.includes("summary") || lowered.includes("team")) {
    response = 
      "**Offline Fallback Advice (Team Performance)**:\n\n" +
      "- **Compare Team Progress**: Benchmark active goal completion rates across team members.\n" +
      "- **Track Check-in Streaks**: Celebrate team members with high check-in consistency.\n" +
      "- **Address Critical Areas**: Focus immediate support on high-risk milestones.\n" +
      "- **Routine Review**: Host quick Friday check-ins to unlock stuck milestones."
  } else {
    response = 
      "**Offline Fallback Advice (Goal Execution)**:\n\n" +
      "- **Milestone Strategy**: Always divide a target goal into 3 to 5 smaller, measurable milestones.\n" +
      "- **UOM Metrics**: Focus on highly quantifiable targets (e.g. '$10K revenue' or '5 code reviews') rather than vague statements.\n" +
      "- **Bi-weekly Check-ins**: Check-in twice a week with concise actual accomplishments to maintain strong momentum."
  }
  return {
    response,
    source: "fallback",
  }
}

const OLLAMA_COOLDOWN_MS = 12000 // 12 seconds cooldown to prevent CPU/GPU overload

export function AiBuddyChat() {
  const { user } = useAuth()
  const accountRole = user ? ("role" in user ? user.role : "employee") : "employee"
  const email = user?.email || ""

  const [isOpen, setIsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [historyRole, setHistoryRole] = useState<AppRole>(
    (ROLES.includes(accountRole as AppRole) ? accountRole : "employee") as AppRole
  )
  const [chatStore, setChatStore] = useState<ChatStore | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [activeProvider, setActiveProvider] = useState<"gemini" | "ollama" | "fallback">("gemini")
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [selectedOllamaModel, setSelectedOllamaModel] = useState("")

  const [ollamaCooldownRemaining, setOllamaCooldownRemaining] = useState(0)
  const lastOllamaTimeRef = useRef<number>(0)

  const [geminiKeyMode, setGeminiKeyModeState] = useState<GeminiKeyMode>("app")
  const [customKeyInput, setCustomKeyInput] = useState("")
  const [showCustomKey, setShowCustomKey] = useState(false)
  const [keySaveMessage, setKeySaveMessage] = useState("")

  const [saveHistory, setSaveHistory] = useState(true)
  const [isDeletedFeedback, setIsDeletedFeedback] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const contextCacheRef = useRef<Record<string, string>>({})

  const greeting = useMemo(() => getGreeting(historyRole), [historyRole])
  const activeSession = chatStore ? getActiveSession(chatStore) : undefined
  const messages = activeSession?.messages ?? []
  const isViewingOwnRole = historyRole === accountRole

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const persistStore = useCallback(
    (store: ChatStore) => {
      if (!email || !saveHistory) return
      saveChatStore(email, historyRole, store)
    },
    [email, historyRole, saveHistory]
  )

  const loadStoreForRole = useCallback(
    (role: AppRole) => {
      if (!email) return
      const store = loadChatStore(email, role, getGreeting(role))
      setChatStore(store)
    },
    [email]
  )

  useEffect(() => {
    const savedProvider = localStorage.getItem("aiBuddyProvider") as "gemini" | "ollama" | "fallback"
    if (savedProvider) setActiveProvider(savedProvider)
    const savedOllama = localStorage.getItem("aiBuddyOllamaModel")
    if (savedOllama) setSelectedOllamaModel(savedOllama)
    const storedMode = localStorage.getItem("gf_gemini_key_mode")
    setGeminiKeyModeState(storedMode === "custom" ? "custom" : "app")
    const isSaved = localStorage.getItem("gf_gemini_custom_key_saved") === "true"
    setCustomKeyInput(isSaved ? "••••••••••••••••••••" : "")

    const refreshGeminiKeyState = () => {
      const storedMode = localStorage.getItem("gf_gemini_key_mode")
      setGeminiKeyModeState(storedMode === "custom" ? "custom" : "app")
      const isSaved = localStorage.getItem("gf_gemini_custom_key_saved") === "true"
      setCustomKeyInput(isSaved ? "••••••••••••••••••••" : "")
    }

    const handleStorageChange = () => refreshGeminiKeyState()
    const handleFocus = () => refreshGeminiKeyState()
    const handleKeyChanged = () => refreshGeminiKeyState()

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("focus", handleFocus)
    window.addEventListener(GEMINI_KEY_CHANGED_EVENT, handleKeyChanged)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener(GEMINI_KEY_CHANGED_EVENT, handleKeyChanged)
    }
  }, [])

  useEffect(() => {
    if (!email) return
    loadStoreForRole(historyRole)
    const savedToggle = localStorage.getItem(`aiBuddySaveHistory_${email}`)
    setSaveHistory(savedToggle !== "false")
  }, [email, historyRole, loadStoreForRole])

  useEffect(() => {
    if (accountRole && ROLES.includes(accountRole as AppRole)) {
      setHistoryRole(accountRole as AppRole)
    }
  }, [accountRole])

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("http://localhost:11434/api/tags")
        if (res.ok) {
          const data = await res.json()
          const models = data.models?.map((m: any) => m.name) || []
          if (models.length > 0) {
            setOllamaModels(models)
            if (!localStorage.getItem("aiBuddyOllamaModel")) {
              setSelectedOllamaModel(models[0])
            }
          }
        }
      } catch {
        console.log('[AI Buddy] Local Ollama not available')
      }
    }
    fetchModels()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    localStorage.setItem("aiBuddyProvider", activeProvider)
  }, [activeProvider])

  useEffect(() => {
    if (selectedOllamaModel) localStorage.setItem("aiBuddyOllamaModel", selectedOllamaModel)
  }, [selectedOllamaModel])

  useEffect(() => {
    if (ollamaCooldownRemaining <= 0) return
    const timer = setInterval(() => {
      setOllamaCooldownRemaining((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [ollamaCooldownRemaining])

  const fetchCopilotContext = async (): Promise<string> => {
    const cacheKey = `${email}_${accountRole}`
    if (contextCacheRef.current[cacheKey]) {
      return contextCacheRef.current[cacheKey]
    }
    const token = getStoredToken()
    try {
      const res = await apiFetch<{ context: string }>("/ai/copilot-context", { token })
      contextCacheRef.current[cacheKey] = res.context
      return res.context
    } catch (e) {
      console.warn("Failed to fetch copilot context", e)
      return "Context unavailable."
    }
  }

  const selectCustomKeyMode = () => {
    const isSaved = localStorage.getItem("gf_gemini_custom_key_saved") === "true"
    if (isSaved) {
      localStorage.setItem("gf_gemini_key_mode", "custom")
      setGeminiKeyModeState("custom")
      setKeySaveMessage("Your key is stored securely in this browser.")
    } else {
      localStorage.setItem("gf_gemini_key_mode", "custom")
      setGeminiKeyModeState("custom")
      setKeySaveMessage("Paste your key below, then click Save.")
    }
  }

  const runBackendCopilot = async (
    query: string,
    provider: "gemini" | "ollama" | "fallback",
    model?: string,
    apiKey?: string
  ) => {
    const token = getStoredToken()
    return apiFetch<{ response: string; source: string }>("/ai/copilot", {
      method: "POST",
      token,
      body: {
        query,
        context: "",
        provider,
        model: provider === "ollama" ? model : undefined,
        api_key: apiKey || undefined,
      },
    })
  }

  const applyMessages = useCallback(
    (nextMessages: ChatMessage[], title?: string) => {
      if (!chatStore || !activeSession) return
      const updated = updateSessionMessages(chatStore, activeSession.id, nextMessages, title)
      setChatStore(updated)
      persistStore(updated)
    },
    [chatStore, activeSession, persistStore]
  )

  const handleNewChat = useCallback(() => {
    if (!email) return
    const session = createSession(greeting)
    const base = chatStore ?? loadChatStore(email, historyRole, greeting)
    const updated = addSession(base, session)
    setChatStore(updated)
    persistStore(updated)
  }, [email, greeting, historyRole, chatStore, persistStore])

  const handleSelectSession = (sessionId: string) => {
    if (!chatStore) return
    const updated = setActiveSession(chatStore, sessionId)
    setChatStore(updated)
    persistStore(updated)
  }

  const handleDeleteSession = (sessionId: string) => {
    if (!chatStore) return
    const updated = removeSession(chatStore, sessionId, greeting)
    setChatStore(updated)
    persistStore(updated)
  }

  const handleDeleteAllForRole = () => {
    if (!email) return
    deleteChatStore(email, historyRole)
    const fresh = loadChatStore(email, historyRole, greeting)
    setChatStore(fresh)
    setIsDeletedFeedback(true)
    setTimeout(() => setIsDeletedFeedback(false), 2000)
  }

  const handleToggleSaveHistory = (enabled: boolean) => {
    setSaveHistory(enabled)
    if (email) {
      localStorage.setItem(`aiBuddySaveHistory_${email}`, String(enabled))
      if (!enabled) deleteChatStore(email, historyRole)
      else if (chatStore) persistStore(chatStore)
    }
  }

  const handleSaveCustomKey = async () => {
    const key = customKeyInput.trim()
    if (!key || key.startsWith("•••")) {
      setKeySaveMessage("Enter a valid Gemini API key first.")
      return
    }
    try {
      const res = await fetch("/api/ai/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      })
      if (!res.ok) throw new Error("Failed to secure key on server.")
      
      localStorage.setItem("gf_gemini_key_mode", "custom")
      localStorage.setItem("gf_gemini_custom_key_saved", "true")
      setGeminiKeyModeState("custom")
      setCustomKeyInput("••••••••••••••••••••")
      setKeySaveMessage("Key stored securely in httpOnly cookie.")
      setTimeout(() => setKeySaveMessage(""), 3000)
      window.dispatchEvent(new Event(GEMINI_KEY_CHANGED_EVENT))
    } catch (err: any) {
      setKeySaveMessage(`Failed to save key: ${err.message}`)
    }
  }

  const handleUseAppKey = async () => {
    try {
      const res = await fetch("/api/ai/key", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to clear key on server.")

      localStorage.setItem("gf_gemini_key_mode", "app")
      localStorage.removeItem("gf_gemini_custom_key_saved")
      setGeminiKeyModeState("app")
      setCustomKeyInput("")
      setKeySaveMessage("Using the app Gemini key.")
      setTimeout(() => setKeySaveMessage(""), 3000)
      window.dispatchEvent(new Event(GEMINI_KEY_CHANGED_EVENT))
    } catch (err: any) {
      setKeySaveMessage(`Failed to clear key: ${err.message}`)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isViewingOwnRole) return

    const userMessage = input.trim()
    setInput("")
    const withUser = [...messages, { role: "user" as const, content: userMessage }]
    const title =
      activeSession?.title === "New chat"
        ? sessionTitleFromMessage(userMessage)
        : activeSession?.title
    applyMessages(withUser, title)
    setIsLoading(true)

    try {
      let res: { response: string; source: string }

      if (activeProvider === "fallback") {
        res = getClientFallbackAdvice(userMessage)
      } else if (activeProvider === "ollama") {
        const now = Date.now()
        const timePassed = now - lastOllamaTimeRef.current
        if (timePassed < OLLAMA_COOLDOWN_MS) {
          const waitSec = Math.ceil((OLLAMA_COOLDOWN_MS - timePassed) / 1000)
          setOllamaCooldownRemaining(waitSec)
          res = {
            response: `Cooldown active: Please wait **${waitSec} seconds** before sending another message to your local offline model. This protective limit prevents high CPU/GPU load on your machine.`,
            source: "system-cooldown"
          }
          applyMessages(
            [...withUser, { role: "assistant", content: res.response, source: res.source }],
            title
          )
          setIsLoading(false)
          return
        }
        
        lastOllamaTimeRef.current = now
        setOllamaCooldownRemaining(Math.ceil(OLLAMA_COOLDOWN_MS / 1000))

        const context = await fetchCopilotContext()
        const prompt = `You are 'Ai Buddy', an intelligent enterprise performance coach.\nYour job is to assist employees or managers with their goals, priorities, and performance.\n\nContext about the user's current state (goals, milestones, checkins, etc):\n${context}\n\nUser Query:\n${userMessage}\n\nRespond in a helpful, conversational, and professional tone. Keep it concise, actionable, and formatted in Markdown. Focus entirely on the user's performance and the provided context. If they ask a general question, guide it back to their goals.`
        
        const directRes = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            model: selectedOllamaModel || ollamaModels[0] || "llama3",
            prompt: prompt,
            stream: false,
            options: {
              num_predict: 250, // Limit generated tokens
              num_ctx: 2048,    // Restrict context window size to save RAM/VRAM
            }
          }),
        })
        if (!directRes.ok) throw new Error("Local Ollama is not responding")
        const data = await directRes.json()
        res = { response: data.response, source: `ollama (${selectedOllamaModel || "llama3"})` }
      } else {
        res = await runBackendCopilot(
          userMessage,
          activeProvider,
          undefined
        )
      }

      applyMessages(
        [...withUser, { role: "assistant", content: res.response, source: res.source }],
        title
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      applyMessages(
        [
          ...withUser,
          {
            role: "assistant",
            content: `Oops! I encountered an error with ${activeProvider}: ${msg}. Would you like to try switching to another provider?`,
            source: `error-${activeProvider}`,
          },
        ],
        title
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchProvider = async (newProvider: "gemini" | "ollama" | "fallback") => {
    setActiveProvider(newProvider)
    const userMessages = messages.filter((m) => m.role === "user")
    if (userMessages.length === 0) return
    const lastQuery = userMessages[userMessages.length - 1].content
    setIsLoading(true)
    applyMessages([
      ...messages,
      {
        role: "assistant",
        content: `Rerouting your request to **${newProvider.toUpperCase()}**...`,
        source: "system",
      },
    ])

    try {
      let res: { response: string; source: string }

      if (newProvider === "fallback") {
        res = getClientFallbackAdvice(lastQuery)
      } else if (newProvider === "ollama") {
        const now = Date.now()
        const timePassed = now - lastOllamaTimeRef.current
        if (timePassed < OLLAMA_COOLDOWN_MS) {
          const waitSec = Math.ceil((OLLAMA_COOLDOWN_MS - timePassed) / 1000)
          setOllamaCooldownRemaining(waitSec)
          applyMessages([
            ...messages,
            {
              role: "assistant",
              content: `Ollama Cooldown Active: Please wait **${waitSec} seconds** before switching providers again to protect your local PC from heavy processor load.`,
              source: `system-cooldown`,
            },
          ])
          setIsLoading(false)
          return
        }

        lastOllamaTimeRef.current = now
        setOllamaCooldownRemaining(Math.ceil(OLLAMA_COOLDOWN_MS / 1000))

        let localModel = selectedOllamaModel
        if (!localModel && ollamaModels.length > 0) {
          localModel = ollamaModels[0]
          setSelectedOllamaModel(localModel)
        }
        const context = await fetchCopilotContext()
        const prompt = `You are 'Ai Buddy', an intelligent enterprise performance coach.\nYour job is to assist employees or managers with their goals, priorities, and performance.\n\nContext about the user's current state (goals, milestones, checkins, etc):\n${context}\n\nUser Query:\n${lastQuery}\n\nRespond in a helpful, conversational, and professional tone. Keep it concise, actionable, and formatted in Markdown. Focus entirely on the user's performance and the provided context. If they ask a general question, guide it back to their goals.`
        
        const directRes = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            model: localModel || "llama3",
            prompt: prompt,
            stream: false,
            options: {
              num_predict: 250, // Limit maximum returned tokens
              num_ctx: 2048,    // Limit context window size to save RAM/VRAM
            }
          }),
        })
        if (!directRes.ok) throw new Error("Local Ollama is not responding")
        const data = await directRes.json()
        res = { response: data.response, source: `ollama (${localModel || "llama3"})` }
      } else {
        res = await runBackendCopilot(
          lastQuery,
          newProvider,
          undefined
        )
      }
      applyMessages([...messages, { role: "assistant", content: res.response, source: res.source }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      applyMessages([
        ...messages,
        {
          role: "assistant",
          content: `Failed to connect to ${newProvider}: ${msg}.`,
          source: `error-${newProvider}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessageContent = (content: string) => {
    const lines = content.split("\n")
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          if (line.startsWith("### ") || line.startsWith("## ")) {
            const cleanText = line.replace(/^(###|##)\s+/, "")
            return (
              <h4 key={i} className="mt-3 mb-1 text-sm font-bold text-indigo-300">
                {parseBoldText(cleanText)}
              </h4>
            )
          }
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const cleanText = line.replace(/^\s*([-*])\s+/, "")
            return (
              <div key={i} className="ml-2 flex items-start gap-2 text-xs leading-relaxed text-slate-100">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <span>{parseBoldText(cleanText)}</span>
              </div>
            )
          }
          if (!line.trim()) return <div key={i} className="h-1" />
          return (
            <p key={i} className="text-xs leading-relaxed text-slate-100">
              {parseBoldText(line)}
            </p>
          )
        })}
      </div>
    )
  }

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/)
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold text-indigo-200">
          {part}
        </strong>
      ) : (
        part
      )
    )
  }

  const sortedSessions = [...(chatStore?.sessions ?? [])].sort(
    (a, b) => b.updatedAt - a.updatedAt
  )

  return (
    <div className="fixed-dark fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div
          className={`relative glass-panel mb-4 flex h-[560px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#020617]/95 shadow-2xl transition-all duration-300 ease-in-out animate-scale-in ${
            showHistory ? "w-[min(92vw,680px)]" : "w-[min(92vw,420px)]"
          }`}
        >
          <div className="flex min-h-0 flex-1">
            {/* Chat history sidebar */}
            {showHistory && (
              <aside className="flex w-[200px] shrink-0 flex-col border-r border-slate-800 bg-[#070b19]/95">
                <div className="border-b border-slate-800 p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <History className="h-3.5 w-3.5" />
                    Past chats
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setHistoryRole(r)}
                        className={`rounded-md px-2 py-0.5 text-[9px] font-semibold capitalize transition-colors ${
                          historyRole === r
                            ? "bg-indigo-600/40 text-indigo-200"
                            : "bg-slate-800/80 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {roleLabels[r]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                  {sortedSessions.map((session: ChatSession) => (
                    <div
                      key={session.id}
                      className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-left transition-colors ${
                        chatStore?.activeSessionId === session.id
                          ? "bg-indigo-600/25 text-indigo-100"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-[11px] font-medium text-left"
                        onClick={() => handleSelectSession(session.id)}
                      >
                        {session.title}
                      </button>
                      {isViewingOwnRole && (
                        <button
                          type="button"
                          aria-label="Delete chat"
                          onClick={() => handleDeleteSession(session.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isViewingOwnRole && (
                  <div className="border-t border-slate-800 p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleNewChat}
                      className="h-8 w-full justify-start gap-2 text-[11px] text-indigo-200 hover:bg-indigo-600/20 hover:text-indigo-100"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      New chat
                    </Button>
                  </div>
                )}
              </aside>
            )}

            {/* Main chat panel */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-[var(--gf-indigo)]/90 to-[var(--gf-violet)]/90 p-4">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:bg-white/10 hover:text-white"
                    onClick={() => setShowHistory(!showHistory)}
                    title={showHistory ? "Hide chat history" : "Show chat history"}
                  >
                    {showHistory ? (
                      <PanelLeftClose className="h-4 w-4" />
                    ) : (
                      <PanelLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <h3 className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-white">
                      Ai Buddy
                      <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-medium capitalize text-indigo-100">
                        {activeProvider}
                      </span>
                      {geminiKeyMode === "custom" && activeProvider === "gemini" && (
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-200">
                          your key
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-white/70">
                      {roleLabels[historyRole]} · {isViewingOwnRole ? "active" : "archive"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  {isViewingOwnRole && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
                      onClick={handleNewChat}
                      title="New Chat"
                    >
                      <MessageSquarePlus className="h-4.5 w-4.5 text-indigo-100" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-lg text-white/80 hover:text-white ${
                      showSettings ? "bg-white/15" : "hover:bg-white/10"
                    }`}
                    onClick={() => setShowSettings(!showSettings)}
                    title="AI Settings"
                  >
                    <Settings className="h-4.5 w-4.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>

              {showSettings && isViewingOwnRole && (
                <div className="absolute top-[65px] right-0 left-0 z-30 max-h-[70%] overflow-y-auto border-b border-slate-800 bg-[#070b19]/98 p-4 shadow-2xl backdrop-blur-md sm:left-[200px]">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <Key className="h-3.5 w-3.5 text-emerald-400" />
                        Gemini API key (browser only)
                      </label>
                      <p className="text-[10px] leading-relaxed text-slate-500">
                        Your key is stored in this browser only and is never sent to GoalForge servers.
                        Use the app key to rely on the centralized server configuration instead.
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={handleUseAppKey}
                          className={`rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                            geminiKeyMode === "app"
                              ? "border-indigo-500 bg-indigo-600/30 text-indigo-200"
                              : "border-slate-800 bg-slate-900/60 text-slate-400"
                          }`}
                        >
                          App key
                        </button>
                        <button
                          type="button"
                          onClick={selectCustomKeyMode}
                          className={`rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                            geminiKeyMode === "custom"
                              ? "border-emerald-500/50 bg-emerald-600/20 text-emerald-200"
                              : "border-slate-800 bg-slate-900/60 text-slate-400"
                          }`}
                        >
                          My key
                        </button>
                      </div>
                      {keySaveMessage && (
                        <p className="text-[10px] font-medium text-emerald-300">{keySaveMessage}</p>
                      )}
                      {geminiKeyMode === "custom" && (
                        <div className="space-y-2 animate-in fade-in">
                          <div className="relative">
                            <Input
                              type={showCustomKey ? "text" : "password"}
                              value={customKeyInput}
                              onChange={(e) => setCustomKeyInput(e.target.value)}
                              placeholder="Paste your Gemini API key"
                              className="h-9 border-slate-800 bg-slate-900 pr-16 text-xs text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCustomKey(!showCustomKey)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300"
                            >
                              {showCustomKey ? "Hide" : "Show"}
                            </button>
                          </div>
                          <Button
                            type="button"
                            onClick={handleSaveCustomKey}
                            className="h-8 w-full bg-emerald-600/80 text-xs hover:bg-emerald-600"
                          >
                            Save key in this browser
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                        AI engine
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(["gemini", "ollama", "fallback"] as const).map((prov) => (
                          <button
                            key={prov}
                            type="button"
                            onClick={() => setActiveProvider(prov)}
                            className={`rounded-lg border py-1.5 text-xs font-semibold capitalize transition-all ${
                              activeProvider === prov
                                ? "border-indigo-500 bg-indigo-600/30 text-indigo-200"
                                : "border-slate-800 bg-slate-900/60 text-slate-400"
                            }`}
                          >
                            {prov === "gemini" ? "Gemini" : prov === "ollama" ? "Ollama" : "Fallback"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeProvider === "ollama" && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <Sliders className="h-3.5 w-3.5" />
                          Local model
                        </label>
                        {ollamaModels.length > 0 ? (
                          <select
                            value={selectedOllamaModel}
                            onChange={(e) => setSelectedOllamaModel(e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-200"
                          >
                            {ollamaModels.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-[11px] text-amber-300">No local Ollama models detected.</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Privacy
                      </label>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300">Save chat history</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSaveHistory(!saveHistory)}
                          className={`relative inline-flex h-5 w-9 rounded-full ${
                            saveHistory ? "bg-indigo-600" : "bg-slate-800"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              saveHistory ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                      <Button
                        type="button"
                        onClick={handleDeleteAllForRole}
                        variant="outline"
                        className={`h-8 w-full text-[10px] ${
                          isDeletedFeedback
                            ? "border-emerald-500/30 text-emerald-300"
                            : "border-rose-500/20 text-rose-300"
                        }`}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        {isDeletedFeedback
                          ? "Cleared!"
                          : `Clear all ${roleLabels[historyRole]} chats`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!isViewingOwnRole && (
                <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] text-amber-200">
                  Viewing archived {roleLabels[historyRole]} chats — switch to your current role to send messages.
                </div>
              )}

              <div className="flex-1 overflow-y-auto bg-[#020617]/50 p-4 space-y-4 scrollbar-thin">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start space-x-3 ${
                      msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md ${
                        msg.role === "user"
                          ? "bg-slate-800 text-white"
                          : "border border-indigo-500/20 bg-indigo-600/25 text-indigo-300"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex max-w-[80%] flex-col">
                      <div
                        className={`rounded-2xl px-4 py-3 text-xs shadow-lg ${
                          msg.role === "user"
                            ? "rounded-tr-sm bg-slate-800 text-white"
                            : "rounded-tl-sm border border-indigo-500/15 bg-indigo-950/40 text-slate-100"
                        }`}
                      >
                        {renderMessageContent(msg.content)}
                        {msg.source === "error-gemini" && isViewingOwnRole && (
                          <div className="mt-3 flex flex-wrap gap-2 border-t border-indigo-500/10 pt-2.5">
                            <Button
                              size="sm"
                              onClick={() => handleSwitchProvider("ollama")}
                              className="h-auto rounded-lg border border-indigo-500/30 bg-indigo-600/30 px-2.5 py-1.5 text-[10px] text-indigo-200"
                            >
                              Switch to Ollama
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSwitchProvider("fallback")}
                              className="h-auto rounded-lg border border-slate-600/30 bg-slate-700/30 px-2.5 py-1.5 text-[10px]"
                            >
                              Offline fallback
                            </Button>
                          </div>
                        )}
                      </div>
                      {msg.source && !msg.source.startsWith("error-") && msg.source !== "system" && (
                        <span className="ml-1.5 mt-1 self-start text-[9px] font-medium text-slate-500">
                          Powered by {msg.source}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-600/25 text-indigo-300">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                    </div>
                    <div className="rounded-2xl border border-indigo-500/15 bg-indigo-950/20 px-4 py-3">
                      <div className="flex space-x-1.5">
                        {[0, 150, 300].map((delay) => (
                          <div
                            key={delay}
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-800 bg-[#020617]/80 p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex items-center space-x-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      !isViewingOwnRole
                        ? "Switch to your role to chat…"
                        : ollamaCooldownRemaining > 0 && activeProvider === "ollama"
                          ? `Local PC cooling down (${ollamaCooldownRemaining}s)…`
                          : activeProvider === "ollama"
                            ? `Ask via ${selectedOllamaModel || "Ollama"}…`
                            : "Ask Ai Buddy…"
                    }
                    className="h-10 flex-1 rounded-xl border-slate-800 bg-[#090d16] text-white placeholder:text-slate-500"
                    disabled={isLoading || !isViewingOwnRole || (ollamaCooldownRemaining > 0 && activeProvider === "ollama")}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading || !isViewingOwnRole || (ollamaCooldownRemaining > 0 && activeProvider === "ollama")}
                    className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 animate-float text-white ${
          isOpen
            ? "bg-slate-800 hover:bg-slate-700"
            : "animate-pulse-glow bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </Button>
    </div>
  )
}
