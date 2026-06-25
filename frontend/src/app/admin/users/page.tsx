"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { apiFetch } from "@/lib/api"
import { getStoredToken, getCurrentUser, requestOtp } from "@/services/auth.service"
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
  { id: 1, name: "Aarav Mehta", email: "aarav@example.com", role: "employee", department: "People Ops", active: true },
  { id: 2, name: "Priya Nair", email: "priya@example.com", role: "manager", department: "Engineering", active: true },
  { id: 3, name: "Rohan Kapoor", email: "rohan@example.com", role: "admin", department: "HR", active: true },
  { id: 4, name: "Neha Rao", email: "neha@example.com", role: "employee", department: "Engineering", active: true },
  { id: 5, name: "Kabir Singh", email: "kabir@example.com", role: "employee", department: "Sales", active: true },
  { id: 6, name: "Ananya Iyer", email: "ananya@example.com", role: "employee", department: "Marketing", active: false },
]

const roleColors: Record<string, string> = {
  employee: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  manager: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
}

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  active: boolean;
  is_approved?: boolean;
  is_active?: boolean;
  admin_id?: number | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(defaultUsers)
  const [isMounted, setIsMounted] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("employee")
  const [newDept, setNewDept] = useState("")

  // Edit Form state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("employee")
  const [editDept, setEditDept] = useState("")
  const [editActive, setEditActive] = useState(true)
  const [editAdminId, setEditAdminId] = useState<number | "">("")
  const [editManagerId, setEditManagerId] = useState<number | "">("")

  useEffect(() => {
    setIsMounted(true)
    const fetchUsers = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user as unknown as User)
      } catch (err) {
        console.error("Failed to fetch current user", err)
      }

      try {
        const token = getStoredToken()
        const data = await apiFetch<any[]>("/admin/users", { token })
        setUsers(data)
        setFetchError(false)
      } catch (err) {
        console.error("Failed to fetch users:", err)
        setFetchError(true)
        const stored = window.localStorage.getItem("goalforge.admin.users")
        if (stored) {
          setUsers(JSON.parse(stored))
        }
      }
    }
    fetchUsers()
  }, [])

  const saveUsers = (newUsers: typeof defaultUsers) => {
    setUsers(newUsers)
    window.localStorage.setItem("goalforge.admin.users", JSON.stringify(newUsers))
  }

  const handleAddUser = async () => {
    if (!newName || !newEmail || !newPassword) return
    
    try {
      const token = getStoredToken()
      const createdUser = await apiFetch<any>("/admin/register", {
        method: "POST",
        token,
        body: {
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          department: newDept || "Unassigned"
        }
      })
      
      const newUser = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        department: createdUser.department,
        active: true
      }
      saveUsers([...users, newUser])
      addLocalAuditLog({
        user: "Admin",
        action: "user_created",
        entity: "user",
        entityId: newEmail,
        detail: `Created new ${newRole} account for ${newName} via API`
      })
      setIsDialogOpen(false)
      setNewName("")
      setNewEmail("")
      setNewPassword("")
      setNewRole("employee")
      setNewDept("")
    } catch (err) {
      console.error("Failed to register user via API:", err)
      alert(err instanceof Error ? err.message : "Failed to register user")
    }
  }

  const openEditDialog = (user: any) => {
    setEditingUserId(user.id)
    setEditName(user.name || "")
    setEditRole(user.role || "employee")
    setEditDept(user.department || "")
    setEditActive(user.active ?? user.is_active ?? true)
    setEditAdminId(user.admin_id ?? "")
    setEditManagerId(user.manager_id ?? "")
    setIsEditDialogOpen(true)
  }

  const handleEditUser = async () => {
    if (!editingUserId || !editName) return
    
    try {
      const token = getStoredToken()
      await apiFetch<any>(`/admin/users/${editingUserId}`, {
        method: "PUT",
        token,
        body: {
          name: editName,
          role: editRole,
          department: editDept,
          is_active: editActive,
          ...(currentUser?.role === "super_admin" ? { admin_id: editAdminId === "" ? null : Number(editAdminId) } : {}),
          manager_id: editManagerId === "" ? null : Number(editManagerId)
        }
      })
      
      const updatedUsers = users.map(u => {
        if (u.id === editingUserId) {
          return { 
            ...u, 
            name: editName, 
            role: editRole, 
            department: editDept, 
            active: editActive, 
            is_active: editActive,
            ...(currentUser?.role === "super_admin" ? { admin_id: editAdminId === "" ? null : Number(editAdminId) } : {}),
            manager_id: editManagerId === "" ? null : Number(editManagerId)
          }
        }
        return u
      })
      
      saveUsers(updatedUsers)
      addLocalAuditLog({
        user: "Admin",
        action: "user_updated",
        entity: "user",
        entityId: editingUserId.toString(),
        detail: `Updated profile for ${editName}`
      })
      setIsEditDialogOpen(false)
    } catch (err) {
      console.error("Failed to edit user via API:", err)
      alert(err instanceof Error ? err.message : "Failed to edit user")
    }
  }

  const handleDeleteUser = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to completely delete the account for ${name}?`)) {
      try {
        const token = getStoredToken()
        
        if (!currentUser?.email) {
          alert("Could not determine your email for OTP verification.")
          return
        }
        
        // Request OTP
        await requestOtp(currentUser.email)
        const otp = prompt(`A critical action OTP has been sent to ${currentUser.email}. Please enter it to confirm deletion:`)
        if (!otp) {
          return
        }

        await apiFetch<any>(`/admin/users/${id}`, {
          method: "DELETE",
          token,
          headers: { "X-Critical-OTP": otp }
        })
        setUsers(users.filter(u => u.id !== id))
        addLocalAuditLog({
          user: "Admin",
          action: "user_deleted",
          entity: "user",
          entityId: id.toString(),
          detail: `Deleted user account for ${name}`
        })
      } catch (err) {
        console.error("Failed to delete user via API:", err)
        alert(err instanceof Error ? err.message : "Failed to delete user")
      }
    }
  }

  const handleApproveUser = async (id: number, name: string) => {
    try {
      const token = getStoredToken()
      await apiFetch<any>(`/admin/users/${id}/approve`, {
        method: "POST",
        token,
      })
      setUsers(users.map(u => u.id === id ? { ...u, is_approved: true } : u))
      addLocalAuditLog({
        user: "Admin",
        action: "user_approved",
        entity: "user",
        entityId: id.toString(),
        detail: `Approved user account for ${name}`
      })
      alert(`User ${name} approved successfully!`)
    } catch (err) {
      console.error("Failed to approve user:", err)
      alert(err instanceof Error ? err.message : "Failed to approve user")
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
          
          {fetchError && (
            <div className="w-full sm:w-auto rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
              Failed to connect to backend server. Using local cache.
            </div>
          )}

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
                    placeholder="john@example.com" 
                    className="border-slate-200 dark:border-white/[0.08] bg-transparent dark:text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-white/70">Password</label>
                  <Input 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    type="password"
                    placeholder="password123" 
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

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px] border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f13]">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">Edit User Profile</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-white/70">Full Name</label>
                  <Input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="border-slate-200 dark:border-white/[0.08] bg-transparent dark:text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-white/70">Platform Role</label>
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
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
                    value={editDept} 
                    onChange={(e) => setEditDept(e.target.value)} 
                    className="border-slate-200 dark:border-white/[0.08] bg-transparent dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="editActive" 
                    checked={editActive} 
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[var(--gf-indigo)] focus:ring-[var(--gf-indigo)]"
                  />
                  <label htmlFor="editActive" className="text-sm font-medium text-slate-700 dark:text-white/70">Account Active</label>
                </div>
                {currentUser?.role === "super_admin" && (
                  <div className="grid gap-2 mt-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-white/70">Assigned Admin</label>
                    <select 
                      value={editAdminId}
                      onChange={(e) => setEditAdminId(e.target.value ? Number(e.target.value) : "")}
                      className="flex h-10 w-full rounded-md border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--gf-indigo)]"
                    >
                      <option value="" className="dark:bg-[#0f0f13]">None</option>
                      {users.filter(u => u.role === "admin" || u.role === "super_admin").map(a => (
                        <option key={a.id} value={a.id} className="dark:bg-[#0f0f13]">{a.name} ({a.role})</option>
                      ))}
                    </select>
                  </div>
                )}
                {(currentUser?.role === "super_admin" || currentUser?.role === "admin") && editRole === "employee" && (
                  <div className="grid gap-2 mt-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-white/70">Assigned Manager</label>
                    <select 
                      value={editManagerId}
                      onChange={(e) => setEditManagerId(e.target.value ? Number(e.target.value) : "")}
                      className="flex h-10 w-full rounded-md border border-slate-200 dark:border-white/[0.08] bg-transparent px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--gf-indigo)]"
                    >
                      <option value="" className="dark:bg-[#0f0f13]">None</option>
                      {users
                        .filter(u => (u.role === "manager" || u.role === "admin" || u.role === "super_admin") && (currentUser?.role === "super_admin" || u.admin_id === currentUser?.id || u.id === currentUser?.id))
                        .map(m => (
                          <option key={m.id} value={m.id} className="dark:bg-[#0f0f13]">{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleEditUser} className="bg-[var(--gf-indigo)] hover:bg-[var(--gf-indigo)]/90 text-white">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <CardContent className="p-0 overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-200 dark:border-white/[0.08]">
                  <TableHead className="w-[250px] text-slate-500 dark:text-white/40">User</TableHead>
                  <TableHead className="text-slate-500 dark:text-white/40">Role</TableHead>
                  <TableHead className="text-slate-500 dark:text-white/40">Department</TableHead>
                  {currentUser?.role === "super_admin" && <TableHead className="text-slate-500 dark:text-white/40">Assigned Admin</TableHead>}
                  <TableHead className="text-slate-500 dark:text-white/40">Approval</TableHead>
                  <TableHead className="text-slate-500 dark:text-white/40">Status</TableHead>
                  <TableHead className="text-right text-slate-500 dark:text-white/40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.email} className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="font-medium text-slate-900 dark:text-white">{user.name}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-0 ${roleColors[user.role] || roleColors.employee}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-white/80">{user.department}</TableCell>
                    {currentUser?.role === "super_admin" && (
                      <TableCell className="text-slate-700 dark:text-white/80">
                        {user.admin_id ? users.find(u => u.id === user.admin_id)?.name || `ID: ${user.admin_id}` : "Unassigned"}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={user.is_approved !== false ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0"}>
                        {user.is_approved !== false ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={(user.active ?? user.is_active ?? true) ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0"}>
                        {(user.active ?? user.is_active ?? true) ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.is_approved === false && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                            onClick={() => handleApproveUser(user.id, user.name)}
                          >
                            Approve
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-slate-200 dark:border-white/[0.08] bg-transparent text-slate-700 dark:text-white/80"
                          onClick={() => openEditDialog(user)}
                        >
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
