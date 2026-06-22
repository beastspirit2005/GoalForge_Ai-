"use client"

import React from "react"
import { Key, Cpu, Sliders, ShieldAlert, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProviderSwitcherProps {
  geminiKeyMode: "app" | "custom"
  customKeyInput: string
  setCustomKeyInput: (val: string) => void
  showCustomKey: boolean
  setShowCustomKey: (val: boolean) => void
  keySaveMessage: string
  activeProvider: "gemini" | "ollama" | "fallback"
  setActiveProvider: (val: "gemini" | "ollama" | "fallback") => void
  ollamaModels: string[]
  selectedOllamaModel: string
  setSelectedOllamaModel: (val: string) => void
  saveHistory: boolean
  handleToggleSaveHistory: (val: boolean) => void
  handleDeleteAllForRole: () => void
  isDeletedFeedback: boolean
  historyRole: string
  roleLabels: Record<string, string>
  handleUseAppKey: () => void
  selectCustomKeyMode: () => void
  handleSaveCustomKey: () => void
}

export function ProviderSwitcher({
  geminiKeyMode,
  customKeyInput,
  setCustomKeyInput,
  showCustomKey,
  setShowCustomKey,
  keySaveMessage,
  activeProvider,
  setActiveProvider,
  ollamaModels,
  selectedOllamaModel,
  setSelectedOllamaModel,
  saveHistory,
  handleToggleSaveHistory,
  handleDeleteAllForRole,
  isDeletedFeedback,
  historyRole,
  roleLabels,
  handleUseAppKey,
  selectCustomKeyMode,
  handleSaveCustomKey,
}: ProviderSwitcherProps) {
  return (
    <div className="absolute top-[65px] right-0 left-0 z-30 max-h-[70%] overflow-y-auto border-b border-slate-800 bg-[#070b19]/98 p-4 shadow-2xl backdrop-blur-md sm:left-[200px]">
      <div className="space-y-4">
        {/* Gemini Key */}
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

        {/* AI Engine Selection */}
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

        {/* Local model */}
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

        {/* Privacy */}
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
              : `Clear all ${roleLabels[historyRole] || historyRole} chats`}
          </Button>
        </div>
      </div>
    </div>
  )
}
