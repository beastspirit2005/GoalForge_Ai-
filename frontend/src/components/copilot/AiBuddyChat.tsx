"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { getStoredToken } from "@/services/auth.service"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function AiBuddyChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const saved = localStorage.getItem("aiBuddyChat")
    if (saved) {
      setMessages(JSON.parse(saved))
    } else {
      setMessages([
        { role: "assistant", content: "Hi! I'm Ai Buddy, your enterprise performance coach. How can I help you with your goals today?" }
      ])
    }
    
    const handleClear = () => {
      setMessages([
        { role: "assistant", content: "Chat cleared! How can I help you today?" }
      ])
      localStorage.removeItem("aiBuddyChat")
    }
    window.addEventListener("clear-ai-chat", handleClear)
    return () => window.removeEventListener("clear-ai-chat", handleClear)
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("aiBuddyChat", JSON.stringify(messages))
    }
    scrollToBottom()
  }, [messages])

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
        body: { query: userMessage, context: "" },
      })
      
      setMessages((prev) => [...prev, { role: "assistant", content: res.response }])
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Oops! I encountered an error: ${err?.message || "Unknown error"}` }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed-dark fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#020617] shadow-2xl transition-all duration-300 ease-in-out sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 bg-[#0f172a] p-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Ai Buddy</h3>
                <p className="text-xs text-slate-300">Performance Copilot</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white hover:bg-slate-800/50"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user" ? "bg-[#1e293b] text-white" : "bg-indigo-500/20 text-indigo-400"
                  }`}
                >
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-[#1e293b] text-white rounded-tr-sm"
                      : "bg-indigo-500/20 text-white rounded-tl-sm border border-indigo-500/30"
                  }`}
                >
                  {/* Basic markdown rendering workaround for now */}
                  {msg.content.split("\\n").map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">
                      {line.replace(/\\*\\*(.*?)\\*\\*/g, "$1")} 
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-indigo-500/30 bg-indigo-500/20 px-4 py-3">
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
          <div className="border-t border-slate-700 bg-[#0f172a] p-4">
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
                placeholder="Ask Ai Buddy..."
                className="h-10 flex-1 border-slate-600 bg-[#020617] text-white placeholder:text-slate-400 focus-visible:ring-indigo-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 ${
          isOpen ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </Button>
    </div>
  )
}
