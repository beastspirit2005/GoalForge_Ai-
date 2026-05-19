"use client"

import { Check, Clock, X, Pencil, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { managerQueue } from "@/lib/demo-data"
import { useState, useEffect } from "react"
import { addLocalAuditLog } from "@/lib/local-audit-logs"
import { useAuth } from "@/hooks/useAuth"

type QueueItem = {
  employee: string
  request: string
  impact: string
  status: string
  wasEdited?: boolean
  originalRequest?: string
  originalImpact?: string
}

export default function ApprovalTable() {
  const { user } = useAuth()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [mounted, setMounted] = useState(false)
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editRequest, setEditRequest] = useState("")
  const [editImpact, setEditImpact] = useState("")

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

  const handleApprove = (index: number) => {
    const item = queue[index]
    const activeItem = editingIndex === index
      ? { ...item, request: editRequest, impact: editImpact, wasEdited: true }
      : item
      
    saveQueue(queue.filter((_, idx) => idx !== index))
    setEditingIndex(null)

    const isEdited = activeItem.wasEdited || (editingIndex === index && (activeItem.request !== item.request || activeItem.impact !== item.impact))
    const action = isEdited ? "goal_approved_after_edit" : "goal_approved"
    
    const originalText = activeItem.originalRequest || item.request
    const detail = isEdited
      ? `Approved goal after editing: "${activeItem.request}" (originally: "${originalText}") for ${activeItem.employee}`
      : `Approved request: "${activeItem.request}" for ${activeItem.employee}`
    
    addLocalAuditLog({
      user: user ? user.name : "Manager",
      action: action,
      entity: "approval",
      entityId: activeItem.employee.replace(/\s+/g, '-').toLowerCase(),
      detail: detail
    })
  }

  const handleReject = (index: number) => {
    const item = queue[index]
    const activeItem = editingIndex === index
      ? { ...item, request: editRequest, impact: editImpact, wasEdited: true }
      : item

    saveQueue(queue.filter((_, idx) => idx !== index))
    setEditingIndex(null)

    const isEdited = activeItem.wasEdited || (editingIndex === index && (activeItem.request !== item.request || activeItem.impact !== item.impact))
    const action = isEdited ? "goal_rejected_after_edit" : "goal_rejected"
    
    const originalText = activeItem.originalRequest || item.request
    const detail = isEdited
      ? `Rejected goal after editing: "${activeItem.request}" (originally: "${originalText}") for ${activeItem.employee}`
      : `Rejected request: "${activeItem.request}" for ${activeItem.employee}`

    addLocalAuditLog({
      user: user ? user.name : "Manager",
      action: action,
      entity: "approval",
      entityId: activeItem.employee.replace(/\s+/g, '-').toLowerCase(),
      detail: detail
    })
  }

  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditRequest(queue[index].request)
    setEditImpact(queue[index].impact)
  }

  const handleSave = (index: number) => {
    const nextQueue = [...queue]
    const oldRequest = nextQueue[index].request
    const originalRequest = nextQueue[index].originalRequest || oldRequest
    const originalImpact = nextQueue[index].originalImpact || nextQueue[index].impact

    nextQueue[index] = {
      ...nextQueue[index],
      request: editRequest,
      impact: editImpact,
      wasEdited: true,
      originalRequest,
      originalImpact
    }
    saveQueue(nextQueue)
    setEditingIndex(null)
    addLocalAuditLog({
      user: user ? user.name : "Manager",
      action: "goal_updated",
      entity: "approval",
      entityId: nextQueue[index].employee.replace(/\s+/g, '-').toLowerCase(),
      detail: `Edited request inline: "${oldRequest}" modified to "${editRequest}" with impact "${editImpact}" for ${nextQueue[index].employee}`
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
      {queue.map((item, index) => {
        const isEditing = editingIndex === index
        return (
          <div
            key={`${item.employee}-${index}`}
            className="grid gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] md:grid-cols-[1fr_1fr_auto] items-center"
          >
            <div>
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white/80">{item.employee}</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editRequest}
                  onChange={(e) => setEditRequest(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-900 focus:border-[var(--gf-indigo)] focus:outline-none dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  placeholder="Request details..."
                />
              ) : (
                <p className="mt-1 text-[12px] text-slate-600 dark:text-white/35">{item.request}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-white/40">
              <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
              {isEditing ? (
                <input
                  type="text"
                  value={editImpact}
                  onChange={(e) => setEditImpact(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-900 focus:border-[var(--gf-indigo)] focus:outline-none dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  placeholder="Impact detail..."
                />
              ) : (
                item.impact
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Save changes"
                    onClick={() => handleSave(index)}
                    className="h-8 w-8 border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Cancel editing"
                    onClick={() => setEditingIndex(null)}
                    className="h-8 w-8 border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Edit request"
                    onClick={() => startEditing(index)}
                    className="h-8 w-8 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white/60 dark:hover:bg-white/[0.06]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Approve request"
                    onClick={() => handleApprove(index)}
                    className="h-8 w-8 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Reject request"
                    onClick={() => handleReject(index)}
                    className="h-8 w-8 border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
