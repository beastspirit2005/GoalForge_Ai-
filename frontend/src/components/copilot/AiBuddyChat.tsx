"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Bot, X, Send, User, Sparkles, Settings, Sliders, Cpu, AlertTriangle, MessageSquarePlus, Trash2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { getStoredToken } from "@/services/auth.service"
import { useAuth } from "@/hooks/useAuth"

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  source?: string
}

const getGreeting = (role: string) => {
  if (role === "admin") {
    return "Hi Admin! I'm your Executive AI Buddy. I can help you monitor goal progress, active performance cycles, system-wide escalations, and leaderboard stats. Ask me anything to assist you with your administrative work today!"
  }
  if (role === "manager") {
    return "Hi Manager! I'm your Team Performance Copilot. I can help you monitor team goals, track progress, review pending approvals, and resolve high-risk items. How can I help you support your team today?"
  }
  return "Hi! I'm Ai Buddy, your enterprise performance coach. How can I help you with your goals today?"
}

export function AiBuddyChat() {
  const { user } = useAuth()
  const role = user ? ("role" in user ? user.role : "") : ""

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  // Multi-provider State
  const [activeProvider, setActiveProvider] = useState<"gemini" | "ollama" | "fallback">("gemini")
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>("")
  
  // Privacy & Chat Caching Controls
  const [saveHistory, setSaveHistory] = useState(true)
  const [isDeletedFeedback, setIsDeletedFeedback] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load preferences and models on mount
  useEffect(() => {
    // 1. Load active provider preference
    const savedProvider = localStorage.getItem("aiBuddyProvider") as "gemini" | "ollama" | "fallback"
    if (savedProvider) {
      setActiveProvider(savedProvider)
    }

    // 2. Load selected local model preference
    const savedOllama = localStorage.getItem("aiBuddyOllamaModel")
    if (savedOllama) {
      setSelectedOllamaModel(savedOllama)
    }

    // 3. Fetch pulled local Ollama models from backend or standard local fallback
    const fetchModels = async () => {
      try {
        const token = getStoredToken()
        const res = await apiFetch<{ models: string[] }>("/ai/models", { token })
        if (res.models && res.models.length > 0) {
          setOllamaModels(res.models)
          // If no model saved previously, set the first one active
          if (!savedOllama) {
            setSelectedOllamaModel(res.models[0])
          }
        }
      } catch (err) {
        console.warn("Failed to load local Ollama models from backend, trying direct browser query:", err)
        try {
          const directRes = await fetch("http://localhost:11434/api/tags")
          if (directRes.ok) {
            const data = await directRes.json()
            if (data.models && data.models.length > 0) {
              const names = data.models.map((m: any) => m.name)
              setOllamaModels(names)
              if (!savedOllama) {
                setSelectedOllamaModel(names[0])
              }
            }
          }
        } catch (directErr) {
          console.error("Direct browser fetch to local Ollama failed:", directErr)
        }
      }
    }
    fetchModels()

    // Listen to clear chat triggers
    const handleClear = () => {
      const greeting = getGreeting(role)
      setMessages([
        { role: "assistant", content: greeting, source: "system" }
      ])
      if (user?.email) {
        localStorage.removeItem(`aiBuddyChat_${user.email}`)
      }
    }
    window.addEventListener("clear-ai-chat", handleClear)
    return () => window.removeEventListener("clear-ai-chat", handleClear)
  }, [role, user?.email])

  // Load user-specific chat history and preferences when user.email is ready
  useEffect(() => {
    if (!user?.email) return

    // Load Save History toggle preference
    const savedToggle = localStorage.getItem(`aiBuddySaveHistory_${user.email}`)
    const isSaveEnabled = savedToggle !== "false"
    setSaveHistory(isSaveEnabled)

    // Load private user-scoped chat log
    const userKey = `aiBuddyChat_${user.email}`
    const savedChat = localStorage.getItem(userKey)
    if (savedChat) {
      setMessages(JSON.parse(savedChat))
    } else {
      setMessages([
        { role: "assistant", content: getGreeting(role), source: "system" }
      ])
    }
  }, [user?.email, role])

  // Save chat log on changes (respecting privacy toggle)
  useEffect(() => {
    if (!user?.email || messages.length === 0) return
    const userKey = `aiBuddyChat_${user.email}`
    
    if (saveHistory) {
      localStorage.setItem(userKey, JSON.stringify(messages))
    } else {
      localStorage.removeItem(userKey)
    }
    scrollToBottom()
  }, [messages, user?.email, saveHistory])

  // Handle provider and model preference persistent saving
  useEffect(() => {
    localStorage.setItem("aiBuddyProvider", activeProvider)
  }, [activeProvider])

  useEffect(() => {
    if (selectedOllamaModel) {
      localStorage.setItem("aiBuddyOllamaModel", selectedOllamaModel)
    }
  }, [selectedOllamaModel])

  // New Chat (Clear current session)
  const handleNewChat = useCallback(() => {
    const greeting = getGreeting(role)
    setMessages([
      { role: "assistant", content: greeting, source: "system" }
    ])
    if (user?.email && saveHistory) {
      localStorage.setItem(`aiBuddyChat_${user.email}`, JSON.stringify([
        { role: "assistant", content: greeting, source: "system" }
      ]))
    }
  }, [role, user?.email, saveHistory])

  // Delete Chat History Permanently
  const handleDeleteChat = useCallback(() => {
    const greeting = getGreeting(role)
    setMessages([
      { role: "assistant", content: greeting, source: "system" }
    ])
    if (user?.email) {
      localStorage.removeItem(`aiBuddyChat_${user.email}`)
    }
    setIsDeletedFeedback(true)
    setTimeout(() => {
      setIsDeletedFeedback(false)
    }, 2000)
  }, [role, user?.email])

  // Toggle Save History Preference
  const handleToggleSaveHistory = useCallback((enabled: boolean) => {
    setSaveHistory(enabled)
    if (user?.email) {
      localStorage.setItem(`aiBuddySaveHistory_${user.email}`, String(enabled))
      if (!enabled) {
        localStorage.removeItem(`aiBuddyChat_${user.email}`)
      } else {
        localStorage.setItem(`aiBuddyChat_${user.email}`, JSON.stringify(messages))
      }
    }
  }, [user?.email, messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const token = getStoredToken()
      const res = await apiFetch<{ response: string; source: string }>("/ai/copilot", {
        method: "POST",
        token,
        body: { 
          query: userMessage, 
          context: "", 
          provider: activeProvider, 
          model: activeProvider === "ollama" ? selectedOllamaModel : undefined
        },
      })
      
      setMessages((prev) => [...prev, { role: "assistant", content: res.response, source: res.source }])
    } catch (err: any) {
      if (activeProvider === "ollama" && selectedOllamaModel) {
        try {
          const directRes = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: selectedOllamaModel,
              prompt: userMessage,
              stream: false,
            }),
          })
          if (directRes.ok) {
            const data = await directRes.json()
            setMessages((prev) => [...prev, { role: "assistant", content: data.response, source: "ollama" }])
            return
          }
        } catch (directErr) {
          console.error("Direct browser fetch to local Ollama generation failed:", directErr)
        }
      }
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: `Oops! I encountered an error with ${activeProvider}: ${err?.message || "Unknown error"}. Would you like to try switching to another provider?`,
        source: `error-${activeProvider}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchProvider = async (newProvider: "gemini" | "ollama" | "fallback") => {
    setActiveProvider(newProvider)
    
    // Find the last query entered by the user
    const userMessages = messages.filter((m) => m.role === "user")
    if (userMessages.length === 0) return

    const lastQuery = userMessages[userMessages.length - 1].content
    setIsLoading(true)

    // Notify user of the redirect
    setMessages((prev) => [...prev, { 
      role: "assistant", 
      content: `Rerouting your request to **${newProvider.toUpperCase()}**...`, 
      source: "system" 
    }])

    let localModel = selectedOllamaModel
    try {
      const token = getStoredToken()
      // Determine what model to use
      if (newProvider === "ollama" && !localModel && ollamaModels.length > 0) {
        localModel = ollamaModels[0]
        setSelectedOllamaModel(localModel)
      }

      const res = await apiFetch<{ response: string; source: string }>("/ai/copilot", {
        method: "POST",
        token,
        body: { 
          query: lastQuery, 
          context: "", 
          provider: newProvider, 
          model: newProvider === "ollama" ? localModel : undefined
        },
      })
      
      setMessages((prev) => [...prev, { role: "assistant", content: res.response, source: res.source }])
    } catch (err: any) {
      if (newProvider === "ollama" && localModel) {
        try {
          const directRes = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: localModel,
              prompt: lastQuery,
              stream: false,
            }),
          })
          if (directRes.ok) {
            const data = await directRes.json()
            setMessages((prev) => [...prev, { role: "assistant", content: data.response, source: "ollama" }])
            return
          }
        } catch (directErr) {
          console.error("Direct browser fetch to local Ollama generation failed during switch:", directErr)
        }
      }
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: `Failed to connect to ${newProvider}: ${err?.message || "Unknown error"}.`,
        source: `error-${newProvider}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Premium Markdown renderer workaround
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n")
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          // Detect headers starting with ### or ##
          if (line.startsWith("### ") || line.startsWith("## ")) {
            const cleanText = line.replace(/^(###|##)\s+/, "")
            return (
              <h4 key={i} className="mt-3 mb-1 text-sm font-bold text-indigo-300">
                {parseBoldText(cleanText)}
              </h4>
            )
          }
          
          // Detect lists starting with - or *
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const cleanText = line.replace(/^\s*([-*])\s+/, "")
            return (
              <div key={i} className="ml-2 flex items-start gap-2 text-xs leading-relaxed text-slate-100">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <span>{parseBoldText(cleanText)}</span>
              </div>
            )
          }
          
          // Normal paragraph
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
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="font-semibold text-indigo-200">
            {part}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <div className="fixed-dark fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="relative glass-panel mb-4 flex h-[520px] w-[350px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#020617]/95 shadow-2xl transition-all duration-300 ease-in-out sm:w-[420px] animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-[var(--gf-indigo)]/90 to-[var(--gf-violet)]/90 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white shadow-[0_0_8px_rgba(255,255,255,0.2)] animate-pulse-glow">
                <Sparkles className="h-4.5 w-4.5 text-indigo-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  Ai Buddy
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-indigo-100 font-medium capitalize">
                    {activeProvider}
                  </span>
                </h3>
                <p className="text-[10px] text-white/70">GoalForge Performance Copilot</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                onClick={handleNewChat}
                title="New Chat"
              >
                <MessageSquarePlus className="h-4.5 w-4.5 text-indigo-100" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg transition-colors text-white/80 hover:text-white ${showSettings ? "bg-white/15 text-white" : "hover:bg-white/10"}`}
                onClick={() => setShowSettings(!showSettings)}
                title="AI Settings & Privacy"
              >
                <Settings className="h-4.5 w-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>

          {/* Settings Panel (Floating Dropdown Overlay) */}
          {showSettings && (
            <div className="absolute top-[65px] left-0 right-0 z-30 border-b border-slate-800 bg-[#070b19]/98 backdrop-blur-md p-4 space-y-4 animate-in slide-in-from-top duration-200 shadow-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                  AI Engine Provider
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["gemini", "ollama", "fallback"] as const).map((prov) => (
                    <button
                      key={prov}
                      onClick={() => setActiveProvider(prov)}
                      className={`rounded-lg py-1.5 text-xs font-semibold border capitalize transition-all duration-200 ${
                        activeProvider === prov
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-600/10"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
                      }`}
                    >
                      {prov === "gemini" ? "Gemini" : prov === "ollama" ? "Ollama" : "Fallback"}
                    </button>
                  ))}
                </div>
              </div>

              {activeProvider === "ollama" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                    Select Local Model
                  </label>
                  {ollamaModels.length > 0 ? (
                    <select
                      value={selectedOllamaModel}
                      onChange={(e) => setSelectedOllamaModel(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {ollamaModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-[11px] text-amber-300 border border-amber-500/20 bg-amber-500/5 p-3 rounded-lg flex items-start gap-2 leading-relaxed">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>
                        No pulled local models detected! Make sure Ollama is running (`ollama serve`) and you have pulled a model (e.g. `ollama pull gemma2:2b` or `ollama pull phi3`).
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Privacy & History Management */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
                  Privacy & Chat Logs
                </label>
                
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] text-slate-300 font-medium">Save Chat History</span>
                  <button
                    type="button"
                    onClick={() => handleToggleSaveHistory(!saveHistory)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      saveHistory ? "bg-indigo-600" : "bg-slate-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        saveHistory ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={handleDeleteChat}
                  variant="outline"
                  className={`w-full h-8 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isDeletedFeedback
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:text-emerald-200"
                      : "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300 hover:text-rose-200"
                  }`}
                >
                  <Trash2 className={`h-3.5 w-3.5 ${isDeletedFeedback ? "text-emerald-400" : "text-rose-400"}`} />
                  {isDeletedFeedback ? "Logs Cleared Successfully!" : "Clear & Delete Chat Logs"}
                </Button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#020617]/50 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md ${
                    msg.role === "user" ? "bg-slate-800 text-white" : "bg-indigo-600/25 border border-indigo-500/20 text-indigo-300"
                  }`}
                >
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs shadow-lg transition-all ${
                      msg.role === "user"
                        ? "bg-slate-800 text-white rounded-tr-sm"
                        : "bg-indigo-950/40 text-slate-100 rounded-tl-sm border border-indigo-500/15"
                    }`}
                  >
                    {renderMessageContent(msg.content)}

                    {/* Interactive Failover Buttons */}
                    {msg.source === "error-gemini" && (
                      <div className="mt-3 pt-2.5 border-t border-indigo-500/10 flex flex-col gap-1.5">
                        <p className="text-[10px] text-slate-400 font-medium">Quick switch options:</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSwitchProvider("ollama")}
                            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-[10px] px-2.5 py-1.5 h-auto rounded-lg font-semibold"
                          >
                            Switch to local Ollama
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSwitchProvider("fallback")}
                            className="bg-slate-700/30 hover:bg-slate-700/50 text-slate-200 border border-slate-600/30 text-[10px] px-2.5 py-1.5 h-auto rounded-lg font-semibold"
                          >
                            Use offline Fallback
                          </Button>
                        </div>
                      </div>
                    )}

                    {msg.source === "error-ollama" && (
                      <div className="mt-3 pt-2.5 border-t border-indigo-500/10 flex flex-col gap-1.5">
                        <p className="text-[10px] text-slate-400 font-medium">Quick switch options:</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSwitchProvider("fallback")}
                            className="bg-slate-700/30 hover:bg-slate-700/50 text-slate-200 border border-slate-600/30 text-[10px] px-2.5 py-1.5 h-auto rounded-lg font-semibold"
                          >
                            Use offline Fallback
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {msg.source && !msg.source.startsWith("error-") && msg.source !== "system" && (
                    <span className="text-[9px] text-slate-500 mt-1 self-start ml-1.5 font-medium">
                      Powered by {msg.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/25 border border-indigo-500/20 text-indigo-300">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-indigo-500/15 bg-indigo-950/20 px-4 py-3 shadow-md">
                  <div className="flex space-x-1.5">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
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
                placeholder={activeProvider === "ollama" ? `Ask Ai Buddy via ${selectedOllamaModel || 'Ollama'}...` : "Ask Ai Buddy..."}
                className="h-10 flex-1 border-slate-800 bg-[#090d16] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 rounded-xl"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:scale-105"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 animate-float text-white animate-pulse-glow ${
          isOpen 
            ? "bg-slate-800 hover:bg-slate-700 shadow-slate-900/30" 
            : "bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30"
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </Button>
    </div>
  )
}
