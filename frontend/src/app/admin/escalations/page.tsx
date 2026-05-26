"use client"

import { useMemo, useState, useEffect } from "react"
import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert } from "lucide-react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { addLocalNotification } from "@/lib/local-notifications"
import { addLocalAuditLog } from "@/lib/local-audit-logs"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type EscalationStatus = "Open" | "Acknowledged" | "Resolved"

type Escalation = {
  id: number
  employee: string
  goal: string
  department: string
  risk: "High" | "Medium" | "Low"
  status: EscalationStatus
  progress: number
  owner: string
  updated: string
  note: string
  adminRemarks?: string
  resolutionNote?: string
}

const initialEscalations: Escalation[] = [
  {
    id: 1,
    employee: "Kabir Singh",
    goal: "Grow enterprise pipeline",
    department: "Sales",
    risk: "High",
    status: "Open" as const,
    progress: 40,
    owner: "Priya Nair",
    updated: "17 May 2026, 10:20",
    note: "Progress is below target with deadline pressure increasing.",
  },
  {
    id: 2,
    employee: "Neha Rao",
    goal: "Improve sprint delivery predictability",
    department: "Engineering",
    risk: "Medium",
    status: "Acknowledged" as const,
    progress: 58,
    owner: "Priya Nair",
    updated: "16 May 2026, 16:45",
    note: "Dependency board needs manager follow-up before the next check-in.",
  },
  {
    id: 3,
    employee: "Aarav Mehta",
    goal: "Launch onboarding analytics",
    department: "People Ops",
    risk: "High",
    status: "Open" as const,
    progress: 36,
    owner: "Rohan Kapoor",
    updated: "16 May 2026, 09:15",
    note: "Milestone completion is slipping after two missed weekly updates.",
  },
]

const statusStyles: Record<string, string> = {
  Open: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  Acknowledged: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
}

const riskStyles: Record<string, string> = {
  High: "text-rose-600 dark:text-rose-300",
  Medium: "text-amber-600 dark:text-amber-300",
  Low: "text-emerald-600 dark:text-emerald-300",
}

