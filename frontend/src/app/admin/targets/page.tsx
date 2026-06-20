"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listTargets, createTarget, updateTarget, deleteTarget } from "@/services/enterprise.service"
import { API_URL } from "@/lib/api"
import { getStoredToken } from "@/services/auth.service"
import { format } from "date-fns"
import { Target, Users, Calendar, Briefcase, Plus, CheckCircle2, Edit, Trash2 } from "lucide-react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { addLocalAuditLog } from "@/lib/local-audit-logs"
import { addLocalNotification } from "@/lib/local-notifications"

export default function AdminTargetsPage() {
  const { user } = useAuth()
  const [targets, setTargets] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [managerId, setManagerId] = useState("")
  const [deadline, setDeadline] = useState("")
  const [skills, setSkills] = useState("")
  const [editTargetId, setEditTargetId] = useState<number | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      const [tData, mData] = await Promise.all([
        listTargets(),
        fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${getStoredToken()}` }
        }).then(res => {
          if (!res.ok) return [];
          return res.json();
        }).catch(() => [])
      ])
      setTargets(tData)
      setManagers(mData.filter((u: any) => u.role === "manager"))
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSave = async () => {
    try {
      const payload = {
        title,
        description,
        manager_id: parseInt(managerId),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        required_skills: skills.split(",").map(s => s.trim()).filter(Boolean)
      }
      
      let targetRes;
      if (editTargetId) {
        targetRes = await updateTarget(editTargetId, payload)
        addLocalAuditLog({
          user: user?.name || "Admin",
          action: "target_updated",
          entity: "target",
          entityId: editTargetId.toString(),
          detail: `Updated Enterprise Target: ${title}`
        })
      } else {
        targetRes = await createTarget(payload)
        addLocalAuditLog({
          user: user?.name || "Admin",
          action: "target_created",
          entity: "target",
          entityId: targetRes.id.toString(),
          detail: `Created Enterprise Target: ${title}`
        })
        
        // Notify Manager
        if (targetRes.manager_id) {
           addLocalNotification({
             userId: targetRes.manager_id.toString(),
             title: "New Target Delegated",
             message: `You have been assigned a new target: ${title}`,
             type: "info"
           })
        }
      }
      
      setOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Error saving target:", error)
      alert("Failed to save target")
    }
  }

  const handleDelete = async (id: number, tTitle: string) => {
    if (!confirm("Are you sure you want to delete this target? All associated tasks will be lost.")) return;
    try {
      await deleteTarget(id)
      addLocalAuditLog({
        user: user?.name || "Admin",
        action: "target_deleted",
        entity: "target",
        entityId: id.toString(),
        detail: `Deleted Enterprise Target: ${tTitle}`
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting target:", error)
      alert("Failed to delete target")
    }
  }

  const resetForm = () => {
    setEditTargetId(null)
    setTitle("")
    setDescription("")
    setManagerId("")
    setDeadline("")
    setSkills("")
  }

  const openEdit = (t: any) => {
    setEditTargetId(t.id)
    setTitle(t.title)
    setDescription(t.description || "")
    setManagerId(t.manager_id ? t.manager_id.toString() : "")
    setDeadline(t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : "")
    setSkills(t.required_skills ? t.required_skills.join(", ") : "")
    setOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-cyan)] bg-clip-text text-transparent">
            Enterprise Targets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define high-level organizational objectives and deploy them to your management team.
          </p>
        </div>

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val)
          if (!val) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-cyan)] hover:opacity-90 text-white shadow-lg shadow-[var(--gf-indigo)]/20 rounded-xl px-6 h-11 transition-all">
              <Plus className="w-4 h-4 mr-2" /> Deploy Target
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c0915]/95 backdrop-blur-xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Target className="w-5 h-5 text-[var(--gf-indigo)]" /> {editTargetId ? "Edit Enterprise Target" : "Deploy Enterprise Target"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Objective</label>
                <Input className="bg-slate-50 dark:bg-black/20 focus:ring-[var(--gf-indigo)]/50" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Launch Q4 Marketing Campaign" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Strategic Description</label>
                <Textarea className="bg-slate-50 dark:bg-black/20 focus:ring-[var(--gf-indigo)]/50 resize-none h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="High level objectives and desired outcomes..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delegated Manager</label>
                  <Select value={managerId} onValueChange={setManagerId}>
                    <SelectTrigger className="bg-slate-50 dark:bg-black/20 focus:ring-[var(--gf-indigo)]/50">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {managers.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {m.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deadline</label>
                  <Input type="date" className="bg-slate-50 dark:bg-black/20 focus:ring-[var(--gf-indigo)]/50" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Required Talent Skills (Comma Separated)</label>
                <Input className="bg-slate-50 dark:bg-black/20 focus:ring-[var(--gf-indigo)]/50" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Digital Marketing" />
              </div>
              <Button onClick={handleSave} className="w-full bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-cyan)] hover:opacity-90 text-white mt-4 h-11 rounded-xl shadow-lg shadow-[var(--gf-indigo)]/25" disabled={!title || !managerId}>
                {editTargetId ? "Save Changes" : "Initialize Target Cascade"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Target className="w-8 h-8 animate-pulse text-[var(--gf-indigo)]" />
          <p>Loading enterprise matrix...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {targets.map((target) => (
            <Card key={target.id} className="group relative overflow-hidden bg-white/70 dark:bg-[#120f1c]/70 backdrop-blur-xl border border-slate-200/50 dark:border-white/[0.05] hover:border-[var(--gf-indigo)]/30 dark:hover:border-[var(--gf-indigo)]/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[var(--gf-indigo)]/5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-cyan)] opacity-70 group-hover:opacity-100 transition-opacity"></div>
              
              <CardHeader className="p-6 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <Badge variant="outline" className="bg-slate-100 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.05] text-slate-500 font-mono text-[10px]">
                      ID: {target.id}
                    </Badge>
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-[var(--gf-indigo)] transition-colors mt-1">{target.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {target.status === "completed" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="capitalize text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 shrink-0">
                        {target.status}
                      </Badge>
                    )}
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[var(--gf-indigo)]" onClick={() => openEdit(target)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500" onClick={() => handleDelete(target.id, target.title)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-3 leading-relaxed">{target.description}</p>
              </CardHeader>
              
              <CardContent className="p-6 pt-2">
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5" /> Required Skill Matrix
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {target.required_skills?.map((skill: string) => (
                        <span key={skill} className="px-2.5 py-1 rounded-md bg-[var(--gf-indigo)]/5 dark:bg-[var(--gf-indigo)]/10 text-[var(--gf-indigo)] text-[11px] font-medium border border-[var(--gf-indigo)]/10 dark:border-[var(--gf-indigo)]/20">
                          {skill}
                        </span>
                      ))}
                      {(!target.required_skills || target.required_skills.length === 0) && (
                        <span className="text-xs text-slate-400 italic">Universal Scope</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-100 dark:border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] px-2 py-1 rounded-md">
                      <Users className="w-3.5 h-3.5" />
                      Manager: <span className="font-medium text-slate-900 dark:text-white">{target.manager_name || `ID: ${target.manager_id}`}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {target.deadline ? format(new Date(target.deadline), "MMM d, yyyy") : "Open-ended"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {targets.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center glass-card rounded-2xl border-dashed">
              <div className="w-16 h-16 rounded-full bg-[var(--gf-indigo)]/10 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-[var(--gf-indigo)]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Initialize the Cascade</h3>
              <p className="text-slate-500 max-w-sm mt-2 leading-relaxed">
                You haven&apos;t defined any organizational targets yet. Create your first target to begin deploying tasks to managers.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
