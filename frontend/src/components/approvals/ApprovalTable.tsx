"use client"

import { Check, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { managerQueue } from "@/lib/demo-data"
import { useState, useEffect } from "react"
import { addLocalAuditLog } from "@/lib/local-audit-logs"
import { useAuth } from "@/hooks/useAuth"

type QueueItem = typeof managerQueue[0]

export default function ApprovalTable() {
  const { user } = useAuth()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = window.localStorage.getItem("goalforge.demo.queue")
    if (stored) {
      setQueue(JSON.parse(stored))
    } else {
      setQueue(managerQueue)
    }
  }, [])

  const saveQueue = (newQueue: QueueItem[]) => {
    setQueue(newQueue)
    window.localStorage.setItem("goalforge.demo.queue", JSON.stringify(newQueue))
  }

  const handleApprove = (item: QueueItem) => {
    saveQueue(queue.filter(q => q.request !== item.request))
    addLocalAuditLog({
      user: user ? user.name : "Manager",
      action: "goal_approved",
      entity: "approval",
      entityId: item.employee.replace(/\s+/g, '-').toLowerCase(),
      detail: `Approved request: ${item.request} for ${item.employee}`
    })
  }

  const handleReject = (item: QueueItem) => {
    saveQueue(queue.filter(q => q.request !== item.request))
    addLocalAuditLog({
      user: user ? user.name : "Manager",
      action: "goal_rejected",
      entity: "approval",
      entityId: item.employee.replace(/\s+/g, '-').toLowerCase(),
      detail: `Rejected request: ${item.request} for ${item.employee}`
    })
  }

  if (!mounted) return null

  if (queue.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-white/[0.06] text-sm text-slate-500 dark:text-white/50">
        No pending approvals in the queue.
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-white/[0.04] overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.06]">
      {queue.map((item) => (
        <div
          key={`${item.employee}-${item.request}`}
          className="grid gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] md:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white/80">{item.employee}</p>
            <p className="mt-1 text-[12px] text-slate-600 dark:text-white/35">{item.request}</p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-white/40">
            <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            {item.impact}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              aria-label="Approve"
              onClick={() => handleApprove(item)}
              className="h-8 w-8 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Reject"
              onClick={() => handleReject(item)}
              className="h-8 w-8 border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
