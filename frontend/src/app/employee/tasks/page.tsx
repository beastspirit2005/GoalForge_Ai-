"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { listTasks } from "@/services/enterprise.service"
import { format } from "date-fns"
import { CheckCircle2, Circle, Sparkles, Brain, Clock, Target } from "lucide-react"
import DashboardLayout from "@/components/layout/DashboardLayout"

export default function EmployeeTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

async function fetchData() {
    setLoading(true)
    try {
      const tData = await listTasks()
      setTasks(tData.filter(t => t.assigned_to === user?.id))
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
            AI Assigned Workstream
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Specific tasks perfectly routed to you by the AI Engine based on your exact skill profile.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Brain className="w-8 h-8 animate-pulse text-emerald-500" />
          <p>Scanning your AI assignments...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id} className="group relative bg-white/70 dark:bg-[#120f1c]/70 backdrop-blur-xl border-slate-200/50 dark:border-white/[0.05] hover:border-emerald-500/30 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-500/5">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-cyan-400 opacity-80 group-hover:opacity-100"></div>
              
              <CardHeader className="p-6 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-xl font-bold leading-tight text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    {task.title}
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 font-mono text-[10px]">
                    <Target className="w-3 h-3 mr-1 inline" /> T-{task.target_id}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mt-3 leading-relaxed">{task.description}</p>
              </CardHeader>
              
              <CardContent className="p-6 pt-2">
                <div className="space-y-5">
                  <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-4 border border-slate-100 dark:border-white/[0.03]">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                      <Brain className="w-3.5 h-3.5" /> AI Match Criteria
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {task.required_skills?.map((skill: string) => (
                        <span key={skill} className="px-2.5 py-1 rounded-md bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {skill}
                        </span>
                      ))}
                      {(!task.required_skills || task.required_skills.length === 0) && (
                        <span className="text-xs text-slate-500 italic bg-white dark:bg-black/20 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">Assigned based on general availability</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs pt-2">
                    <Badge variant="secondary" className="capitalize bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300">
                      {task.status}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {task.deadline ? format(new Date(task.deadline), "MMM d") : "No fixed deadline"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {tasks.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center glass-card rounded-2xl border-dashed">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/[0.03] flex items-center justify-center mb-5 border border-slate-200 dark:border-white/[0.05] shadow-inner">
                <Circle className="w-6 h-6 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Inbox Zero</h3>
              <p className="text-slate-500 max-w-sm mt-2 leading-relaxed">
                The AI Engine has not routed any tasks to your queue yet. Enjoy your downtime or assist your teammates!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
