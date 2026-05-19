"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Calendar, RefreshCw, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getLocalAuditLogs, AuditLog } from "@/lib/local-audit-logs"

const actionColors: Record<string, string> = {
  goal_approved: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  goal_approved_after_edit: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  goal_rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  goal_rejected_after_edit: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  goal_created: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  goal_submitted: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  goal_updated: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  goal_unlocked: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  goal_locked: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  user_updated: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [sortBy, setSortBy] = useState<"alphabetical" | "latest">("alphabetical")
  const [mounted, setMounted] = useState(false)

  const fetchLogs = () => {
    setLogs(getLocalAuditLogs())
  }

  useEffect(() => {
    setMounted(true)
    fetchLogs()

    const handleUpdate = () => fetchLogs()
    window.addEventListener("audit-logs-updated", handleUpdate)
    return () => window.removeEventListener("audit-logs-updated", handleUpdate)
  }, [])

  if (!mounted) return null

  // Date matching helper
  const matchesDate = (logDateStr: string, filterDateStr: string) => {
    if (!filterDateStr) return true
    try {
      const filterDateObj = new Date(filterDateStr)
      const logDateObj = new Date(logDateStr)
      return (
        filterDateObj.getDate() === logDateObj.getDate() &&
        filterDateObj.getMonth() === logDateObj.getMonth() &&
        filterDateObj.getFullYear() === logDateObj.getFullYear()
      )
    } catch {
      return false
    }
  }

  // Filter and Sort Logs
  const filteredAndSortedLogs = logs
    .filter((log) => {
      const query = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !query ||
        log.user.toLowerCase().includes(query) ||
        log.detail.toLowerCase().includes(query) ||
        log.action.toLowerCase().replace(/_/g, " ").includes(query)
      
      const matchesDateFilter = matchesDate(log.date, filterDate)
      return matchesQuery && matchesDateFilter
    })
    .sort((a, b) => {
      if (sortBy === "alphabetical") {
        const userCompare = a.user.localeCompare(b.user)
        if (userCompare !== 0) return userCompare
        // Secondary sort: latest log first for same user
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else {
        // Latest first
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

  const resetFilters = () => {
    setSearchQuery("")
    setFilterDate("")
    setSortBy("alphabetical")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">
              Audit logs
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Full governance trail of who changed what, when.
            </p>
          </div>
        </div>

        {/* Filters Controls Panel */}
        <div className="flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-9 w-64 pl-9 rounded-lg border-white/[0.08] dark:bg-white/[0.04] bg-slate-100 dark:text-white"
                placeholder="Search by name, action, detail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Date Picker Input */}
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                className="h-9 w-48 pl-9 rounded-lg border-white/[0.08] dark:bg-white/[0.04] bg-slate-100 dark:text-white dark:[color-scheme:dark]"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            {/* Sorting Toggle */}
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2 py-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <select
                className="bg-transparent text-xs text-slate-600 dark:text-white/80 outline-none border-none cursor-pointer py-0.5"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "alphabetical" | "latest")}
              >
                <option value="alphabetical" className="bg-[oklch(0.13_0.015_270)]">Alphabetical (A-Z)</option>
                <option value="latest" className="bg-[oklch(0.13_0.015_270)]">Latest Logs</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {(searchQuery || filterDate || sortBy !== "alphabetical") && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-9 gap-1.5 rounded-lg border-white/[0.08] dark:bg-white/[0.04] bg-slate-100 text-xs text-slate-600 dark:text-white/60 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* Audit Logs List Card */}
        <Card className="product-surface rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {filteredAndSortedLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.01]"
                >
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-950 dark:text-white">
                        {log.user}
                      </span>
                      <Badge
                        className={`text-[10px] uppercase font-bold py-0.5 px-2 tracking-wide rounded-md border-0 ${
                          actionColors[log.action] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {log.detail}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {log.date}
                    </p>
                  </div>
                </div>
              ))}
              {filteredAndSortedLogs.length === 0 && (
                <div className="p-12 text-center text-sm text-slate-500">
                  No matching audit logs found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
