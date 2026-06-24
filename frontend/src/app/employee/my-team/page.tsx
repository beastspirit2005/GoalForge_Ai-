"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { apiFetch } from "@/lib/api"
import { getStoredToken, getCurrentUser } from "@/services/auth.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Search, Target, AlertCircle, ListTodo, Zap, ShieldAlert, Activity } from "lucide-react"

type GoalType = {
  id: number;
  title: string;
  status: string;
  progress: number;
}

type TaskType = {
  id: number;
  title: string;
  status: string;
  progress: number;
  deadline: string;
}

type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  manager_id: number | null;
  goals: GoalType[];
  tasks: TaskType[];
}

type HierarchyData = {
  admin: TeamMember | null;
  manager: TeamMember | null;
  employees: TeamMember[];
  teammates: TeamMember[];
}

export default function EmployeeMyTeamPage() {
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const u = await getCurrentUser()
        setCurrentUser(u)
        
        const token = getStoredToken()
        const data = await apiFetch<HierarchyData>("/hierarchy/me", { token })
        setHierarchy(data)
        setError(false)
      } catch (err) {
        console.error("Failed to fetch hierarchy:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredTeammates = (hierarchy?.teammates || []).filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.id.toString() === searchTerm;
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
            My Team
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View your leadership structure and connect with your teammates.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Could not connect to API server to fetch team hierarchy.</span>
          </div>
        )}

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Zap className="w-8 h-8 animate-pulse text-[var(--gf-indigo)]" />
            <p className="text-sm">Loading team data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Leadership Section */}
            {(hierarchy?.admin || hierarchy?.manager) && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Leadership
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {hierarchy.manager && (
                    <div className="glass-card p-5 rounded-2xl border border-[var(--gf-indigo)]/20 dark:border-indigo-900/30 bg-white/50 dark:bg-white/[0.02] backdrop-blur-md shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gf-indigo)]/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--gf-indigo)] to-[var(--gf-cyan)] text-white font-bold text-xl flex items-center justify-center shadow-md">
                          {hierarchy.manager.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--gf-indigo)] dark:text-indigo-400 uppercase tracking-widest mb-0.5">Manager</p>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{hierarchy.manager.name}</h3>
                          <div className="flex flex-col mt-0.5">
                            <span className="text-xs text-slate-500">{hierarchy.manager.email}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{hierarchy.manager.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {hierarchy.admin && (
                    <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] backdrop-blur-md shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-300/10 dark:bg-slate-700/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-600 dark:to-slate-800 text-white font-bold text-xl flex items-center justify-center shadow-md">
                          {hierarchy.admin.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Admin</p>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{hierarchy.admin.name}</h3>
                          <div className="flex flex-col mt-0.5">
                            <span className="text-xs text-slate-500">{hierarchy.admin.email}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{hierarchy.admin.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Teammates Section */}
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Teammates ({filteredTeammates.length})
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9 h-9 text-sm"
                    placeholder="Search teammates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {filteredTeammates.length === 0 ? (
                <div className="py-20 text-center glass-card rounded-2xl">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">No Teammates Found</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    You appear to be the only employee reporting to this manager, or no matches found.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTeammates.map((member) => {
                    const memberGoals = member.goals || []
                    const memberTasks = member.tasks || []
                    const isIdle = memberGoals.length === 0 && memberTasks.length === 0
                    const totalItems = memberGoals.length + memberTasks.length
                    const avgProgress = totalItems > 0
                      ? Math.round(
                          (memberGoals.reduce((sum, g) => sum + g.progress, 0) + 
                           memberTasks.reduce((sum, t) => sum + (t.progress ?? 0), 0)) / totalItems
                        )
                      : 0

                    return (
                      <Card key={member.id} className="relative group bg-white dark:bg-[#120f1c] border-slate-200 dark:border-white/[0.05] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
                        <div className="p-5 flex-grow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {member.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">{member.name}</h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate mt-0.5">
                                  {member.department}
                                </p>
                              </div>
                            </div>
                            <Badge className={
                              isIdle 
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 shrink-0" 
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 shrink-0"
                            }>
                              {isIdle ? "Idle" : "Active"}
                            </Badge>
                          </div>

                          {!isIdle && (
                            <div className="space-y-1.5 mb-5 p-3 rounded-lg bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/[0.04]">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Progress</span>
                                <span className="text-slate-900 dark:text-white font-bold">{avgProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-400 transition-all" style={{ width: `${avgProgress}%` }}></div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3 mt-4">
                            <div className="flex items-center gap-4 text-[10px] text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5" />
                                <span>{memberGoals.length} Goals</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <ListTodo className="w-3.5 h-3.5" />
                                <span>{memberTasks.length} Tasks</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
