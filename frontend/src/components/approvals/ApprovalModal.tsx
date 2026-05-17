"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type ApprovalModalProps = {
  open: boolean
  onClose: () => void
  goalTitle: string
  onApprove: (data: { weightage?: number; target?: string; comment?: string }) => void
  onReject: (comment: string) => void
}

export default function ApprovalModal({
  open,
  onClose,
  goalTitle,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  const [comment, setComment] = useState("")
  const [weightage, setWeightage] = useState("")
  const [target, setTarget] = useState("")

  const handleApprove = () => {
    onApprove({
      weightage: weightage ? parseFloat(weightage) : undefined,
      target: target || undefined,
      comment: comment || undefined,
    })
    resetAndClose()
  }

  const handleReject = () => {
    onReject(comment)
    resetAndClose()
  }

  const resetAndClose = () => {
    setComment("")
    setWeightage("")
    setTarget("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-950">
            Review Goal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700">{goalTitle}</p>
          </div>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            Adjust weightage (optional)
            <Input
              type="number"
              placeholder="e.g. 20"
              value={weightage}
              onChange={(e) => setWeightage(e.target.value)}
              min={10}
              max={100}
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            Adjust target (optional)
            <Input
              placeholder="e.g. Increase from 40% to 65%"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            Comment / Feedback
            <Textarea
              placeholder="Add review feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-20"
            />
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
            onClick={handleReject}
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>
            <Check className="h-4 w-4" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
