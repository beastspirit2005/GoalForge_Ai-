"use client"

import React, { useMemo } from "react"
import {
  X,
  Sparkles,
  Settings,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeft,
  History,
  Trash2,
  AlertCircle,
  BarChart3,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatState } from "./useChatState"
import { MessageList } from "./MessageList"
import { ChatInput } from "./ChatInput"
import { ProviderSwitcher } from "./ProviderSwitcher"
import { type ChatSession, type AppRole, ROLES } from "@/lib/chat-history"

const roleLabels: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "Admin",
  super_admin: "Super Admin",
}

export function AiBuddyChat() {
  const {
    isOpen,
    setIsOpen,
    showHistory,
    setShowHistory,
    historyRole,
    setHistoryRole,
    chatStore,
    input,
    setInput,
    isLoading,
    showSettings,
    setShowSettings,
    activeProvider,
    setActiveProvider,
    ollamaModels,
    selectedOllamaModel,
    setSelectedOllamaModel,
    ollamaCooldownRemaining,
    geminiKeyMode,
    customKeyInput,
    setCustomKeyInput,
    showCustomKey,
    setShowCustomKey,
    keySaveMessage,
    saveHistory,
    isDeletedFeedback,
    messages,
    isViewingOwnRole,
    handleNewChat,
    handleSelectSession,
    handleDeleteSession,
    handleDeleteAllForRole,
    handleToggleSaveHistory,
    handleSaveCustomKey,
    handleUseAppKey,
    handleSend,
    handleSwitchProvider,
    selectCustomKeyMode,
    executeAdminAction,
    accountRole,
  } = useChatState()

  const sortedSessions = useMemo(() => {
    return [...(chatStore?.sessions ?? [])].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [chatStore?.sessions])

  return (
    <div className="fixed-dark fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div
          className={`relative glass-panel mb-4 flex h-[580px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#020617]/95 shadow-2xl transition-all duration-300 ease-in-out animate-scale-in ${
            showHistory ? "w-[min(92vw,720px)]" : "w-[min(92vw,440px)]"
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
                    {ROLES.filter(r => r === accountRole || accountRole === "super_admin").map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setHistoryRole(r as AppRole)}
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

              {/* Provider Config panel */}
              {showSettings && isViewingOwnRole && (
                <ProviderSwitcher
                  geminiKeyMode={geminiKeyMode}
                  customKeyInput={customKeyInput}
                  setCustomKeyInput={setCustomKeyInput}
                  showCustomKey={showCustomKey}
                  setShowCustomKey={setShowCustomKey}
                  keySaveMessage={keySaveMessage}
                  activeProvider={activeProvider}
                  setActiveProvider={setActiveProvider}
                  ollamaModels={ollamaModels}
                  selectedOllamaModel={selectedOllamaModel}
                  setSelectedOllamaModel={setSelectedOllamaModel}
                  saveHistory={saveHistory}
                  handleToggleSaveHistory={handleToggleSaveHistory}
                  handleDeleteAllForRole={handleDeleteAllForRole}
                  isDeletedFeedback={isDeletedFeedback}
                  historyRole={historyRole}
                  roleLabels={roleLabels}
                  handleUseAppKey={handleUseAppKey}
                  selectCustomKeyMode={selectCustomKeyMode}
                  handleSaveCustomKey={handleSaveCustomKey}
                />
              )}

              {/* Warning label if viewing other role's archive */}
              {!isViewingOwnRole && (
                <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] text-amber-200">
                  Viewing archived {roleLabels[historyRole]} chats — switch to your current role to send messages.
                </div>
              )}

              {/* Super Admin Quick Actions Bar */}
              {historyRole === "super_admin" && isViewingOwnRole && (
                <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 bg-[#060b1e]/90 px-4 py-2.5 scrollbar-none">
                  <p className="flex items-center gap-1 shrink-0 text-[10px] font-bold text-amber-400 uppercase tracking-wider mr-1">
                    <Zap className="h-3 w-3" />
                    Quick Commands:
                  </p>
                  <Button
                    onClick={() => handleSend("Generate Executive Brief")}
                    disabled={isLoading}
                    variant="outline"
                    className="h-7 shrink-0 rounded-full border-amber-500/30 bg-amber-500/5 px-2.5 text-[10px] font-semibold text-amber-200 hover:bg-amber-600/20 hover:text-white"
                  >
                    <BarChart3 className="mr-1 h-3 w-3" />
                    Generate Executive Brief
                  </Button>
                  <Button
                    onClick={() => handleSend("Show me critical risks")}
                    disabled={isLoading}
                    variant="outline"
                    className="h-7 shrink-0 rounded-full border-rose-500/30 bg-rose-500/5 px-2.5 text-[10px] font-semibold text-rose-200 hover:bg-rose-600/20 hover:text-white"
                  >
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Risk Radar
                  </Button>
                  <Button
                    onClick={() => handleSend("Find all users skilled in React and Figma")}
                    disabled={isLoading}
                    variant="outline"
                    className="h-7 shrink-0 rounded-full border-indigo-500/30 bg-indigo-500/5 px-2.5 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-600/20 hover:text-white"
                  >
                    <Search className="mr-1 h-3 w-3" />
                    Search Skills
                  </Button>
                  <Button
                    onClick={() => handleSend("Show failed login attempts today")}
                    disabled={isLoading}
                    variant="outline"
                    className="h-7 shrink-0 rounded-full border-emerald-500/30 bg-emerald-500/5 px-2.5 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-600/20 hover:text-white"
                  >
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Security Intel
                  </Button>
                </div>
              )}

              {/* Chat messages viewport */}
              <MessageList
                messages={messages}
                isLoading={isLoading}
                isViewingOwnRole={isViewingOwnRole}
                handleSwitchProvider={handleSwitchProvider}
                executeAdminAction={executeAdminAction}
              />

              {/* Message inputs form */}
              <ChatInput
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                isViewingOwnRole={isViewingOwnRole}
                ollamaCooldownRemaining={ollamaCooldownRemaining}
                activeProvider={activeProvider}
                selectedOllamaModel={selectedOllamaModel}
                handleSend={handleSend}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating launcher badge */}
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
