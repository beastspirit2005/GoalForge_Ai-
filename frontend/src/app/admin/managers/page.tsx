"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { apiFetch } from "@/lib/api"
import { getStoredToken, getCurrentUser } from "@/services/auth.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Search, Target, AlertCircle, CheckCircle2, User, Zap, Mail, ShieldAlert, ListTodo, Filter } from "lucide-react"

type UserType = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  manager_id: number | null;
  admin_id: number | null;
  is_active: boolean;
}

type GoalType = {
  id: number;
  user_id: number;
  title: string;
  status: string;
  progress: number;
  risk: string;
}

type TaskType = {
  id: number;
  target_id: number;
  title: string;
  description: string;
  assigned_to: number | null;
  assignees: { id: number; name: string }[];
  progress: number;
  status: string;
  deadline: string;
}

export default function AdminManagersPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [goals, setGoals] = useState<GoalType[]>([])
  const [tasks, setTasks] = useState<TaskType[]>([])
  const [selectedHierarchyId, setSelectedHierarchyId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [memberSearchTerm, setMemberSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "idle">("all")
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const u = await getCurrentUser()
        setCurrentUser(u as UserType)
        
        const token = getStoredToken()
        const [usersData, goalsData, tasksData] = await Promise.all([
          apiFetch<UserType[]>("/admin/users", { token }),
          apiFetch<GoalType[]>("/admin/goals", { token }),
          apiFetch<TaskType[]>("/tasks", { token })
        ])
        setUsers(usersData)
        setGoals(goalsData)
        setTasks(tasksData)
        
        // Auto-select first item
        let defaultId = null;
        if (u?.role === "super_admin") {
          const admins = usersData.filter(user => user.role === "admin" || user.role === "super_admin")
          if (admins.length > 0) defaultId = admins[0].id
        } else {
          const mgrs = usersData.filter(user => user.role === "manager")
          if (mgrs.length > 0) defaultId = mgrs[0].id
        }
        if (defaultId) setSelectedHierarchyId(defaultId)
        
        setError(false)
      } catch (err) {
        console.error("Failed to fetch admin managers data:", err)
        setError(true)
        // Fallback demo data
        const storedUsers = window.localStorage.getItem("goalforge.admin.users")
        if (storedUsers) {
          const uData = JSON.parse(storedUsers)
          setUsers(uData)
          if (currentUser?.role === "super_admin") {
            const admins = uData.filter((u: any) => u.role === "admin" || u.role === "super_admin")
            if (admins.length > 0) setSelectedHierarchyId(admins[0].id)
          } else {
            const mgrs = uData.filter((u: any) => u.role === "manager")
            if (mgrs.length > 0) setSelectedHierarchyId(mgrs[0].id)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const isSuperAdmin = currentUser?.role === "super_admin"

  const hierarchyList = users.filter(
    (u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.department.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch) return false;
      
      if (isSuperAdmin) {
        return u.role === "admin" || u.role === "super_admin";
      } else {
        return u.role === "manager";
      }
    }
  )

  const selectedHierarchyUser = users.find(u => u.id === selectedHierarchyId)
  
  let baseTeamMembers: UserType[] = [];
  if (selectedHierarchyUser) {
    if (isSuperAdmin) {
      // Find all managers under this admin
      const assignedManagers = users.filter(u => u.admin_id === selectedHierarchyUser.id && u.role === "manager");
      const assignedManagerIds = assignedManagers.map(m => m.id);
      baseTeamMembers = users.filter(u => u.role === "employee" && u.manager_id && assignedManagerIds.includes(u.manager_id));
    } else {
      // Regular admin viewing a specific manager
      baseTeamMembers = users.filter(u => u.manager_id === selectedHierarchyUser.id && u.role === "employee");
    }
  }

  const teamMembers = baseTeamMembers.filter(member => {
    // 1. Search Filter
    const matchesSearch = member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
                          member.email.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                          member.id.toString() === memberSearchTerm;
    if (!matchesSearch) return false;

    // 2. Status Filter
    const memberGoals = goals.filter(g => g.user_id === member.id)
    const memberTasks = tasks.filter(t => t.assigned_to === member.id || t.assignees?.some(a => a.id === member.id))
    const isIdle = memberGoals.length === 0 && memberTasks.length === 0

    if (statusFilter === "active" && isIdle) return false;
    if (statusFilter === "idle" && !isIdle) return false;

    return true;
  });

  const groupedMembers = teamMembers.reduce((acc, member) => {
    const mgrId = member.manager_id || 0;
    if (!acc[mgrId]) acc[mgrId] = [];
    acc[mgrId].push(member);
    return acc;
  }, {} as Record<number, UserType[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
              Teams Hub
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Oversee all reporting structures, manage your teams, and track employee performance stats.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Could not connect to API server. Viewing local session backup.</span>
          </div>
        )}

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Zap className="w-8 h-8 animate-pulse text-[var(--gf-indigo)]" />
            <p className="text-sm">Fetching management structure...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* Left Column: Manager List */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 h-10 border-slate-200 dark:border-white/[0.08]"
                  placeholder="Search managers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Card className="product-surface rounded-xl max-h-[600px] overflow-y-auto custom-scrollbar">
                <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-white/[0.04]">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isSuperAdmin ? "Admins" : "Managers"} ({hierarchyList.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {hierarchyList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No entries found.</div>
                  ) : (
                    hierarchyList.map((item) => {
                      const active = item.id === selectedHierarchyId
                      
                      let count = 0;
                      if (isSuperAdmin) {
                        const mgrIds = users.filter(u => u.admin_id === item.id && u.role === "manager").map(m => m.id);
                        count = users.filter(u => u.role === "employee" && u.manager_id && mgrIds.includes(u.manager_id)).length;
                      } else {
                        count = users.filter(u => u.manager_id === item.id && u.role === "employee").length;
                      }

                      return (
                        <button
                          key={item.id}
                          className={`w-full text-left p-3 rounded-lg text-xs font-medium transition-all flex justify-between items-center ${
                            active
                              ? "bg-[var(--gf-indigo)]/10 text-[var(--gf-indigo)] dark:text-indigo-300 border border-[var(--gf-indigo)]/20"
                              : "hover:bg-slate-100 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-400 border border-transparent"
                          }`}
                          onClick={() => setSelectedHierarchyId(item.id)}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold truncate text-slate-900 dark:text-white">{item.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate">{item.department}</p>
                              {item.admin_id && !isSuperAdmin && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 ml-1 truncate border border-indigo-200 dark:border-indigo-900/50">
                                  {users.find(u => u.id === item.admin_id)?.name || `ID:${item.admin_id}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-[10px] px-2 py-0.5 font-semibold">
                            {count} {count === 1 ? "Employee" : "Employees"}
                          </Badge>
                        </button>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Team Stats */}
            <div className="space-y-6">
              {selectedHierarchyUser ? (
                <div className="space-y-6">
                  {/* Selected Hierarchy Profile info */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] backdrop-blur-md shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gf-indigo)] to-[var(--gf-cyan)] text-white font-bold flex items-center justify-center shadow-lg shadow-[var(--gf-indigo)]/15">
                          {selectedHierarchyUser.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedHierarchyUser.name}</h2>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{selectedHierarchyUser.email}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100 border-none capitalize text-[10px] py-0 px-2 font-bold">
                              {selectedHierarchyUser.department} {selectedHierarchyUser.role.replace("_", " ")}
                            </Badge>
                            {selectedHierarchyUser.admin_id && !isSuperAdmin && (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/20 text-[10px] py-0 px-2 font-bold">
                                  Admin: {users.find(u => u.id === selectedHierarchyUser.admin_id)?.name || `ID: ${selectedHierarchyUser.admin_id}`}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Members List & Goals */}
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Team Portfolio
                      </h3>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          className="pl-9 h-9 text-sm"
                          placeholder="Filter by name, email or ID..."
                          value={memberSearchTerm}
                          onChange={(e) => setMemberSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex bg-slate-100 dark:bg-white/[0.05] p-1 rounded-lg">
                        <button onClick={() => setStatusFilter("all")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter === "all" ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>All</button>
                        <button onClick={() => setStatusFilter("active")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter === "active" ? "bg-white dark:bg-slate-800 shadow-sm text-[var(--gf-indigo)]" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Active (Working)</button>
                        <button onClick={() => setStatusFilter("idle")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${statusFilter === "idle" ? "bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Idle</button>
                      </div>
                    </div>

                    {teamMembers.length === 0 ? (
                      <div className="py-20 text-center glass-card rounded-2xl">
                        <User className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">No Employees Found</h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                          Try adjusting your search or status filters.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {Object.entries(groupedMembers).map(([mgrId, members]) => {
                          const manager = users.find(u => u.id === Number(mgrId));
                          return (
                            <div key={mgrId} className="mb-10">
                              {isSuperAdmin && manager && (
                                <div className="mb-4 pb-2 border-b border-slate-200 dark:border-white/[0.05]">
                                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{manager.name}'s Team</h4>
                                  <p className="text-xs text-slate-500">Manager • {manager.department}</p>
                                </div>
                              )}
                              <div className="grid gap-6 md:grid-cols-2">
                                {members.map((member) => {
                                  const memberGoals = goals.filter(g => g.user_id === member.id)
                                  const memberTasks = tasks.filter(t => 
                                    t.assigned_to === member.id || 
                                    t.assignees?.some(a => a.id === member.id)
                                  )
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
                                                {isSuperAdmin && member.manager_id && (
                                                  <span className="font-semibold text-[var(--gf-indigo)]">
                                                    {users.find(u => u.id === member.manager_id)?.name} • 
                                                  </span>
                                                )}{" "}
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
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-center glass-card rounded-2xl">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">No Selection Made</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Select an entry from the portfolio index to analyze the team's reporting structure and stats.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