export default function AdminEscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [mounted, setMounted] = useState(false)
  const [adminRemarksInput, setAdminRemarksInput] = useState("")
  const [resolutionNoteInput, setResolutionNoteInput] = useState("")

  const selectedEscalation = escalations.find((item) => item.id === selectedId) ?? null

  useEffect(() => {
    if (selectedEscalation) {
      setAdminRemarksInput(selectedEscalation.adminRemarks || "")
      setResolutionNoteInput(selectedEscalation.resolutionNote || "")
    } else {
      setAdminRemarksInput("")
      setResolutionNoteInput("")
    }
  }, [selectedId, selectedEscalation])

  const loadEscalations = () => {
    try {
      const stored = window.localStorage.getItem("goalforge.demo.escalations")
      if (stored) {
        const parsed = JSON.parse(stored)
        setEscalations(parsed)
        if (parsed.length > 0 && selectedId === null) {
          setSelectedId(parsed[0].id)
        }
      } else {
        window.localStorage.setItem("goalforge.demo.escalations", JSON.stringify(initialEscalations))
        setEscalations(initialEscalations)
        if (initialEscalations.length > 0 && selectedId === null) {
          setSelectedId(initialEscalations[0].id)
        }
      }
    } catch (e) {
      console.error("Failed to load escalations", e)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadEscalations()

    const handleUpdate = () => loadEscalations()
    window.addEventListener("escalations-updated", handleUpdate)
    return () => window.removeEventListener("escalations-updated", handleUpdate)
  }, [selectedId])

  const saveEscalations = (newEscalations: Escalation[]) => {
    setEscalations(newEscalations)
    window.localStorage.setItem("goalforge.demo.escalations", JSON.stringify(newEscalations))
  }

  const escalationStats = useMemo(() => {
    const count = (status: EscalationStatus) => escalations.filter((item) => item.status === status).length

    return [
      { label: "Open", value: count("Open"), tone: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/10" },
      { label: "Acknowledged", value: count("Acknowledged"), tone: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
      { label: "Resolved", value: count("Resolved"), tone: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    ]
  }, [escalations])

  const handleRunScan = () => {
    const scannedEscalation: Escalation = {
      id: 4,
      employee: "Maya Desai",
      goal: "Stabilize lifecycle reporting",
      department: "Marketing",
      risk: "Medium",
      status: "Open",
      progress: 44,
      owner: "Rohan Kapoor",
      updated: "17 May 2026, 11:05",
      note: "New scan detected stalled progress and missing weekly evidence.",
    }

    const next = escalations.some((item) => item.id === scannedEscalation.id)
      ? escalations.map((item) =>
          item.id === scannedEscalation.id ? { ...item, status: "Open" as const, updated: scannedEscalation.updated } : item
        )
      : [scannedEscalation, ...escalations]

    saveEscalations(next)
    setSelectedId(scannedEscalation.id)
    setMessage("Scan completed. 1 escalation needs review.")
  }

  const handleReview = (id: number) => {
    setSelectedId(id)
    setMessage("Review panel opened.")
  }

  const updateSelectedStatus = async (status: EscalationStatus) => {
    if (!selectedEscalation) {
      return
    }

    const timestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).replace(",", " at")

    const next = escalations.map((item) =>
      item.id === selectedEscalation.id
        ? {
            ...item,
            status,
            updated: timestamp,
            adminRemarks: adminRemarksInput,
            resolutionNote: status === "Resolved" ? resolutionNoteInput : item.resolutionNote
          }
        : item
    )
    saveEscalations(next)
    
    try {
      await apiFetch(`/escalations/${selectedEscalation.id}`, {
        method: "PUT",
        body: {
          status: status.toLowerCase(),
          admin_remarks: adminRemarksInput,
          resolution_note: status === "Resolved" ? resolutionNoteInput : undefined
        }
      })
    } catch (e) {
      console.warn("Failed to update escalation via API (mock mode fallback)", e)
    }

    setMessage(`Escalation marked as ${status.toLowerCase()}.`)

    // Notify the employee!
    if (status === "Acknowledged") {
      addLocalNotification({
        title: "Escalation Acknowledged",
        message: `Your issue is acknowledged and under consideration. Escalation for "${selectedEscalation.goal}" was acknowledged by Admin on ${timestamp}.`,
        type: "info",
        recipientRole: "employee"
      })
      addLocalAuditLog({
        user: "Admin",
        action: "escalation_acknowledged",
        entity: "escalation",
        entityId: selectedEscalation.id,
        detail: `Acknowledged escalation for "${selectedEscalation.goal}". Remarks: ${adminRemarksInput || "None"}`
      })
    } else if (status === "Resolved") {
      // Update goal status in local storage if present
      try {
        const storedGoals = window.localStorage.getItem("goalforge.demo.goals")
        if (storedGoals) {
          const parsed = JSON.parse(storedGoals)
          const nextGoals = parsed.map((g: any) => {
            if (g.title === selectedEscalation.goal) {
              return { ...g, status: "Approved" }
            }
            return g
          })
          window.localStorage.setItem("goalforge.demo.goals", JSON.stringify(nextGoals))
          window.dispatchEvent(new Event("local-goals-updated"))
        }
      } catch (e) {
        console.error("Failed to update goal on escalation resolution", e)
      }

      addLocalNotification({
        title: "Escalation Resolved",
        message: `Your issue is solved. Escalation for "${selectedEscalation.goal}" has been marked as Resolved by Admin on ${timestamp}.`,
        type: "success",
        recipientRole: "employee"
      })
      addLocalAuditLog({
        user: "Admin",
        action: "escalation_resolved",
        entity: "escalation",
        entityId: selectedEscalation.id,
        detail: `Resolved escalation for "${selectedEscalation.goal}". Note: ${resolutionNoteInput}`
      })
    }
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <h1 className="text-3xl font-semibold tracking-normal text-foreground">
                Escalations
              </h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor at-risk goals that need leadership attention.
            </p>
          </div>
          <Button className="h-10 gap-2 text-sm" onClick={handleRunScan}>
            <AlertTriangle className="h-4 w-4" />
            Run scan
          </Button>
        </div>

        {message ? (
          <div className="rounded-lg border border-[var(--gf-indigo)]/20 bg-[var(--gf-indigo)]/10 px-4 py-3 text-sm font-medium text-[var(--gf-indigo)]">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {escalationStats.map((stat) => (
            <Card key={stat.label} className="product-surface rounded-xl">
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className={`mt-2 text-3xl font-semibold ${stat.tone}`}>{stat.value}</p>
                </div>
                <div className={`grid h-11 w-11 place-items-center rounded-md ${stat.bg} ${stat.tone}`}>
                  {stat.label === "Resolved" ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="product-surface rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Active escalation queue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {escalations.map((item) => (
                <div key={item.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_180px_120px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.goal}</p>
                      <Badge className={statusStyles[item.status]}>{item.status}</Badge>
                      <span className={`text-xs font-semibold ${riskStyles[item.risk]}`}>
                        {item.risk} risk
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.employee} / {item.department} / Owner: {item.owner}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-semibold text-foreground">{item.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-rose-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-xs text-muted-foreground">{item.updated}</p>
                    <Button
                      variant="outline"
                      className="mt-2 h-8 text-xs"
                      onClick={() => handleReview(item.id)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedEscalation ? (
          <Card className="product-surface rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Review escalation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">{selectedEscalation.goal}</h2>
                  <Badge className={statusStyles[selectedEscalation.status]}>{selectedEscalation.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedEscalation.employee} / {selectedEscalation.department} / Owner: {selectedEscalation.owner}
                </p>
                <p className="mt-3 text-sm text-foreground">{selectedEscalation.note}</p>
                {selectedEscalation.adminRemarks && (
                  <div className="mt-4 rounded-md bg-[var(--gf-indigo)]/5 p-3 border border-[var(--gf-indigo)]/10">
                    <p className="text-xs font-semibold text-[var(--gf-indigo)] mb-1">Admin Remarks</p>
                    <p className="text-sm text-foreground">{selectedEscalation.adminRemarks}</p>
                  </div>
                )}
                {selectedEscalation.resolutionNote && (
                  <div className="mt-2 rounded-md bg-emerald-500/5 p-3 border border-emerald-500/10">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Resolution Note</p>
                    <p className="text-sm text-foreground">{selectedEscalation.resolutionNote}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full rounded-md border border-slate-200 dark:border-white/[0.08] bg-transparent p-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--gf-indigo)]"
                  placeholder="Admin remarks..."
                  rows={3}
                  value={adminRemarksInput}
                  onChange={(e) => setAdminRemarksInput(e.target.value)}
                />
                {selectedEscalation.status !== "Resolved" && (
                  <input
                    className="w-full rounded-md border border-slate-200 dark:border-white/[0.08] bg-transparent p-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--gf-indigo)]"
                    placeholder="Resolution note (if resolving)..."
                    value={resolutionNoteInput}
                    onChange={(e) => setResolutionNoteInput(e.target.value)}
                  />
                )}

                <Button
                  variant="outline"
                  className="justify-start"
                  disabled={selectedEscalation.status !== "Open"}
                  onClick={() => updateSelectedStatus("Acknowledged")}
                >
                  Acknowledge
                </Button>
                <Button
                  className="justify-start"
                  disabled={selectedEscalation.status === "Resolved"}
                  onClick={() => updateSelectedStatus("Resolved")}
                >
                  Mark resolved
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
