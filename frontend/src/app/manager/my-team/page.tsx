"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { apiFetch } from "@/lib/api"
import { getStoredToken, getCurrentUser } from "@/services/auth.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Search, Target, AlertCircle, ListTodo, Zap, ShieldAlert, Activity } from "lucide-react"

import HeatMap from "@/components/dashboard/HeatMap"
import ProgressChart from "@/components/dashboard/ProgressChart"

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

export default function ManagerMyTeamPage() {
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "idle">("all")
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

  const filteredEmployees = (hierarchy?.employees || []).filter(member => {
    // 1. Search Filter
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.id.toString() === searchTerm;
    if (!matchesSearch) return false;

    // 2. Status Filter
    const isIdle = (member.goals?.length || 0) === 0 && (member.tasks?.length || 0) === 0

    if (statusFilter === "active" && isIdle) return false;
    if (statusFilter === "idle" && !isIdle) return false;

    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
            My Team
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your direct reports, monitor their progress, and view your upline.
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
            {/* Upline Section */}
            {hierarchy?.admin && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Your Upline
                </h2>
                <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] backdrop-blur-md shadow-sm max-w-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center shadow-md">
                      {hierarchy.admin.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{hierarchy.admin.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{hierarchy.admin.email}</span>
                        <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/20 text-[10px] py-0 px-2 font-bold uppercase">
                          {hierarchy.admin.role.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Team Progress Charts */}
            <section className="grid gap-6 xl:grid-cols-2">
              <Card className="product-surface rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                    Progress over time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProgressChart />
                </CardContent>
              </Card>

              <Card className="product-surface rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-950 dark:text-white">
                    Activity heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HeatMap />
                </CardContent>
              </Card>
            </section>

            {/* Direct Reports Section */}
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Direct Reports
                </h2>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex gap-2 w-full sm:max-w-xl">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9 h-9 text-sm"
                      placeholder="Filter by name, email or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[140px] h-9 text-sm">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="manager">Managers</SelectItem>
                      <SelectItem value="employee">Employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex bg-slate-100 dark:bg-white/[0.05] p-1 rounded-lg">
                  <button onClick={() => setStatusFilter("all")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter === "all" ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>All</button>
                  <button onClick={() => setStatusFilter("active")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter === "active" ? "bg-white dark:bg-slate-800 shadow-sm text-[var(--gf-indigo)]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Active (Working)</button>
                  <button onClick={() => setStatusFilter("idle")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter === "idle" ? "bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Idle</button>
                </div>
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="py-20 text-center glass-card rounded-2xl">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">No Employees Found</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    Try adjusting your search or status filters.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {filteredEmployees.map((member) => {
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
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-[var(--gf-indigo)]/10 text-[var(--gf-indigo)] font-bold text-xs flex items-center justify-center">
                                {member.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{member.name} <span className="text-xs text-slate-400 font-normal">#{member.id}</span></h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate mt-0.5">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                            <Badge className={
                              isIdle 
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400" 
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                            }>
                              {isIdle ? "Idle" : "Active"}
                            </Badge>
                          </div>

                          {!isIdle && (
                            <div className="space-y-1.5 mb-5 p-3 rounded-lg bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/[0.04]">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Average Completion</span>
                                <span className="text-slate-900 dark:text-white font-bold">{avgProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[var(--gf-indigo)] to-[var(--gf-cyan)] transition-all" style={{ width: `${avgProgress}%` }}></div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            {/* Tasks section */}
                            {memberTasks.length > 0 && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                  <ListTodo className="w-3.5 h-3.5 text-cyan-500" /> Assigned Tasks ({memberTasks.length})
                                </div>
                                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                                  {memberTasks.map((t) => {
                                    const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed";
                                    const isCompleted = t.status === "completed";
                                    return (
                                    <div key={t.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] flex justify-between items-center text-xs">
                                      <div className="min-w-0 pr-3">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={t.title}>{t.title}</p>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-0.5">
                                          Status: <span className="capitalize font-medium">{t.status}</span>
                                          {t.deadline && ` • Due: ${new Date(t.deadline).toLocaleDateString()}`}
                                          {isOverdue && <span className="ml-1.5 px-1 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-sm font-bold text-[8px] uppercase">Overdue</span>}
                                          {isCompleted && <span className="ml-1.5 px-1 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-sm font-bold text-[8px] uppercase">On Time</span>}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="w-16 h-1 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                                          <div className="h-full bg-cyan-500" style={{ width: `${t.progress}%` }}></div>
                                        </div>
                                        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold w-8 text-right">{t.progress}%</span>
                                      </div>
                                    </div>
                                  )})}
                                </div>
                              </div>
                            )}

                            {/* Goals section */}
                            {memberGoals.length > 0 && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-emerald-500" /> Assigned Goals ({memberGoals.length})
                                </div>
                                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                                  {memberGoals.map((g) => (
                                    <div key={g.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] flex justify-between items-center text-xs">
                                      <div className="min-w-0 pr-3">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={g.title}>{g.title}</p>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-0.5">Status: <span className="capitalize font-medium">{g.status}</span></p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="w-16 h-1 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                                          <div className="h-full bg-emerald-500" style={{ width: `${g.progress}%` }}></div>
                                        </div>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold w-8 text-right">{g.progress}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isIdle && (
                              <div className="text-center py-4 border border-dashed border-slate-200 dark:border-white/[0.06] rounded-xl bg-slate-50/20 dark:bg-white/[0.01]">
                                <AlertCircle className="w-6 h-6 text-amber-500/80 mx-auto mb-2" />
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Employee is currently Idle</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">No tasks or goals assigned</p>
                              </div>
                            )}
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
