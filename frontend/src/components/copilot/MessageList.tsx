"use client"

import React, { useState, useRef, useEffect } from "react"
import { Bot, User, Sparkles, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ChatMessage } from "@/lib/chat-history"

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  isViewingOwnRole: boolean
  handleSwitchProvider: (prov: "gemini" | "ollama" | "fallback") => void
  executeAdminAction: (action: string, params: any, otpCode: string) => Promise<{ success: boolean; message: string }>
}

function ActionConfirmationForm({
  action,
  description,
  onConfirm,
}: {
  action: string
  description: string
  onConfirm: (otp: string) => Promise<{ success: boolean; message: string }>
}) {
  const [otp, setOtp] = useState("")
  const [executing, setExecuting] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null)

  const handleConfirm = async () => {
    if (otp.length < 6) return
    setExecuting(true)
    setStatus(null)
    try {
      const res = await onConfirm(otp)
      setStatus(res)
    } catch (err: any) {
      setStatus({ success: false, message: err.message || "Execution failed." })
    } finally {
      setExecuting(false)
    }
  }

  if (status?.success) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-950/40 p-3 text-xs text-emerald-300">
        <div className="flex items-center gap-1.5 font-bold mb-1">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          Action Confirmed
        </div>
        <p>{status.message}</p>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/40 p-3 text-xs animate-scale-in">
      <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        Critical Action Authorization Required
      </div>
      <p className="text-slate-300 mb-2 leading-relaxed">
        {description || `Execute command: ${action}`}
      </p>
      
      {status?.success === false && (
        <div className="mb-2 text-[11px] font-semibold text-rose-400">
          ❌ {status.message}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          type="text"
          maxLength={6}
          placeholder="Enter OTP Code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="h-8 w-28 border-slate-700 bg-slate-900 text-center text-xs tracking-widest text-white placeholder:tracking-normal"
          disabled={executing}
        />
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={otp.length < 6 || executing}
          className="h-8 bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white px-3"
        >
          {executing ? "Confirming..." : "Confirm Action"}
        </Button>
      </div>
    </div>
  )
}

export function MessageList({
  messages,
  isLoading,
  isViewingOwnRole,
  handleSwitchProvider,
  executeAdminAction,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const renderMessageContent = (content: string, isAssistant: boolean) => {
    // Check if there is an ACTION_PENDING comment block
    const actionMatch = /<!--\s*ACTION_PENDING:\s*({.*?})\s*-->/.exec(content)
    
    // Clean content of the HTML comment block for display
    const cleanContent = content.replace(/<!--\s*ACTION_PENDING:\s*({.*?})\s*-->/, "").trim()
    const lines = cleanContent.split("\n")

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

        {/* Action Confirmation Panel */}
        {isAssistant && actionMatch && (
          (() => {
            try {
              const actionData = JSON.parse(actionMatch[1])
              return (
                <ActionConfirmationForm
                  action={actionData.action}
                  description={`Confirm execution of administrative action: ${actionData.action}. This action will be audited.`}
                  onConfirm={(otp) => executeAdminAction(actionData.action, actionData.params, otp)}
                />
              )
            } catch (err) {
              console.error("Failed to parse Action Pending JSON", err)
              return null
            }
          })()
        )}
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

  return (
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
              {renderMessageContent(msg.content, msg.role === "assistant")}
              
              {/* Fallback Swapper options for Gemini Error */}
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
  )
}
