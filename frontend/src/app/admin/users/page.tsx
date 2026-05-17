"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, UserPlus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { addLocalAuditLog } from "@/lib/local-audit-logs"

const defaultUsers = [
  { id: 1, name: "Aarav Mehta", email: "aarav@goalforge.ai", role: "employee", department: "People Ops", active: true },
  { id: 2, name: "Priya Nair", email: "priya@goalforge.ai", role: "manager", department: "Engineering", active: true },
  { id: 3, name: "Rohan Kapoor", email: "rohan@goalforge.ai", role: "admin", department: "HR", active: true },
  { id: 4, name: "Neha Rao", email: "neha@goalforge.ai", role: "employee", department: "Engineering", active: true },
  { id: 5, name: "Kabir Singh", email: "kabir@goalforge.ai", role: "employee", department: "Sales", active: true },
  { id: 6, name: "Ananya Iyer", email: "ananya@goalforge.ai", role: "employee", department: "Marketing", active: false },
]

const roleColors: Record<string, string> = {
  employee: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  manager: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
}

export default function UsersPage() {
  const [users, setUsers] = useState(defaultUsers)
  const [isMounted, setIsMounted] = useState(false)
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState("employee")
  const [newDept, setNewDept] = useState("")

  useEffect(() => {
    setIsMounted(true)
    const stored = window.localStorage.getItem("goalforge.admin.users")
    if (stored) {
      setUsers(JSON.parse(stored))
    }
  }, [])

  const saveUsers = (newUsers: typeof defaultUsers) => {
    setUsers(newUsers)
    window.localStorage.setItem("goalforge.admin.users", JSON.stringify(newUsers))
  }

  const handleAddUser = () => {
    if (!newName || !newEmail) return
    const newUser = {
      id: Date.now(),
      name: newName,
      email: newEmail,
      role: newRole,
      department: newDept || "Unassigned",
      active: true
    }
    saveUsers([...users, newUser])
    addLocalAuditLog({
      user: "Admin",
      action: "user_created",
      entity: "user",
      entityId: newEmail,
      detail: `Created new ${newRole} account for ${newName}`
    })
    setIsDialogOpen(false)
    setNewName("")
    setNewEmail("")
    setNewRole("employee")
    setNewDept("")
  }

  const handleDeleteUser = (id: number, name: string) => {
    if (confirm(`Are you sure you want to completely delete the account for ${name}?`)) {
      saveUsers(users.filter(u => u.id !== id))
      addLocalAuditLog({
        user: "Admin",
        action: "user_deleted",
        entity: "user",
        entityId: id.toString(),
        detail: `Deleted user account for ${name}`
      })
    }
  }

  if (!isMounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              User management
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-white/40">
              Manage users, assign administrative roles, and handle onboarding or offboarding.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 gap-2 bg-[var(--gf-indigo)] hover:bg-[var(--gf-indigo)]/90 text-white">
                <UserPlus className="h-4 w-4" />
                Add user
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f13]">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">Add New Platform User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-white/70">Full Name</label>
                  <Input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="e.g. John Doe" 
                    className="border-slate-200 dark:border-white/[0.08] bg-transparent dark:text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-white/70">Email Address</label>
                  <Input 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    placeholder="john@goalforge.ai" 
                    className="border-slate-200 dark:border-white/[0.08] bg-transparent dark:text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-white/70">Platform Role</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--gf-indigo)]"
                  >
                    <option value="employee" className="dark:bg-[#0f0f13]">Employee (Standard)</option>
                    <option value="manager" className="dark:bg-[#0f0f13]">Manager (Elevated)</option>
                    <option value="admin" className="dark:bg-[#0f0f13]">Admin (Full Access)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-white/70">Department</label>
                  <Input 
                    value={newDept} 
                    onChange={(e) => setNewDept(e.target.value)} 
                    placeholder="e.g. Engineering" 
                    className="border-slate-200 dark:border-white/[0.08] bg-transparent dark:text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddUser} className="bg-[var(--gf-indigo)] hover:bg-[var(--gf-indigo)]/90 text-white">
                  Create Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <CardContent className="p-0 overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-slate-500 dark:text-white/40">Name</TableHead>
                  <TableHead className="text-slate-500 dark:text-white/40">Email</TableHead>
                  <TableHead className="text-slate-500 dark:text-white/40">Role</TableHead>
                  <TableHead className="text-slate-500 dark:text-white/40">Department</TableHead>
                  <TableHead className="text-slate-500 dark:text-white/40">Status</TableHead>
                  <TableHead className="text-right text-slate-500 dark:text-white/40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="font-medium text-slate-900 dark:text-white">{user.name}</TableCell>
                    <TableCell className="text-slate-500 dark:text-white/60">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-0 ${roleColors[user.role] || roleColors.employee}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-white/80">{user.department}</TableCell>
                    <TableCell>
                      <Badge className={user.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0"}>
                        {user.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 border-slate-200 dark:border-white/[0.08] bg-transparent text-slate-700 dark:text-white/80">
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          title="Delete user"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="h-8 w-8 border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500 dark:text-white/40">
                      No users found on the platform.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
