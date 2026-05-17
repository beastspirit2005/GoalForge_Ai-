"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getLocalAuditLogs, AuditLog } from "@/lib/local-audit-logs"

const actionColors: Record<string, string> = {
  goal_approved: "bg-emerald-100 text-emerald-700",
  goal_rejected: "bg-red-100 text-red-700",
  goal_created: "bg-sky-100 text-sky-700",
  goal_submitted: "bg-amber-100 text-amber-700",
  goal_updated: "bg-violet-100 text-violet-700",
  goal_unlocked: "bg-cyan-100 text-cyan-700",
  goal_locked: "bg-slate-100 text-slate-700",
  user_updated: "bg-orange-100 text-orange-700",
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">
              Audit logs
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Full governance trail of who changed what, when.
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="h-9 w-64 pl-9" placeholder="Search audit logs..." />
          </div>
        </div>

        <Card className="product-surface rounded-xl">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-950 dark:text-white">{log.user}</span>
                      <Badge className={`text-xs border-0 ${actionColors[log.action] || "bg-slate-100 text-slate-700"}`}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{log.detail}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{log.date}</p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">
                  No audit logs found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
