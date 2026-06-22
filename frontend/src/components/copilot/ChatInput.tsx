"use client"

import React from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  isLoading: boolean
  isViewingOwnRole: boolean
  ollamaCooldownRemaining: number
  activeProvider: "gemini" | "ollama" | "fallback"
  selectedOllamaModel: string
  handleSend: () => void
}

export function ChatInput({
  input,
  setInput,
  isLoading,
  isViewingOwnRole,
  ollamaCooldownRemaining,
  activeProvider,
  selectedOllamaModel,
  handleSend,
}: ChatInputProps) {
  const getPlaceholder = () => {
    if (!isViewingOwnRole) return "Switch to your role to chat…"
    if (ollamaCooldownRemaining > 0 && activeProvider === "ollama") {
      return `Local PC cooling down (${ollamaCooldownRemaining}s)…`
    }
    if (activeProvider === "ollama") {
      return `Ask via ${selectedOllamaModel || "Ollama"}…`
    }
    return "Ask Ai Buddy…"
  }

  const isInputDisabled =
    isLoading ||
    !isViewingOwnRole ||
    (ollamaCooldownRemaining > 0 && activeProvider === "ollama")

  const isSendDisabled =
    !input.trim() ||
    isLoading ||
    !isViewingOwnRole ||
    (ollamaCooldownRemaining > 0 && activeProvider === "ollama")

  return (
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
          placeholder={getPlaceholder()}
          className="h-10 flex-1 rounded-xl border-slate-800 bg-[#090d16] text-white placeholder:text-slate-500"
          disabled={isInputDisabled}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSendDisabled}
          className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
