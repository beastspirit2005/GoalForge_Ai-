import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const demoUsers = [
  { id: 1, name: "Aarav Mehta", email: "aarav@goalforge.ai", role: "employee", department: "People Ops", active: true },
  { id: 2, name: "Priya Nair", email: "priya@goalforge.ai", role: "manager", department: "Engineering", active: true },
  { id: 3, name: "Rohan Kapoor", email: "rohan@goalforge.ai", role: "admin", department: "HR", active: true },
  { id: 4, name: "Neha Rao", email: "neha@goalforge.ai", role: "employee", department: "Engineering", active: true },
  { id: 5, name: "Kabir Singh", email: "kabir@goalforge.ai", role: "employee", department: "Sales", active: true },
  { id: 6, name: "Ananya Iyer", email: "ananya@goalforge.ai", role: "employee", department: "Marketing", active: false },
]

const roleColors: Record<string, string> = {
  employee: "bg-sky-100 text-sky-700",
  manager: "bg-emerald-100 text-emerald-700",
  admin: "bg-violet-100 text-violet-700",
}

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              User management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage users, roles, and department assignments.
            </p>
          </div>
          <Button className="h-10 text-sm">Add user</Button>
        </div>

        <Card className="product-surface rounded-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-slate-500">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${roleColors[user.role]}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      <Badge className={user.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                        {user.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
