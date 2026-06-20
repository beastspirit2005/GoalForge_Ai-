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
import { listTargets, listTasks, createTask, updateTask, deleteTask, autoAssignTask } from "@/services/enterprise.service"
import { format } from "date-fns"
import { Bot, Sparkles, Target, Zap, Clock, User, CheckCircle2, Edit, Trash2 } from "lucide-react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { addLocalAuditLog } from "@/lib/local-audit-logs"
import { addLocalNotification } from "@/lib/local-notifications"

export default function ManagerTasksPage() {
  const { user } = useAuth()
  const [targets, setTargets] = useState<any[]>([])
  const [tasksByTarget, setTasksByTarget] = useState<Record<number, any[]>>({})
  const [loading, setLoading] = useState(true)

  // Task Creation Form
  const [open, setOpen] = useState(false)
  const [activeTargetId, setActiveTargetId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")
  const [skills, setSkills] = useState("")
  const [editTaskId, setEditTaskId] = useState<number | null>(null)

  // AI Assignment state
  const [assigningTask, setAssigningTask] = useState<number | null>(null)
  const [aiProvider, setAiProvider] = useState("gemini")
  const [aiModel, setAiModel] = useState("gemini-2.5-flash")

  const handleProviderChange = (val: string) => {
    setAiProvider(val)
    if (val === "ollama") setAiModel("llama3:8b")
    else setAiModel("gemini-2.5-flash")
  }

async function fetchData() {
    setLoading(true)
    try {
      const tData = await listTargets()
      setTargets(tData)
      
      const tasksMap: Record<number, any[]> = {}
      await Promise.all(tData.map(async (t) => {
        const tasks = await listTasks(t.id)
        tasksMap[t.id] = tasks
      }))
      setTasksByTarget(tasksMap)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSaveTask = async () => {
    if (!activeTargetId) return
    try {
      const payload = {
        target_id: activeTargetId,
        title,
        description,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        required_skills: skills.split(",").map(s => s.trim()).filter(Boolean)
      }
      
      if (editTaskId) {
        await updateTask(editTaskId, payload)
        addLocalAuditLog({
          user: user?.name || "Manager",
          action: "task_updated",
          entity: "task",
          entityId: editTaskId.toString(),
          detail: `Updated Task: ${title}`
        })
      } else {
        const taskRes = await createTask(payload)
        addLocalAuditLog({
          user: user?.name || "Manager",
          action: "task_created",
          entity: "task",
          entityId: taskRes.id.toString(),
          detail: `Created Task: ${title}`
        })
      }
      
      setOpen(false)
      resetForm()
      
      const tasks = await listTasks(activeTargetId)
      setTasksByTarget(prev => ({ ...prev, [activeTargetId]: tasks }))
    } catch (error) {
      console.error("Error saving task:", error)
      alert("Failed to save task")
    }
  }

  const handleDeleteTask = async (taskId: number, targetId: number, tTitle: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(taskId)
      addLocalAuditLog({
        user: user?.name || "Manager",
        action: "task_deleted",
        entity: "task",
        entityId: taskId.toString(),
        detail: `Deleted Task: ${tTitle}`
      })
      const tasks = await listTasks(targetId)
      setTasksByTarget(prev => ({ ...prev, [targetId]: tasks }))
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("Failed to delete task")
    }
  }

  const resetForm = () => {
    setEditTaskId(null)
    setTitle("")
    setDescription("")
    setDeadline("")
    setSkills("")
  }

  const openEdit = (task: any, targetId: number) => {
    setActiveTargetId(targetId)
    setEditTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description || "")
    setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "")
    setSkills(task.required_skills ? task.required_skills.join(", ") : "")
    setOpen(true)
  }

  const handleAutoAssign = async (taskId: number, targetId: number) => {
    setAssigningTask(taskId)
    try {
      const res = await autoAssignTask(taskId, aiProvider, aiModel)
      if (res.status === "success") {
        const tasks = await listTasks(targetId)
        setTasksByTarget(prev => ({ ...prev, [targetId]: tasks }))
        
        const taskObj = (tasksByTarget[targetId] || []).find(t => t.id === taskId)
        const tTitle = taskObj ? taskObj.title : `Task #${taskId}`
        
        addLocalAuditLog({
          user: user?.name || "Manager",
          action: "task_assigned",
          entity: "task",
          entityId: taskId.toString(),
          detail: `AI auto-assigned task: ${tTitle}`
        })
        
        if (res.assigned_user_id) {
           addLocalNotification({
             recipientRole: "employee",
             title: "AI Assigned You a Task",
             message: `The Engine assigned you task: ${tTitle}`,
             type: "info"
           })
        }
      } else {
        alert("Failed to auto-assign: " + res.reason)
      }
    } catch (error) {
      console.error("Auto assign error", error)
      alert("An error occurred during AI Auto-Assignment")
    } finally {
      setAssigningTask(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
            Target Breakdown
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deconstruct executive targets and deploy AI for autonomous task delegation.
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(val) => {
        setOpen(val)
        if (!val) resetForm()
      }}>
        <DialogContent className="sm:max-w-[500px] border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c0915]/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--gf-indigo)]" />
              {editTaskId ? "Edit Task" : "Initialize New Task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Task Title</label>
              <Input className="bg-slate-50 dark:bg-black/20" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Build Database Schema" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
              <Textarea className="bg-slate-50 dark:bg-black/20 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Specific task details..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deadline</label>
                <Input type="date" className="bg-slate-50 dark:bg-black/20" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Required Skills</label>
                <Input className="bg-slate-50 dark:bg-black/20" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js" />
              </div>
            </div>
            <Button onClick={handleSaveTask} className="w-full bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-cyan)] hover:opacity-90 text-white mt-6 h-11 rounded-xl shadow-lg shadow-[var(--gf-indigo)]/25" disabled={!title}>
              {editTaskId ? "Save Changes" : "Generate Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Zap className="w-8 h-8 animate-pulse text-[var(--gf-indigo)]" />
          <p>Syncing organization targets...</p>
        </div>
      ) : targets.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center glass-card rounded-2xl">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Assigned Targets</h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            You currently have no overarching targets assigned to your managerial portfolio.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {targets.map(target => (
            <div key={target.id} className="relative rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] backdrop-blur-md overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[var(--gf-indigo)] to-[var(--gf-cyan)] opacity-80"></div>
              
              {/* Target Header */}
              <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-white/[0.06] bg-gradient-to-b from-slate-50/50 to-transparent dark:from-white/[0.02]">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="bg-[var(--gf-indigo)]/10 text-[var(--gf-indigo)] border-[var(--gf-indigo)]/20 dark:bg-[var(--gf-indigo)]/20 dark:border-[var(--gf-indigo)]/30">
                        Target #{target.id}
                      </Badge>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{target.title}</h2>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">{target.description}</p>
                  </div>
                  <Button 
                    className="shrink-0 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-700 dark:text-white shadow-sm rounded-xl h-10 px-5 transition-all"
                    onClick={() => {
                      setActiveTargetId(target.id)
                      setOpen(true)
                    }}
                  >
                    + Add Task
                  </Button>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 pt-5 border-t border-slate-200/60 dark:border-white/[0.04]">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium capitalize">{target.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{target.deadline ? format(new Date(target.deadline), "MMM d, yyyy") : "No deadline"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-cyan)]" style={{ width: `${Math.round(target.progress * 100)}%` }}></div>
                    </div>
                    <span className="font-medium">{Math.round(target.progress * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="p-6 sm:p-8 bg-slate-50/30 dark:bg-transparent">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Deconstructed Tasks
                </h3>
                
                {tasksByTarget[target.id]?.length === 0 ? (
                  <div className="py-8 text-center border border-dashed rounded-xl border-slate-300 dark:border-slate-700/50 text-slate-500 text-sm">
                    No tasks created. Break down this target to begin execution.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tasksByTarget[target.id]?.map(task => (
                      <Card key={task.id} className="relative group bg-white dark:bg-[#120f1c] border-slate-200 dark:border-white/[0.05] shadow-sm hover:shadow-md hover:border-[var(--gf-indigo)]/30 dark:hover:border-[var(--gf-indigo)]/40 transition-all duration-300 overflow-hidden">
                        <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between">
                          <CardTitle className="text-base font-semibold leading-tight group-hover:text-[var(--gf-indigo)] transition-colors pr-2">{task.title}</CardTitle>
                          <div className="flex gap-1 shrink-0 -mt-1 -mr-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[var(--gf-indigo)]" onClick={() => openEdit(task, target.id)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500" onClick={() => handleDeleteTask(task.id, target.id, task.title)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 flex flex-col h-[calc(100%-3rem)]">
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-grow">{task.description}</p>
                          
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {task.required_skills?.map((skill: string) => (
                              <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/[0.04]">
                                {skill}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/[0.05]">
                            {task.assigned_to ? (
                              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                <User className="w-4 h-4" /> {task.assigned_user_name || `ID: ${task.assigned_to}`}
                              </div>
                            ) : (
                              <div className="flex w-full items-center gap-2">
                                <Select value={aiProvider} onValueChange={handleProviderChange}>
                                  <SelectTrigger className="w-[110px] h-9 text-xs border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/20 focus:ring-[var(--gf-indigo)]">
                                    <SelectValue placeholder="AI Engine" />
                                  </SelectTrigger>
                                  <SelectContent className="fixed-dark bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectItem value="gemini">Gemini</SelectItem>
                                    <SelectItem value="ollama">Ollama (llama3:8b)</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button 
                                  size="sm" 
                                  className="flex-1 h-9 bg-[var(--gf-indigo)]/10 hover:bg-[var(--gf-indigo)]/20 text-[var(--gf-indigo)] dark:text-indigo-300 border border-[var(--gf-indigo)]/20 transition-all"
                                  onClick={() => handleAutoAssign(task.id, target.id)}
                                  disabled={assigningTask === task.id}
                                >
                                  {assigningTask === task.id ? (
                                    <span className="flex items-center gap-2"><Bot className="h-3.5 w-3.5 animate-pulse" /> Routing...</span>
                                  ) : (
                                    <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Auto-Assign</span>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
